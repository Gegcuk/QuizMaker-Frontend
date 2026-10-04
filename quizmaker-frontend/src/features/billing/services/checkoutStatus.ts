import type { CheckoutSessionStatus } from '../types/billing.types';

export const decodeCheckoutStatus = (value: unknown, sessionId: string): CheckoutSessionStatus => {
  if (!value || typeof value !== 'object') throw new Error('Invalid checkout response');
  const record = value as Partial<CheckoutSessionStatus>;
  if (record.sessionId !== sessionId || typeof record.status !== 'string'
    || record.status.length === 0 || record.status.length > 64
    || typeof record.credited !== 'boolean'
    || (record.creditedTokens !== null && (typeof record.creditedTokens !== 'number'
      || !Number.isSafeInteger(record.creditedTokens) || record.creditedTokens < 0))) {
    throw new Error('Invalid checkout response');
  }
  return record as CheckoutSessionStatus;
};
