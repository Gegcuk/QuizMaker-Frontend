import { useLayoutEffect } from 'react';
import { useAuth } from '@/features/auth';
import { subscribeToSessionTransitions } from '@/features/auth/services/sessionLifecycle';
import {
  checkoutExpiresAt,
  clearCheckoutRecovery,
  readCheckoutRecovery,
  subscribeToCheckoutRecovery,
} from '../checkoutRecovery';

// Remains mounted on other routes so logout and expiry also clear abandoned returns.
export const CheckoutRecoveryLifecycle = () => {
  const { user, isLoading } = useAuth();
  const accountId = user?.id;

  useLayoutEffect(() => {
    let expiry: ReturnType<typeof setTimeout> | undefined;
    const synchronize = () => {
      clearTimeout(expiry);
      const record = readCheckoutRecovery();
      if (!isLoading && (!accountId || (record && record.accountId !== accountId))) {
        clearCheckoutRecovery();
        return;
      }
      if (record) expiry = setTimeout(() => clearCheckoutRecovery(record), checkoutExpiresAt(record) - Date.now());
    };
    // Avoid recursive change notifications while clearing an anonymous account.
    const changed = () => {
      const record = readCheckoutRecovery();
      clearTimeout(expiry);
      if (record) expiry = setTimeout(() => clearCheckoutRecovery(record), checkoutExpiresAt(record) - Date.now());
    };
    synchronize();
    const unsubscribeRecovery = subscribeToCheckoutRecovery(changed);
    const unsubscribeSession = subscribeToSessionTransitions(() => clearCheckoutRecovery());
    return () => {
      clearTimeout(expiry);
      unsubscribeRecovery();
      unsubscribeSession();
    };
  }, [accountId, isLoading]);

  return null;
};
