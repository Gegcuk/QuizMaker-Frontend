export const SENSITIVE_RETURN_MAX_AGE_MS = 5 * 60 * 1000;

export const SENSITIVE_RETURN_STORAGE_KEYS = {
  passwordReset: 'quizzence:auth:password-reset:v1',
  emailVerification: 'quizzence:auth:email-verification:v1',
  billingCheckout: 'quizzence:billing:checkout-return:v1',
  oauthCallback: 'quizzence:oauth:callback:v1',
} as const;

export type SensitiveReturnKind = keyof typeof SENSITIVE_RETURN_STORAGE_KEYS;

interface PasswordResetValues {
  token: string;
}

interface EmailVerificationValues {
  token: string | null;
  email: string | null;
}

interface BillingCheckoutValues {
  sessionId: string;
}

interface SensitiveReturnValues {
  passwordReset: PasswordResetValues;
  emailVerification: EmailVerificationValues;
  billingCheckout: BillingCheckoutValues;
}

type ConsumableSensitiveReturnKind = keyof SensitiveReturnValues;

interface SensitiveReturnRecord<K extends ConsumableSensitiveReturnKind> {
  version: 1;
  kind: K;
  capturedAt: number;
  values: SensitiveReturnValues[K];
}

interface OAuthCallbackRecord {
  version: 1;
  kind: 'code' | 'error';
  value: string;
  capturedAt: number;
}

interface SensitiveLocation {
  pathname: string;
  search: string;
  hash: string;
}

const OAUTH_CALLBACK_PATHS = new Set(['/oauth2/redirect', '/oauth/callback']);
const OAUTH_CALLBACK_CODE = /^[A-Za-z0-9_-]{43}$/;
const PARAMETER_LIMITS = {
  passwordResetToken: 2048,
  emailVerificationToken: 512,
  email: 320,
  checkoutSessionId: 512,
} as const;
const OAUTH_CALLBACK_ERRORS = new Set([
  'oauth_access_denied',
  'oauth_authentication_failed',
  'oauth_flow_invalid',
  'oauth_login_temporarily_unavailable',
  'oauth_login_failed',
]);

const normalizePathname = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

const readBoundedParam = (
  params: URLSearchParams,
  name: string,
  maxLength: number,
): string | null => {
  const value = params.get(name)?.trim();
  return value && value.length <= maxLength ? value : null;
};

const isCurrentRecord = (capturedAt: unknown, now: number) =>
  typeof capturedAt === 'number'
  && Number.isFinite(capturedAt)
  && now >= capturedAt
  && now - capturedAt <= SENSITIVE_RETURN_MAX_AGE_MS;

const safeSetItem = (storage: Storage | null, key: string, value: unknown) => {
  if (!storage) return;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // URL cleanup must still proceed when tab storage is unavailable.
  }
};

export const getSessionStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const isSensitiveReturnPath = (pathname: string) => {
  const normalizedPath = normalizePathname(pathname);
  return normalizedPath === '/reset-password'
    || normalizedPath === '/verify-email'
    || normalizedPath === '/billing/success'
    || OAUTH_CALLBACK_PATHS.has(normalizedPath);
};

export const shouldSanitizeSensitiveLocation = (location: SensitiveLocation) =>
  isSensitiveReturnPath(location.pathname) && Boolean(location.search || location.hash);

