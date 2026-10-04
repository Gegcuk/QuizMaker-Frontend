import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureSensitiveReturn, SENSITIVE_RETURN_STORAGE_KEYS } from '@/features/privacy';
import { CHECKOUT_RECOVERY_KEY, clearCheckoutRecovery, readCheckoutRecovery, takeCheckoutRecovery } from './checkoutRecovery';

const capture = () => captureSensitiveReturn({ pathname: '/billing/success', search: '?session_id=checkout-canary', hash: '' });
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-04T12:00:00Z')); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('account-scoped checkout recovery', () => {
  it('consumes only the checkout capture and preserves its original time on repeated capture', () => {
    captureSensitiveReturn({ pathname: '/reset-password', search: '?token=reset-canary', hash: '' });
    capture();
    const original = takeCheckoutRecovery('account-a');
    vi.advanceTimersByTime(240_000);
    capture();
    expect(takeCheckoutRecovery('account-a')).toEqual(original);
    expect(sessionStorage.getItem(SENSITIVE_RETURN_STORAGE_KEYS.billingCheckout)).toBeNull();
    clearCheckoutRecovery();
    expect(sessionStorage.getItem(SENSITIVE_RETURN_STORAGE_KEYS.passwordReset)).toContain('reset-canary');
  });

  it('never lets another account claim stored recovery', () => {
    capture();
    takeCheckoutRecovery('account-a');
    expect(takeCheckoutRecovery('account-b')).toBeNull();
    expect(sessionStorage.getItem(CHECKOUT_RECOVERY_KEY)).toBeNull();
  });

  it('expires exactly five minutes after original capture, including across a reload', () => {
    capture();
    takeCheckoutRecovery('account-a');
    vi.advanceTimersByTime(299_999);
    expect(readCheckoutRecovery()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(readCheckoutRecovery()).toBeNull();
    expect(takeCheckoutRecovery('account-a')).toBeNull();
    expect(sessionStorage.getItem(CHECKOUT_RECOVERY_KEY)).toBeNull();
  });

  it.each(['invalid-json', '{}', 'null', JSON.stringify({ version: 1, accountId: 'account-a', sessionId: 'checkout-canary', capturedAt: Infinity })])('removes malformed storage safely', stored => {
    sessionStorage.setItem(CHECKOUT_RECOVERY_KEY, stored);
    expect(readCheckoutRecovery()).toBeNull();
    expect(sessionStorage.getItem(CHECKOUT_RECOVERY_KEY)).toBeNull();
  });

  it('rejects future timestamps and overlong checkout references', () => {
    for (const fields of [{ capturedAt: Date.now() + 1 }, { sessionId: 'x'.repeat(513) }]) {
      sessionStorage.setItem(CHECKOUT_RECOVERY_KEY, JSON.stringify({ version: 1, accountId: 'account-a', sessionId: 'checkout-canary', capturedAt: Date.now(), ...fields }));
      expect(readCheckoutRecovery()).toBeNull();
    }
  });

  it('keeps current-page recovery in memory when storage writes are denied', () => {
    capture();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError'); });
    expect(takeCheckoutRecovery('account-a')).toMatchObject({ accountId: 'account-a', sessionId: 'checkout-canary' });
    expect(sessionStorage.getItem(SENSITIVE_RETURN_STORAGE_KEYS.billingCheckout)).toBeNull();
  });

  it('fails closed if storage reads are denied', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError'); });
    expect(takeCheckoutRecovery('account-a')).toBeNull();
    expect(() => clearCheckoutRecovery()).not.toThrow();
  });

  it('does not let old cleanup erase a newly captured checkout', () => {
    capture();
    const old = takeCheckoutRecovery('account-a');
    captureSensitiveReturn({ pathname: '/billing/success', search: '?session_id=new-checkout', hash: '' });
    takeCheckoutRecovery('account-a');
    if (!old) throw new Error('Expected initial recovery');
    clearCheckoutRecovery(old);
    expect(readCheckoutRecovery()?.sessionId).toBe('new-checkout');
  });
});
