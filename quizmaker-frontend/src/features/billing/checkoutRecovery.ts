import {
  clearSensitiveReturn,
  getSessionStorage,
  readSensitiveReturn,
  SENSITIVE_RETURN_MAX_AGE_MS,
  SENSITIVE_RETURN_STORAGE_KEYS,
} from '@/features/privacy/sensitiveReturn';

export const CHECKOUT_RECOVERY_KEY = 'quizzence:billing:checkout-recovery:v1';
const CHANGE_EVENT = 'quizzence:checkout-recovery-changed';

export interface CheckoutRecovery {
  version: 1;
  accountId: string;
  sessionId: string;
  capturedAt: number;
}

export const checkoutExpiresAt = (record: CheckoutRecovery) =>
  record.capturedAt + SENSITIVE_RETURN_MAX_AGE_MS;

const remove = (key: string) => {
  try { getSessionStorage()?.removeItem(key); } catch { /* Storage may be denied. */ }
};

export const readCheckoutRecovery = (): CheckoutRecovery | null => {
  try {
    const serialized = getSessionStorage()?.getItem(CHECKOUT_RECOVERY_KEY);
    if (!serialized) return null;
    const value: unknown = JSON.parse(serialized);
    if (value && typeof value === 'object') {
      const record = value as Partial<CheckoutRecovery>;
      if (record.version === 1
        && typeof record.accountId === 'string' && record.accountId.length > 0 && record.accountId.length <= 128
        && typeof record.sessionId === 'string' && record.sessionId.length > 0 && record.sessionId.length <= 512
        && typeof record.capturedAt === 'number' && Number.isFinite(record.capturedAt)
        && record.capturedAt <= Date.now()
        && Date.now() < record.capturedAt + SENSITIVE_RETURN_MAX_AGE_MS) {
        return record as CheckoutRecovery;
      }
    }
  } catch { /* Invalid or inaccessible storage must not prevent URL scrubbing. */ }
  remove(CHECKOUT_RECOVERY_KEY);
  return null;
};

export const clearCheckoutRecovery = (expected?: CheckoutRecovery) => {
  const current = readCheckoutRecovery();
  if (!expected || (current?.accountId === expected.accountId
    && current.sessionId === expected.sessionId && current.capturedAt === expected.capturedAt)) {
    remove(CHECKOUT_RECOVERY_KEY);
  }
  if (expected) clearSensitiveReturn('billingCheckout', expected.capturedAt);
  else remove(SENSITIVE_RETURN_STORAGE_KEYS.billingCheckout);
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

// Called only after authentication resolves. Never renew the original capture time.
export const takeCheckoutRecovery = (accountId: string): CheckoutRecovery | null => {
  const previous = readCheckoutRecovery();
  if (previous && previous.accountId !== accountId) clearCheckoutRecovery();
  const captured = readSensitiveReturn('billingCheckout');
  if (!captured) return previous?.accountId === accountId ? previous : null;

  const record: CheckoutRecovery = {
    version: 1,
    accountId,
    sessionId: captured.values.sessionId,
    capturedAt: previous?.accountId === accountId && previous.sessionId === captured.values.sessionId
      ? Math.min(previous.capturedAt, captured.capturedAt) : captured.capturedAt,
  };
  if (checkoutExpiresAt(record) <= Date.now()) {
    clearCheckoutRecovery();
    return null;
  }
  try { getSessionStorage()?.setItem(CHECKOUT_RECOVERY_KEY, JSON.stringify(record)); } catch {
    // The current page can still reconcile; reload recovery requires tab storage.
  }
  clearSensitiveReturn('billingCheckout', captured.capturedAt);
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return record;
};

export const subscribeToCheckoutRecovery = (listener: () => void) => {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
};
