import { describe, expect, it, vi } from 'vitest';
import {
  OAUTH_PENDING_MAX_AGE_MS,
  OAUTH_PENDING_STORAGE_KEY,
  clearPendingOAuthFlow,
  consumePendingOAuthFlow,
  createCodeChallenge,
  createCodeVerifier,
  prepareOAuthAuthorization,
  startOAuthAuthorization,
  storePendingOAuthFlow,
  validateOAuthReturnPath,
} from './oauthPkce';

const RFC_7636_VERIFIER = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const RFC_7636_CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

describe('OAuth PKCE utilities', () => {
  it('matches the RFC 7636 S256 example', async () => {
    await expect(createCodeChallenge(RFC_7636_VERIFIER)).resolves.toBe(RFC_7636_CHALLENGE);
  });

  it('creates a 43-character verifier from 32 secure random bytes', () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.forEach((_, index) => {
        bytes[index] = index;
      });
      return bytes;
    });
    const cryptoImpl = { getRandomValues, subtle: crypto.subtle } as unknown as Crypto;

    const verifier = createCodeVerifier(cryptoImpl);

    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('fails closed when secure browser crypto is unavailable', async () => {
    const unavailableCrypto = {} as Crypto;

    expect(() => createCodeVerifier(unavailableCrypto)).toThrow('Secure sign-in is unavailable');
    await expect(createCodeChallenge(RFC_7636_VERIFIER, unavailableCrypto)).rejects.toThrow(
      'Secure sign-in is unavailable',
    );
  });

  it('builds one exact S256 authorization binding for supported providers', async () => {
    const prepared = await prepareOAuthAuthorization({
      provider: 'GOOGLE',
      purpose: 'login',
      returnPath: '/my-attempts?filter=active',
      location: { origin: 'https://www.quizzence.com' },
      now: 1000,
    });
    const url = new URL(prepared.authorizationUrl);

    expect(url.pathname).toBe('/oauth2/authorization/google');
    expect([...url.searchParams.getAll('client_id')]).toEqual(['quizzence-web']);
    expect([...url.searchParams.getAll('redirect_uri')]).toEqual([
      'https://www.quizzence.com/oauth2/redirect',
    ]);
    expect(url.searchParams.getAll('code_challenge')).toHaveLength(1);
    expect(url.searchParams.getAll('code_challenge_method')).toEqual(['S256']);
    expect(prepared.pending).toMatchObject({
      version: 1,
      provider: 'GOOGLE',
      purpose: 'login',
      returnPath: '/my-attempts?filter=active',
    });
  });

  it('keeps account-link purpose while rejecting unsupported providers', async () => {
    const prepared = await prepareOAuthAuthorization({
      provider: 'GITHUB',
      purpose: 'link',
      location: { origin: 'https://www.quizzence.com' },
    });

    expect(new URL(prepared.authorizationUrl).searchParams.get('action')).toBe('link');
    await expect(
      prepareOAuthAuthorization({
        provider: 'FACEBOOK',
        purpose: 'login',
        location: { origin: 'https://www.quizzence.com' },
      }),
    ).rejects.toThrow('not supported');
  });

  it.each([
    ['https://attacker.example/path'],
    ['//attacker.example/path'],
    ['/oauth2/redirect'],
    ['/oauth/callback?again=true'],
    ['/path\\redirect'],
    [`/path${String.fromCharCode(10)}redirect`],
  ])('rejects unsafe return path %s', (returnPath) => {
    expect(validateOAuthReturnPath(returnPath, 'https://www.quizzence.com')).toBe('/my-quizzes');
  });

  it('stores one tab-scoped flow, consumes it once, and rejects expiry', async () => {
    const { pending } = await prepareOAuthAuthorization({
      provider: 'GITHUB',
      purpose: 'register',
      location: { origin: 'https://www.quizzence.com' },
      now: 1000,
    });

    storePendingOAuthFlow(pending);
    expect(sessionStorage.getItem(OAUTH_PENDING_STORAGE_KEY)).not.toContain('undefined');
    expect(
      consumePendingOAuthFlow({ now: 1000 + OAUTH_PENDING_MAX_AGE_MS, origin: 'https://www.quizzence.com' }),
    ).toEqual(pending);
    expect(consumePendingOAuthFlow({ origin: 'https://www.quizzence.com' })).toBeNull();

    storePendingOAuthFlow(pending);
    expect(
      consumePendingOAuthFlow({ now: 1001 + OAUTH_PENDING_MAX_AGE_MS, origin: 'https://www.quizzence.com' }),
    ).toBeNull();
    expect(sessionStorage.getItem(OAUTH_PENDING_STORAGE_KEY)).toBeNull();
  });

  it('replaces and clears the prior pending flow in the same tab', async () => {
    const first = await prepareOAuthAuthorization({
      provider: 'GOOGLE',
      purpose: 'login',
      location: { origin: 'https://www.quizzence.com' },
      now: 1000,
    });
    const second = await prepareOAuthAuthorization({
      provider: 'GITHUB',
      purpose: 'link',
      location: { origin: 'https://www.quizzence.com' },
      now: 2000,
    });

    storePendingOAuthFlow(first.pending);
    storePendingOAuthFlow(second.pending);
    expect(JSON.parse(sessionStorage.getItem(OAUTH_PENDING_STORAGE_KEY)!)).toMatchObject({
      provider: 'GITHUB',
      purpose: 'link',
    });

    clearPendingOAuthFlow();
    expect(sessionStorage.getItem(OAUTH_PENDING_STORAGE_KEY)).toBeNull();
  });

  it('stores pending context before navigating through the shared coordinator', async () => {
    const navigate = vi.fn();

    await startOAuthAuthorization(
      {
        provider: 'GOOGLE',
        purpose: 'register',
        returnPath: '/my-quizzes',
      },
      {
        location: { origin: 'https://www.quizzence.com' },
        navigate,
        now: 1000,
      },
    );

    expect(sessionStorage.getItem(OAUTH_PENDING_STORAGE_KEY)).not.toBeNull();
    expect(navigate).toHaveBeenCalledOnce();
    expect(new URL(navigate.mock.calls[0][0]).pathname).toBe('/oauth2/authorization/google');
  });

  it('does not store or navigate when PKCE setup fails', async () => {
    const navigate = vi.fn();

    await expect(
      startOAuthAuthorization(
        { provider: 'GITHUB', purpose: 'login' },
        {
          cryptoImpl: {} as Crypto,
          location: { origin: 'https://www.quizzence.com' },
          navigate,
        },
      ),
    ).rejects.toThrow('Secure sign-in is unavailable');

    expect(sessionStorage.getItem(OAUTH_PENDING_STORAGE_KEY)).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not navigate when tab-scoped storage rejects the pending secret', async () => {
    const navigate = vi.fn();
    const storage = {
      setItem: vi.fn(() => {
        throw new DOMException('Storage unavailable');
      }),
    } as unknown as Storage;

    await expect(
      startOAuthAuthorization(
        { provider: 'GITHUB', purpose: 'link', returnPath: '/settings' },
        {
          location: { origin: 'https://www.quizzence.com' },
          navigate,
          storage,
        },
      ),
    ).rejects.toThrow('Storage unavailable');

    expect(navigate).not.toHaveBeenCalled();
  });
});
