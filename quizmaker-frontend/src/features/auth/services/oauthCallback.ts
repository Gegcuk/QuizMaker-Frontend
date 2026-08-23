import { setTokens } from '@/utils';
import {
  OAUTH_PENDING_MAX_AGE_MS,
  clearPendingOAuthFlow,
  consumePendingOAuthFlow,
} from './oauthPkce';
import { exchangeOAuthCode } from './oauthExchange';
import { SENSITIVE_RETURN_STORAGE_KEYS } from '@/features/privacy/sensitiveReturn';

export const OAUTH_CALLBACK_STORAGE_KEY = SENSITIVE_RETURN_STORAGE_KEYS.oauthCallback;

const CALLBACK_CODE = /^[A-Za-z0-9_-]{43}$/;
const CALLBACK_ERRORS = new Set([
  'oauth_access_denied',
  'oauth_authentication_failed',
  'oauth_flow_invalid',
  'oauth_login_temporarily_unavailable',
  'oauth_login_failed',
]);

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  oauth_access_denied: 'Sign-in was cancelled. Please try again when you are ready.',
  oauth_authentication_failed: 'The provider could not complete sign-in. Please try again.',
  oauth_flow_invalid: 'This sign-in request is no longer valid. Please restart sign-in.',
  oauth_login_temporarily_unavailable: 'Sign-in is temporarily unavailable. Please try again shortly.',
  oauth_login_failed: 'Authentication failed. Please restart sign-in.',
};

interface CapturedOAuthCallback {
  version: 1;
  kind: 'code' | 'error';
  value: string;
  capturedAt: number;
}

export interface ProcessedOAuthCallback {
  returnPath: string;
}

interface OAuthCallbackRuntime {
  exchange?: typeof exchangeOAuthCode;
  now?: number;
  origin?: string;
  storage?: Storage;
  storeTokens?: typeof setTokens;
}

export class OAuthCallbackError extends Error {
  constructor(public readonly outcome: string, message: string) {
    super(message);
    this.name = 'OAuthCallbackError';
  }
}

let activeCallback: Promise<ProcessedOAuthCallback> | null = null;

const consumeCapturedCallback = (
  storage: Storage,
  now: number,
): CapturedOAuthCallback | null => {
  const serialized = storage.getItem(OAUTH_CALLBACK_STORAGE_KEY);
  storage.removeItem(OAUTH_CALLBACK_STORAGE_KEY);
  if (!serialized) {
    return null;
  }

  try {
    const callback = JSON.parse(serialized) as Partial<CapturedOAuthCallback>;
    const validAge = typeof callback.capturedAt === 'number'
      && now >= callback.capturedAt
      && now - callback.capturedAt <= OAUTH_PENDING_MAX_AGE_MS;
    const validValue = callback.kind === 'code'
      ? typeof callback.value === 'string' && CALLBACK_CODE.test(callback.value)
      : callback.kind === 'error'
        && typeof callback.value === 'string'
        && CALLBACK_ERRORS.has(callback.value);

    return callback.version === 1 && validAge && validValue
      ? callback as CapturedOAuthCallback
      : null;
  } catch {
    return null;
  }
};

const processCapturedCallback = async (
  runtime: OAuthCallbackRuntime,
): Promise<ProcessedOAuthCallback> => {
  const storage = runtime.storage ?? sessionStorage;
  const now = runtime.now ?? Date.now();
  const origin = runtime.origin ?? window.location.origin;
  const callback = consumeCapturedCallback(storage, now);

  if (!callback) {
    clearPendingOAuthFlow(storage);
    throw new OAuthCallbackError(
      'missing_callback',
      'This sign-in request is missing or expired. Please restart sign-in.',
    );
  }

  if (callback.kind === 'error') {
    clearPendingOAuthFlow(storage);
    throw new OAuthCallbackError(
      callback.value,
      CALLBACK_ERROR_MESSAGES[callback.value] || 'Authentication failed. Please restart sign-in.',
    );
  }

  const pending = consumePendingOAuthFlow({ storage, now, origin });
  if (!pending) {
    throw new OAuthCallbackError(
      'invalid_pending_flow',
      'This sign-in request is missing or expired. Please restart sign-in.',
    );
  }

  const exchange = runtime.exchange ?? exchangeOAuthCode;
  const tokens = await exchange({
    code: callback.value,
    clientId: pending.clientId,
    redirectUri: pending.redirectUri,
    codeVerifier: pending.codeVerifier,
  });
  const storeTokens = runtime.storeTokens ?? setTokens;
  storeTokens(tokens.accessToken, tokens.refreshToken);

  return { returnPath: pending.returnPath };
};

export const processOAuthCallbackOnce = (
  runtime: OAuthCallbackRuntime = {},
): Promise<ProcessedOAuthCallback> => {
  if (!activeCallback) {
    activeCallback = processCapturedCallback(runtime);
  }
  return activeCallback;
};

export const resetOAuthCallbackProcessingForTests = () => {
  activeCallback = null;
};
