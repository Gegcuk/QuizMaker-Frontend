import { useLayoutEffect, useRef, useState } from 'react';
import { billingService } from '@/services';
import {
  getSessionGeneration,
  isCurrentSessionGeneration,
  subscribeToSessionTransitions,
} from '@/features/auth/services/sessionLifecycle';
import type { BalanceDto } from '../types/billing.types';
import { checkoutExpiresAt, clearCheckoutRecovery, takeCheckoutRecovery } from '../checkoutRecovery';

const DELAYS_MS = [2_000, 4_000, 6_000, 10_000, 16_000, 24_000, 32_000, 40_000, 44_000];
const WINDOW_MS = 180_000;
const REQUEST_TIMEOUT_MS = 10_000;
export const MAX_CHECKOUT_CHECKS = 10;

export type CheckoutPhase = 'checking' | 'waiting' | 'offline' | 'exhausted'
  | 'failed' | 'refunded' | 'partially-refunded' | 'unknown' | 'credited'
  | 'unavailable' | 'expired';

interface CheckoutView {
  phase: CheckoutPhase;
  paymentConfirmed: boolean;
  checks: number;
  creditedTokens: number | null;
  balance: BalanceDto | null;
  balanceState: 'idle' | 'loading' | 'loaded' | 'error';
}

const initialView: CheckoutView = {
  phase: 'checking', paymentConfirmed: false, checks: 0, creditedTokens: null,
  balance: null, balanceState: 'idle',
};

const isAccountBalance = (value: unknown, accountId: string): value is BalanceDto => {
  if (!value || typeof value !== 'object') return false;
  const balance = value as Partial<BalanceDto>;
  return balance.userId === accountId
    && typeof balance.availableTokens === 'number' && Number.isSafeInteger(balance.availableTokens) && balance.availableTokens >= 0
    && typeof balance.reservedTokens === 'number' && Number.isSafeInteger(balance.reservedTokens) && balance.reservedTokens >= 0
    && typeof balance.updatedAt === 'string';
};

