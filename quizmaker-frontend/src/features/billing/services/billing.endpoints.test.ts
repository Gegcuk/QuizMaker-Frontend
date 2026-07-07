import { describe, expect, it } from 'vitest';
import { BILLING_ENDPOINTS } from './billing.endpoints';

describe('BILLING_ENDPOINTS', () => {
  it('matches every deployed billing collection and action path', () => {
    expect(BILLING_ENDPOINTS.CONFIG).toBe('/v1/billing/config');
    expect(BILLING_ENDPOINTS.PACKS).toBe('/v1/billing/packs');
    expect(BILLING_ENDPOINTS.BALANCE).toBe('/v1/billing/balance');
    expect(BILLING_ENDPOINTS.TRANSACTIONS).toBe('/v1/billing/transactions');
    expect(BILLING_ENDPOINTS.ESTIMATE_QUIZ_GENERATION).toBe(
      '/v1/billing/estimate/quiz-generation',
    );
    expect(BILLING_ENDPOINTS.CHECKOUT_SESSIONS).toBe('/v1/billing/checkout-sessions');
    expect(BILLING_ENDPOINTS.CREATE_CUSTOMER).toBe('/v1/billing/create-customer');
    expect(BILLING_ENDPOINTS.CREATE_SUBSCRIPTION).toBe('/v1/billing/create-subscription');
    expect(BILLING_ENDPOINTS.UPDATE_SUBSCRIPTION).toBe('/v1/billing/update-subscription');
    expect(BILLING_ENDPOINTS.CANCEL_SUBSCRIPTION).toBe('/v1/billing/cancel-subscription');
  });

  it('builds deployed checkout-session and customer item paths', () => {
    expect(BILLING_ENDPOINTS.CHECKOUT_SESSION_BY_ID('session-1')).toBe(
      '/v1/billing/checkout-sessions/session-1',
    );
    expect(BILLING_ENDPOINTS.CUSTOMER_BY_ID('customer-1')).toBe(
      '/v1/billing/customers/customer-1',
    );
  });
});