export const captureSensitiveReturn = (
  location: SensitiveLocation,
  storage: Storage | null = getSessionStorage(),
  now = Date.now(),
) => {
  const pathname = normalizePathname(location.pathname);
  const params = new URLSearchParams(location.search);

  if (pathname === '/reset-password') {
    const token = readBoundedParam(params, 'token', PARAMETER_LIMITS.passwordResetToken);
    if (token) {
      const record: SensitiveReturnRecord<'passwordReset'> = {
        version: 1,
        kind: 'passwordReset',
        capturedAt: now,
        values: { token },
      };
      safeSetItem(storage, SENSITIVE_RETURN_STORAGE_KEYS.passwordReset, record);
    }
    return;
  }

  if (pathname === '/verify-email') {
    const token = readBoundedParam(params, 'token', PARAMETER_LIMITS.emailVerificationToken);
    const email = readBoundedParam(params, 'email', PARAMETER_LIMITS.email);
    if (token || email) {
      const record: SensitiveReturnRecord<'emailVerification'> = {
        version: 1,
        kind: 'emailVerification',
        capturedAt: now,
        values: { token, email },
      };
      safeSetItem(storage, SENSITIVE_RETURN_STORAGE_KEYS.emailVerification, record);
    }
    return;
  }

  if (pathname === '/billing/success') {
    const sessionId = readBoundedParam(params, 'session_id', PARAMETER_LIMITS.checkoutSessionId);
    if (sessionId) {
      const record: SensitiveReturnRecord<'billingCheckout'> = {
        version: 1,
        kind: 'billingCheckout',
        capturedAt: now,
        values: { sessionId },
      };
      safeSetItem(storage, SENSITIVE_RETURN_STORAGE_KEYS.billingCheckout, record);
    }
    return;
  }

  if (OAUTH_CALLBACK_PATHS.has(pathname)) {
    const code = readBoundedParam(params, 'code', 43);
    const error = readBoundedParam(params, 'error', 64);
    let record: OAuthCallbackRecord | null = null;

    if (code && OAUTH_CALLBACK_CODE.test(code)) {
      record = { version: 1, kind: 'code', value: code, capturedAt: now };
    } else if (error && OAUTH_CALLBACK_ERRORS.has(error)) {
      record = { version: 1, kind: 'error', value: error, capturedAt: now };
    } else if (params.has('code') || params.has('error')) {
      record = { version: 1, kind: 'error', value: 'oauth_flow_invalid', capturedAt: now };
    }

    if (record) {
      safeSetItem(storage, SENSITIVE_RETURN_STORAGE_KEYS.oauthCallback, record);
    }
  }
};

const isValidRecord = <K extends ConsumableSensitiveReturnKind>(
  value: unknown,
  kind: K,
  now: number,
): value is SensitiveReturnRecord<K> => {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<SensitiveReturnRecord<K>>;
  if (candidate.version !== 1 || candidate.kind !== kind || !isCurrentRecord(candidate.capturedAt, now)) {
    return false;
  }

  const values = candidate.values as Partial<SensitiveReturnValues[K]> | undefined;
  if (!values) return false;

  const isBoundedString = (candidateValue: unknown, maxLength: number) =>
    typeof candidateValue === 'string'
    && candidateValue.length > 0
    && candidateValue.length <= maxLength;

  if (kind === 'passwordReset') {
    return isBoundedString(
      (values as Partial<PasswordResetValues>).token,
      PARAMETER_LIMITS.passwordResetToken,
    );
  }
  if (kind === 'billingCheckout') {
    return isBoundedString(
      (values as Partial<BillingCheckoutValues>).sessionId,
      PARAMETER_LIMITS.checkoutSessionId,
    );
  }

  const verification = values as Partial<EmailVerificationValues>;
  return (verification.token === null
      || isBoundedString(verification.token, PARAMETER_LIMITS.emailVerificationToken))
    && (verification.email === null || isBoundedString(verification.email, PARAMETER_LIMITS.email))
    && Boolean(verification.token || verification.email);
};

export const readSensitiveReturn = <K extends ConsumableSensitiveReturnKind>(
  kind: K,
  storage: Storage | null = getSessionStorage(),
  now = Date.now(),
): SensitiveReturnRecord<K> | null => {
  if (!storage) return null;

  const key = SENSITIVE_RETURN_STORAGE_KEYS[kind];
  try {
    const serialized = storage.getItem(key);
    if (!serialized) return null;

    const parsed: unknown = JSON.parse(serialized);
    if (isValidRecord(parsed, kind, now)) {
      return parsed;
    }

    storage.removeItem(key);
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Storage can be denied between reads and cleanup.
    }
  }

  return null;
};

export const clearSensitiveReturn = <K extends ConsumableSensitiveReturnKind>(
  kind: K,
  capturedAt: number,
  storage: Storage | null = getSessionStorage(),
) => {
  if (!storage) return;

  const key = SENSITIVE_RETURN_STORAGE_KEYS[kind];
  try {
    const serialized = storage.getItem(key);
    if (!serialized) return;
    const parsed = JSON.parse(serialized) as { capturedAt?: unknown };
    if (parsed.capturedAt === capturedAt) {
      storage.removeItem(key);
    }
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Storage cleanup is best-effort after the value is in component memory.
    }
  }
};

export type { SensitiveReturnRecord, SensitiveReturnValues };