export const useCheckoutReconciliation = (accountId: string) => {
  const [view, setView] = useState<CheckoutView>(initialView);
  const actions = useRef({ retry: () => {}, refreshBalance: () => {} });

  useLayoutEffect(() => {
    const record = takeCheckoutRecovery(accountId);
    if (!record) {
      setView({ ...initialView, phase: 'unavailable' });
      return;
    }

    const generation = getSessionGeneration();
    let active = true;
    let terminal = false;
    let automatic = false;
    let checks = 0;
    let deadline = 0;
    let sequence = 0;
    let inFlight = false;
    let lastResync = -Infinity;
    let controller: AbortController | undefined;
    let nextCheck: ReturnType<typeof setTimeout> | undefined;
    let windowTimer: ReturnType<typeof setTimeout> | undefined;
    let requestTimer: ReturnType<typeof setTimeout> | undefined;

    const current = () => active && isCurrentSessionGeneration(generation);
    const cancelRequest = () => {
      sequence += 1;
      controller?.abort();
      clearTimeout(requestTimer);
      inFlight = false;
    };
    const stopAutomatic = () => {
      automatic = false;
      clearTimeout(nextCheck);
      clearTimeout(windowTimer);
    };
    const finish = () => {
      terminal = true;
      stopAutomatic();
      clearTimeout(expiryTimer);
      clearCheckoutRecovery(record);
    };
    const expire = () => {
      cancelRequest();
      finish();
      if (current()) setView(previous => ({ ...previous, phase: 'expired' }));
    };
    const canCheck = () => {
      if (!current() || terminal) return false;
      if (Date.now() >= checkoutExpiresAt(record)) {
        expire();
        return false;
      }
      return true;
    };

    const refreshBalance = async () => {
      if (!current() || inFlight) return;
      inFlight = true;
      controller = new AbortController();
      const request = ++sequence;
      setView(previous => ({ ...previous, balanceState: 'loading' }));
      requestTimer = setTimeout(() => {
        cancelRequest();
        if (current()) setView(previous => ({ ...previous, balanceState: 'error' }));
      }, REQUEST_TIMEOUT_MS);
      try {
        const balance = await billingService.getBalance(controller.signal);
        if (!current() || request !== sequence) return;
        if (!isAccountBalance(balance, accountId)) throw new Error('Invalid account balance');
        setView(previous => ({ ...previous, balance, balanceState: 'loaded' }));
      } catch {
        if (current() && request === sequence) setView(previous => ({ ...previous, balanceState: 'error' }));
      } finally {
        if (request === sequence) {
          clearTimeout(requestTimer);
          inFlight = false;
        }
      }
    };

    const check = async (useAutomaticBudget: boolean) => {
      if (!canCheck() || inFlight) return;
      clearTimeout(nextCheck);
      if (!navigator.onLine) {
        setView(previous => ({ ...previous, phase: 'offline' }));
        return;
      }
      if (useAutomaticBudget && (checks >= MAX_CHECKOUT_CHECKS || Date.now() >= deadline)) {
        stopAutomatic();
        setView(previous => ({ ...previous, phase: 'exhausted' }));
        return;
      }
      if (useAutomaticBudget) checks += 1;
      inFlight = true;
      controller = new AbortController();
      const request = ++sequence;
      setView(previous => ({ ...previous, phase: 'checking', checks }));
      requestTimer = setTimeout(() => {
        cancelRequest();
        stopAutomatic();
        if (current()) setView(previous => ({ ...previous, phase: navigator.onLine ? 'unknown' : 'offline' }));
      }, REQUEST_TIMEOUT_MS);
      try {
        const result = await billingService.getCheckoutSessionStatus(record.sessionId, controller.signal);
        if (!current() || request !== sequence || !canCheck()) return;
        clearTimeout(requestTimer);
        inFlight = false;
        const status = result.status.toUpperCase();
        // Refund/failure wins over historical credited flags and token counts.
        if (status === 'FAILED' || status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED') {
          finish();
          setView(previous => ({ ...previous, paymentConfirmed: false,
            phase: status === 'FAILED' ? 'failed' : status === 'REFUNDED' ? 'refunded' : 'partially-refunded' }));
          return;
        }
        if (!['PENDING', 'SUCCEEDED', 'COMPLETE'].includes(status)) {
          stopAutomatic();
          setView(previous => ({ ...previous, phase: 'unknown' }));
          return;
        }
        if (result.credited) {
          finish();
          setView(previous => ({ ...previous, phase: 'credited', paymentConfirmed: true, creditedTokens: result.creditedTokens }));
          await refreshBalance();
          return;
        }
        const paymentConfirmed = status === 'SUCCEEDED' || status === 'COMPLETE';
        if (automatic && checks < MAX_CHECKOUT_CHECKS && Date.now() < deadline) {
          setView(previous => ({ ...previous, phase: 'waiting', paymentConfirmed }));
          nextCheck = setTimeout(() => { void check(true); }, DELAYS_MS[checks - 1]);
        } else {
          stopAutomatic();
          setView(previous => ({ ...previous, phase: 'exhausted', paymentConfirmed }));
        }
      } catch (error) {
        if (!current() || request !== sequence) return;
        clearTimeout(requestTimer);
        inFlight = false;
        stopAutomatic();
        const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
        if (status === 401 || status === 403 || status === 404) {
          finish();
          setView(previous => ({ ...previous, phase: 'unavailable' }));
        } else {
          setView(previous => ({ ...previous, phase: navigator.onLine ? 'unknown' : 'offline' }));
        }
      }
    };

    const retry = () => {
      if (!canCheck() || inFlight) return;
      stopAutomatic();
      checks = 0;
      deadline = Date.now() + WINDOW_MS;
      automatic = true;
      windowTimer = setTimeout(() => {
        cancelRequest();
        stopAutomatic();
        if (current()) setView(previous => ({ ...previous, phase: navigator.onLine ? 'exhausted' : 'offline' }));
      }, WINDOW_MS);
      void check(true);
    };
    const resynchronize = () => {
      if (!canCheck() || !navigator.onLine || document.visibilityState !== 'visible'
        || inFlight || Date.now() - lastResync < 1_000) return;
      lastResync = Date.now();
      // Use the remaining budget, or one request only after automatic work stopped.
      void check(automatic && Date.now() < deadline && checks < MAX_CHECKOUT_CHECKS);
    };
    const offline = () => {
      if (!canCheck()) return;
      cancelRequest();
      clearTimeout(nextCheck);
      setView(previous => ({ ...previous, phase: 'offline' }));
    };
    const unsubscribe = subscribeToSessionTransitions(() => {
      active = false;
      cancelRequest();
      stopAutomatic();
      clearTimeout(expiryTimer);
      clearCheckoutRecovery(record);
      setView({ ...initialView, phase: 'unavailable' });
    });
    window.addEventListener('online', resynchronize);
    window.addEventListener('offline', offline);
    document.addEventListener('visibilitychange', resynchronize);
    const expiryTimer = setTimeout(expire, checkoutExpiresAt(record) - Date.now());
    actions.current = { retry, refreshBalance: () => { void refreshBalance(); } };
    retry();

    return () => {
      active = false;
      cancelRequest();
      stopAutomatic();
      clearTimeout(expiryTimer);
      unsubscribe();
      window.removeEventListener('online', resynchronize);
      window.removeEventListener('offline', offline);
      document.removeEventListener('visibilitychange', resynchronize);
      actions.current = { retry: () => {}, refreshBalance: () => {} };
    };
  }, [accountId]);

  return { ...view, retry: () => actions.current.retry(), refreshBalance: () => actions.current.refreshBalance() };
};
