import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OAUTH_CALLBACK_STORAGE_KEY,
  OAUTH_LEGACY_TEST_STORAGE_KEY,
  OAuthCallbackError,
  processLegacyOAuthCallbackForTestOnce,
  processOAuthCallbackOnce,
  resetOAuthCallbackProcessingForTests,
} from './oauthCallback';
import { prepareOAuthAuthorization, storePendingOAuthFlow } from './oauthPkce';

const now = 10_000;
const origin = 'http://localhost:3000';
const code = 'C'.repeat(43);
const tokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  accessExpiresInMs: 43_200_000,
  refreshExpiresInMs: 345_600_000,
};

const storeCodeCallback = () => {
  sessionStorage.setItem(OAUTH_CALLBACK_STORAGE_KEY, JSON.stringify({
    version: 1,
    kind: 'code',
    value: code,
    capturedAt: now,
  }));
};

describe('OAuth callback processing', () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetOAuthCallbackProcessingForTests();
  });

  it('exchanges and stores one secure callback exactly once', async () => {
    const prepared = await prepareOAuthAuthorization({
      provider: 'GOOGLE',
      purpose: 'login',
      returnPath: '/quizzes',
      location: { origin },
      now,
    });
    storePendingOAuthFlow(prepared.pending);
    storeCodeCallback();
    const exchange = vi.fn().mockResolvedValue(tokens);
    const storeTokens = vi.fn();

    const first = processOAuthCallbackOnce({ exchange, storeTokens, now, origin });
    const second = processOAuthCallbackOnce({ exchange, storeTokens, now, origin });

    await expect(first).resolves.toEqual({ returnPath: '/quizzes' });
    await expect(second).resolves.toEqual({ returnPath: '/quizzes' });
    expect(exchange).toHaveBeenCalledOnce();
    expect(exchange).toHaveBeenCalledWith({
      code,
      clientId: 'quizzence-web',
      redirectUri: 'http://localhost:3000/oauth2/redirect',
      codeVerifier: prepared.pending.codeVerifier,
    });
    expect(storeTokens).toHaveBeenCalledOnce();
    expect(sessionStorage.length).toBe(0);
  });

  it('rejects expired callback state without making an exchange request', async () => {
    storeCodeCallback();
    const exchange = vi.fn();

    const error = await processOAuthCallbackOnce({
      exchange,
      now: now + 120_001,
      origin,
    }).catch((reason) => reason);

    expect(error).toBeInstanceOf(OAuthCallbackError);
    expect(error.outcome).toBe('missing_callback');
    expect(exchange).not.toHaveBeenCalled();
  });

  it('maps a bounded provider error and clears pending PKCE context', async () => {
    const prepared = await prepareOAuthAuthorization({
      provider: 'GITHUB',
      purpose: 'login',
      location: { origin },
      now,
    });
    storePendingOAuthFlow(prepared.pending);
    sessionStorage.setItem(OAUTH_CALLBACK_STORAGE_KEY, JSON.stringify({
      version: 1,
      kind: 'error',
      value: 'oauth_access_denied',
      capturedAt: now,
    }));

    const error = await processOAuthCallbackOnce({ now, origin }).catch((reason) => reason);

    expect(error).toBeInstanceOf(OAuthCallbackError);
    expect(error.outcome).toBe('oauth_access_denied');
    expect(error.message).not.toContain('description');
    expect(sessionStorage.length).toBe(0);
  });

  it('consumes the temporary legacy callback once for comparison testing', async () => {
    sessionStorage.setItem('oauth_redirect', '/my-attempts');
    sessionStorage.setItem(OAUTH_LEGACY_TEST_STORAGE_KEY, JSON.stringify({
      version: 1,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      capturedAt: now,
    }));
    const storeTokens = vi.fn();

    const first = processLegacyOAuthCallbackForTestOnce({ storeTokens, now });
    const second = processLegacyOAuthCallbackForTestOnce({ storeTokens, now });

    await expect(first).resolves.toMatchObject({ returnPath: '/my-attempts' });
    await expect(second).resolves.toMatchObject({ returnPath: '/my-attempts' });
    expect(storeTokens).toHaveBeenCalledOnce();
    expect(sessionStorage.length).toBe(0);
  });
});
