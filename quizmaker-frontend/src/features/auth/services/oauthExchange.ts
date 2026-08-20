import type { JwtResponse, OAuthCodeExchangeRequest } from '../types/auth.types';

export const OAUTH_EXCHANGE_ENDPOINT = '/api/v1/auth/oauth/exchange';

const RESPONSE_MESSAGES: Record<number, string> = {
  400: 'This sign-in request is invalid. Please restart sign-in.',
  401: 'This sign-in code is invalid or expired. Please restart sign-in.',
  409: 'This sign-in code has already been used. Please restart sign-in.',
  429: 'Too many sign-in attempts. Please wait briefly and try again.',
  503: 'Sign-in is temporarily unavailable. Please try again shortly.',
};

export class OAuthExchangeError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = 'OAuthExchangeError';
  }
}

const parseRetryAfter = (value: string | null): number | null => {
  if (!value || !/^\d{1,4}$/.test(value)) {
    return null;
  }

  const seconds = Number(value);
  return Number.isSafeInteger(seconds) && seconds <= 3600 ? seconds : null;
};

const isJwtResponse = (value: unknown): value is JwtResponse => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const response = value as Partial<JwtResponse>;
  return typeof response.accessToken === 'string'
    && response.accessToken.length > 0
    && typeof response.refreshToken === 'string'
    && response.refreshToken.length > 0
    && typeof response.accessExpiresInMs === 'number'
    && Number.isFinite(response.accessExpiresInMs)
    && typeof response.refreshExpiresInMs === 'number'
    && Number.isFinite(response.refreshExpiresInMs);
};

export const exchangeOAuthCode = async (
  request: OAuthCodeExchangeRequest,
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<JwtResponse> => {
  let response: Response;
  try {
    response = await fetchImpl(OAUTH_EXCHANGE_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
    });
  } catch {
    throw new OAuthExchangeError(
      'Unable to complete sign-in. Check your connection and restart sign-in.',
      null,
    );
  }

  if (!response.ok) {
    throw new OAuthExchangeError(
      RESPONSE_MESSAGES[response.status] || 'Authentication failed. Please restart sign-in.',
      response.status,
      parseRetryAfter(response.headers.get('Retry-After')),
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new OAuthExchangeError('Authentication failed. Please restart sign-in.', response.status);
  }

  if (!isJwtResponse(payload)) {
    throw new OAuthExchangeError('Authentication failed. Please restart sign-in.', response.status);
  }

  return payload;
};
