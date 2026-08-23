import { describe, expect, it } from 'vitest';
import {
  SENSITIVE_RETURN_STORAGE_KEYS,
  captureSensitiveReturn,
  clearSensitiveReturn,
  readSensitiveReturn,
} from './sensitiveReturn';

const location = (pathname: string, search: string, hash = '') => ({
  pathname,
  search,
  hash,
});

describe('sensitive return records', () => {
  it('captures only the password reset token in a bounded record', () => {
    captureSensitiveReturn(
      location('/reset-password', '?token=reset-token-canary&email=private%40example.com'),
      sessionStorage,
      1_000,
    );

    expect(readSensitiveReturn('passwordReset', sessionStorage, 1_001)).toEqual({
      version: 1,
      kind: 'passwordReset',
      capturedAt: 1_000,
      values: { token: 'reset-token-canary' },
    });
    expect(sessionStorage.getItem(SENSITIVE_RETURN_STORAGE_KEYS.passwordReset)).not.toContain(
      'private@example.com',
    );
  });

  it('captures the verification values and clears only the matching record', () => {
    captureSensitiveReturn(
      location('/verify-email', '?token=verify-token&email=%20learner%40example.com%20'),
      sessionStorage,
      2_000,
    );

    const record = readSensitiveReturn('emailVerification', sessionStorage, 2_001);
    expect(record?.values).toEqual({
      token: 'verify-token',
      email: 'learner@example.com',
    });

    clearSensitiveReturn('emailVerification', 1_999, sessionStorage);
    expect(readSensitiveReturn('emailVerification', sessionStorage, 2_002)).not.toBeNull();

    clearSensitiveReturn('emailVerification', 2_000, sessionStorage);
    expect(readSensitiveReturn('emailVerification', sessionStorage, 2_003)).toBeNull();
  });

  it('captures checkout and OAuth returns without retaining unknown parameters', () => {
    captureSensitiveReturn(
      location('/billing/success', '?session_id=cs_test_canary&customer=customer-canary'),
      sessionStorage,
      3_000,
    );
    captureSensitiveReturn(
      location('/oauth2/redirect', `?code=${'C'.repeat(43)}&error_description=description-canary`),
      sessionStorage,
      3_000,
    );

    expect(readSensitiveReturn('billingCheckout', sessionStorage, 3_001)?.values).toEqual({
      sessionId: 'cs_test_canary',
    });
    expect(sessionStorage.getItem(SENSITIVE_RETURN_STORAGE_KEYS.billingCheckout)).not.toContain(
      'customer-canary',
    );
    expect(sessionStorage.getItem(SENSITIVE_RETURN_STORAGE_KEYS.oauthCallback)).not.toContain(
      'description-canary',
    );
  });

  it('rejects expired, malformed, and oversized records', () => {
    captureSensitiveReturn(
      location('/reset-password', `?token=${'T'.repeat(2049)}`),
      sessionStorage,
      4_000,
    );
    expect(readSensitiveReturn('passwordReset', sessionStorage, 4_001)).toBeNull();

    sessionStorage.setItem(SENSITIVE_RETURN_STORAGE_KEYS.passwordReset, '{not-json');
    expect(readSensitiveReturn('passwordReset', sessionStorage, 4_001)).toBeNull();
    expect(sessionStorage.getItem(SENSITIVE_RETURN_STORAGE_KEYS.passwordReset)).toBeNull();

    sessionStorage.setItem(SENSITIVE_RETURN_STORAGE_KEYS.passwordReset, JSON.stringify({
      version: 1,
      kind: 'passwordReset',
      capturedAt: 4_000,
      values: { token: 'T'.repeat(2049) },
    }));
    expect(readSensitiveReturn('passwordReset', sessionStorage, 4_001)).toBeNull();

    captureSensitiveReturn(
      location('/billing/success', '?session_id=cs_expired'),
      sessionStorage,
      5_000,
    );
    expect(readSensitiveReturn('billingCheckout', sessionStorage, 305_001)).toBeNull();
  });

  it('fails securely when session storage is unavailable', () => {
    const deniedStorage: Storage = {
      length: 0,
      clear() {},
      getItem() { return null; },
      key() { return null; },
      removeItem() {},
      setItem() {
        throw new DOMException('Denied', 'SecurityError');
      },
    };

    expect(() => captureSensitiveReturn(
      location('/reset-password', '?token=reset-token-canary'),
      deniedStorage,
      6_000,
    )).not.toThrow();
  });
});
