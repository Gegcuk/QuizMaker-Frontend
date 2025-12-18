/**
 * Billing endpoints
 * Based on billing_controller.md API specification
 */
export const BILLING_ENDPOINTS = {
  // Configuration
  CONFIG: '/v1/billing/config',
  PACKS: '/v1/billing/packs',
  
  // Balance and transactions
  BALANCE: '/v1/billing/balance',
  TRANSACTIONS: '/v1/billing/transactions',
  
  // Cost estimation
  ESTIMATE_QUIZ_GENERATION: '/v1/billing/estimate/quiz-generation',
  
  // Stripe checkout
  CHECKOUT_SESSIONS: '/v1/billing/checkout-sessions',
  CHECKOUT_SESSION_BY_ID: (sessionId: string) => `/v1/billing/checkout-sessions/${sessionId}`,
  
  // Stripe customer management
  CREATE_CUSTOMER: '/v1/billing/create-customer',
  CUSTOMER_BY_ID: (customerId: string) => `/v1/billing/customers/${customerId}`,
  
  // Stripe subscription management
  CREATE_SUBSCRIPTION: '/v1/billing/create-subscription',
  UPDATE_SUBSCRIPTION: '/v1/billing/update-subscription',
  CANCEL_SUBSCRIPTION: '/v1/billing/cancel-subscription',
  
  // Stripe webhook
  STRIPE_WEBHOOK: '/v1/billing/stripe/webhook',
} as const;
