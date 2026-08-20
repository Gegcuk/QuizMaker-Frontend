import { describe, expect, it, vi } from 'vitest';
import { OAuthExchangeError, exchangeOAuthCode } from './oauthExchange';

const request = {
  code: 'C'.repeat(43),
  clientId: 'quizzence-web',
  redirectUri: 'http://localhost:3000/oauth2/redirect',
  codeVerifier: 'V'.repeat(43),
};

const tokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  accessExpiresInMs: 43_200_000,
  refreshExpiresInMs: 345_600_000,
};

describe('exchangeOAuthCode', () => {
  it('uses the exact anonymous request contract without auth credentials', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify(tokens), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    await expect(exchangeOAuthCode(request, fetchImpl)).resolves.toEqual(tokens);

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('/api/v1/auth/oauth/exchange');
    expect(init).toMatchObject({
      method: 'POST',
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      body: JSON.stringify(request),
    });
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it.each([
    [400, 'invalid'],
    [401, 'invalid or expired'],
    [409, 'already been used'],
    [429, 'wait briefly'],
    [503, 'temporarily unavailable'],
  ])('maps status %s to bounded copy', async (status, copy) => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('secret backend detail', {
      status,
      headers: { 'Retry-After': '5' },
    }));

    const error = await exchangeOAuthCode(request, fetchImpl).catch((reason) => reason);

    expect(error).toBeInstanceOf(OAuthExchangeError);
    expect(error.message).toContain(copy);
    expect(error.message).not.toContain('secret backend detail');
    expect(error.retryAfterSeconds).toBe(5);
  });

  it('maps network failures without exposing the underlying exception', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('secret network detail'));

    const error = await exchangeOAuthCode(request, fetchImpl).catch((reason) => reason);

    expect(error).toBeInstanceOf(OAuthExchangeError);
    expect(error.status).toBeNull();
    expect(error.message).not.toContain('secret network detail');
  });
});
