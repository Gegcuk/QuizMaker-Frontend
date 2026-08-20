import type { OAuthProvider } from '../types/auth.types';

export const OAUTH_WEB_CLIENT_ID = 'quizzence-web';
export const OAUTH_CALLBACK_PATH = '/oauth2/redirect';
export const OAUTH_PENDING_STORAGE_KEY = 'quizzence:oauth:pending:v1';
export const OAUTH_PENDING_MAX_AGE_MS = 2 * 60 * 1000;

const SUPPORTED_PROVIDERS = new Set<OAuthProvider>(['GOOGLE', 'GITHUB']);
const CALLBACK_PATHS = new Set(['/oauth2/redirect', '/oauth/callback']);

export type OAuthFlowPurpose = 'login' | 'register' | 'link';

export interface PendingOAuthFlow {
  version: 1;
  provider: 'GOOGLE' | 'GITHUB';
  purpose: OAuthFlowPurpose;
  clientId: typeof OAUTH_WEB_CLIENT_ID;
  redirectUri: string;
  codeVerifier: string;
  createdAt: number;
  returnPath: string;
}

export interface PreparedOAuthAuthorization {
  authorizationUrl: string;
  pending: PendingOAuthFlow;
}

interface OAuthAuthorizationRuntime {
  cryptoImpl?: Crypto;
  location?: Pick<Location, 'origin'>;
  navigate?: (authorizationUrl: string) => void;
  now?: number;
  storage?: Storage;
}

const requireWebCrypto = (cryptoImpl: Crypto | undefined): Crypto => {
  if (!cryptoImpl?.getRandomValues || !cryptoImpl.subtle?.digest) {
    throw new Error('Secure sign-in is unavailable in this browser.');
  }

  return cryptoImpl;
};

const encodeBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const createCodeVerifier = (cryptoImpl: Crypto = globalThis.crypto): string => {
  const secureCrypto = requireWebCrypto(cryptoImpl);
  const bytes = new Uint8Array(32);
  secureCrypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
};

export const createCodeChallenge = async (
  verifier: string,
  cryptoImpl: Crypto = globalThis.crypto,
): Promise<string> => {
  const secureCrypto = requireWebCrypto(cryptoImpl);
  const digest = await secureCrypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return encodeBase64Url(new Uint8Array(digest));
};

export const validateOAuthReturnPath = (value: string | undefined, origin: string): string => {
  const fallback = '/my-quizzes';
  const hasControlCharacter = value
    ? Array.from(value).some((character) => {
        const codePoint = character.codePointAt(0) ?? 0;
        return codePoint <= 31 || codePoint === 127;
      })
    : false;

  if (!value || value.length > 2048 || hasControlCharacter) {
    return fallback;
  }
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }

  try {
    const parsed = new URL(value, origin);
    if (parsed.origin !== origin || CALLBACK_PATHS.has(parsed.pathname)) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
};

const isSupportedProvider = (provider: OAuthProvider): provider is PendingOAuthFlow['provider'] =>
  SUPPORTED_PROVIDERS.has(provider);

export const prepareOAuthAuthorization = async ({
  provider,
  purpose,
  returnPath,
  location = window.location,
  cryptoImpl = globalThis.crypto,
  now = Date.now(),
}: {
  provider: OAuthProvider;
  purpose: OAuthFlowPurpose;
  returnPath?: string;
  location?: Pick<Location, 'origin'>;
  cryptoImpl?: Crypto;
  now?: number;
}): Promise<PreparedOAuthAuthorization> => {
  if (!isSupportedProvider(provider)) {
    throw new Error('This sign-in provider is not supported.');
  }

  const codeVerifier = createCodeVerifier(cryptoImpl);
  const codeChallenge = await createCodeChallenge(codeVerifier, cryptoImpl);
  const redirectUri = new URL(OAUTH_CALLBACK_PATH, location.origin).toString();
  const pending: PendingOAuthFlow = {
    version: 1,
    provider,
    purpose,
    clientId: OAUTH_WEB_CLIENT_ID,
    redirectUri,
    codeVerifier,
    createdAt: now,
    returnPath: validateOAuthReturnPath(returnPath, location.origin),
  };

  const authorizationUrl = new URL(
    `/oauth2/authorization/${provider.toLowerCase()}`,
    location.origin,
  );
  authorizationUrl.searchParams.set('client_id', OAUTH_WEB_CLIENT_ID);
  authorizationUrl.searchParams.set('redirect_uri', redirectUri);
  authorizationUrl.searchParams.set('code_challenge', codeChallenge);
  authorizationUrl.searchParams.set('code_challenge_method', 'S256');
  if (purpose === 'link') {
    authorizationUrl.searchParams.set('action', 'link');
  }

  return { authorizationUrl: authorizationUrl.toString(), pending };
};

export const storePendingOAuthFlow = (
  pending: PendingOAuthFlow,
  storage: Storage = sessionStorage,
) => {
  storage.setItem(OAUTH_PENDING_STORAGE_KEY, JSON.stringify(pending));
};

export const clearPendingOAuthFlow = (storage: Storage = sessionStorage) => {
  storage.removeItem(OAUTH_PENDING_STORAGE_KEY);
};

export const startOAuthAuthorization = async (
  options: {
    provider: OAuthProvider;
    purpose: OAuthFlowPurpose;
    returnPath?: string;
  },
  runtime: OAuthAuthorizationRuntime = {},
): Promise<void> => {
  const prepared = await prepareOAuthAuthorization({
    ...options,
    cryptoImpl: runtime.cryptoImpl,
    location: runtime.location,
    now: runtime.now,
  });
  storePendingOAuthFlow(prepared.pending, runtime.storage);
  const navigate = runtime.navigate ?? ((authorizationUrl: string) => window.location.assign(authorizationUrl));
  navigate(prepared.authorizationUrl);
};

export const consumePendingOAuthFlow = ({
  storage = sessionStorage,
  now = Date.now(),
  origin = window.location.origin,
}: {
  storage?: Storage;
  now?: number;
  origin?: string;
} = {}): PendingOAuthFlow | null => {
  const serialized = storage.getItem(OAUTH_PENDING_STORAGE_KEY);
  storage.removeItem(OAUTH_PENDING_STORAGE_KEY);
  if (!serialized) {
    return null;
  }

  try {
    const pending = JSON.parse(serialized) as Partial<PendingOAuthFlow>;
    const redirectUri = new URL(OAUTH_CALLBACK_PATH, origin).toString();
    const valid =
      pending.version === 1 &&
      (pending.provider === 'GOOGLE' || pending.provider === 'GITHUB') &&
      (pending.purpose === 'login' || pending.purpose === 'register' || pending.purpose === 'link') &&
      pending.clientId === OAUTH_WEB_CLIENT_ID &&
      pending.redirectUri === redirectUri &&
      typeof pending.codeVerifier === 'string' &&
      /^[A-Za-z0-9_-]{43}$/.test(pending.codeVerifier) &&
      typeof pending.createdAt === 'number' &&
      now >= pending.createdAt &&
      now - pending.createdAt <= OAUTH_PENDING_MAX_AGE_MS &&
      typeof pending.returnPath === 'string' &&
      validateOAuthReturnPath(pending.returnPath, origin) === pending.returnPath;

    return valid ? pending as PendingOAuthFlow : null;
  } catch {
    return null;
  }
};
