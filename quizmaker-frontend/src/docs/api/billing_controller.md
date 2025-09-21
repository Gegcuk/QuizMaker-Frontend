# Billing Controller API

Base path: `/api/v1/billing`

This document covers the billing and payment endpoints for token-based quiz generation, including Stripe integration, balance management, transaction history, and cost estimation.

## Overview

The billing system uses a token-based model where users purchase token packs through Stripe and consume tokens for AI-powered quiz generation. The system includes:

- **Token Management**: Balance tracking, reservations, and consumption
- **Stripe Integration**: Checkout sessions, webhooks, and payment processing
- **Cost Estimation**: Pre-generation token cost calculation
- **Transaction History**: Detailed audit trail of all token movements

## Security

- Most endpoints require authentication via JWT Bearer token
- Permission-based access control using `@RequirePermission` annotations
- Rate limiting on sensitive operations
- Stripe webhook signature verification

## Endpoints

### GET `/config`
- Purpose: Get billing configuration for frontend integration
- Auth: Not required (public endpoint)
- Response: `200 OK` with `ConfigResponse`
- Errors: `404 Not Found` when billing feature is disabled
```json
{
  "publishableKey": "pk_test_...",
  "prices": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Starter Pack",
      "tokens": 1000,
      "priceCents": 999,
      "currency": "usd",
      "stripePriceId": "price_1234567890"
    }
  ]
}
```

---

Note: If no packs are present in the DB, the backend seeds packs at startup from `STRIPE_PRICE_*` env vars. It fetches Stripe `Price` details for `amount` and `currency`, and uses either the Stripe metadata field `tokens` (preferred) or sensible defaults (1000/5000/10000 for small/medium/large).

### GET `/balance`
- Purpose: Get current user's token balance
- Auth: Required
- Permission: `BILLING_READ`
- Rate limit: 60 requests/minute per user
- Response: `200 OK` with `BalanceDto`
- Errors: `404 Not Found` when billing feature is disabled
```json
{
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "availableTokens": 850,
  "reservedTokens": 50,
  "updatedAt": "2025-01-21T15:30:00"
}
```
- Headers: `Cache-Control: private, max-age=30`

---

### GET `/transactions`
- Purpose: Get paginated transaction history
- Auth: Required
- Permission: `BILLING_READ`
- Rate limit: 30 requests/minute per user
- Query params:
  - `page` (number, default 0)
  - `size` (number, default 20)
  - `type` (TokenTransactionType, optional)
  - `source` (TokenTransactionSource, optional)
  - `dateFrom` (LocalDateTime, optional)
  - `dateTo` (LocalDateTime, optional)
- Response: `200 OK` with `Page<TransactionDto>`
- Errors: `404 Not Found` when billing feature is disabled
```json
{
  "content": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "userId": "9f8e7d6c-5b4a-3c2d-1b0a-9f8e7d6c5b4a",
      "type": "PURCHASE",
      "source": "STRIPE",
      "amountTokens": 1000,
      "refId": "pi_1234567890",
      "idempotencyKey": "purchase_123",
      "balanceAfterAvailable": 1000,
      "balanceAfterReserved": 0,
      "metaJson": "{\"stripe_payment_intent\":\"pi_1234567890\"}",
      "createdAt": "2025-01-21T15:30:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {"sorted": false, "unsorted": true, "empty": true}
  },
  "totalElements": 1,
  "totalPages": 1,
  "last": true,
  "first": true,
  "numberOfElements": 1,
  "size": 20,
  "number": 0,
  "empty": false
}
```
- Headers: `Cache-Control: private, max-age=60`

---

### POST `/estimate/quiz-generation`
- Purpose: Estimate token cost for quiz generation
- Auth: Required
- Permission: `BILLING_READ`
- Rate limit: 10 requests/minute per user
- Request body (JSON): `GenerateQuizFromDocumentRequest`
```json
{
  "documentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "questionCount": 10,
  "questionTypes": ["MCQ_SINGLE", "TRUE_FALSE"],
  "difficulty": "MEDIUM"
}
```
- Response: `200 OK` with `EstimationDto`
- Errors: `404 Not Found` when billing feature is disabled
```json
{
  "estimatedLlmTokens": 1500,
  "estimatedBillingTokens": 2,
  "approxCostCents": null,
  "currency": "usd",
  "estimate": true,
  "humanizedEstimate": "~2 billing tokens (1,500 LLM tokens)",
  "estimationId": "d290f1ee-6c54-4b01-90e6-d701748f0851"
}
```

---

### POST `/checkout-sessions`
- Purpose: Create Stripe checkout session for token pack purchase
- Auth: Required
- Permission: `BILLING_WRITE`
- Rate limit: 5 requests/minute per user
- Request body (JSON): `CreateCheckoutSessionRequest`
```json
{
  "priceId": "price_1234567890",
  "packId": "550e8400-e29b-41d4-a716-446655440000"
}
```
- Response: `200 OK` with `CheckoutSessionResponse`
- Errors: `404 Not Found` when billing feature is disabled
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_1234567890"
}
```

---

### GET `/checkout-sessions/{sessionId}`
- Purpose: Get checkout session status
- Auth: Required
- Permission: `BILLING_READ`
- Path params: `sessionId` (string)
- Response: `200 OK` with `CheckoutSessionStatus`
- Errors: `404 Not Found` when billing feature is disabled
```json
{
  "sessionId": "cs_test_1234567890",
  "status": "complete",
  "paymentStatus": "paid",
  "amountTotal": 999,
  "currency": "usd",
  "customerEmail": "user@example.com"
}
```

---

### POST `/create-customer`
- Purpose: Create Stripe customer for user
- Auth: Required
- Permission: `BILLING_WRITE`
- Rate limit: 3 requests/minute per user (expensive operation)
- Request body (JSON): `CreateCustomerRequest`
```json
{
  "email": "user@example.com"
}
```
- Response: `200 OK` with `CustomerResponse`
- Errors: `429 Too Many Requests` for rate limit exceeded
```json
{
  "customerId": "cus_1234567890",
  "email": "user@example.com",
  "created": 1642694400
}
```

---

### GET `/customers/{customerId}`
- Purpose: Get Stripe customer details
- Auth: Required
- Permission: `BILLING_READ`
- Path params: `customerId` (string)
- Response: `200 OK` with `CustomerResponse`
- Errors: `403 Forbidden` if customer is not owned by the authenticated user

---

### POST `/create-subscription`
- Purpose: Create Stripe subscription
- Auth: Required
- Permission: `BILLING_WRITE`
- Request body (JSON): `CreateSubscriptionRequest`
```json
{
  "priceId": "price_1234567890"
}
```
- Response: `200 OK` with `SubscriptionResponse`
```json
{
  "subscriptionId": "sub_1234567890",
  "status": "active",
  "currentPeriodStart": 1642694400,
  "currentPeriodEnd": 1645372800
}
```

---

### POST `/update-subscription`
- Purpose: Update existing subscription
- Auth: Required
- Permission: `BILLING_WRITE`
- Request body (JSON): `UpdateSubscriptionRequest`
```json
{
  "subscriptionId": "sub_1234567890",
  "newPriceLookupKey": "premium_monthly"
}
```
- Response: `200 OK` with Stripe subscription JSON

---

### POST `/cancel-subscription`
- Purpose: Cancel subscription
- Auth: Required
- Permission: `BILLING_WRITE`
- Request body (JSON): `CancelSubscriptionRequest`
```json
{
  "subscriptionId": "sub_1234567890"
}
```
- Response: `200 OK` with Stripe subscription JSON

---

### POST `/stripe/webhook`
- Purpose: Handle Stripe webhook events
- Auth: Not required (Stripe signature verification)
- Headers: `Stripe-Signature` (required)
- Request body: Raw Stripe webhook payload
- Response: `200 OK` (empty body) or `401 Unauthorized` or `404 Not Found` or `500 Internal Server Error`
- Errors:
  - `401 Unauthorized` for invalid Stripe signature
  - `404 Not Found` when billing feature is disabled
  - `500 Internal Server Error` for processing errors

## DTOs and Types

### Enums
```ts
export type TokenTransactionType =
  | "PURCHASE"     // Token pack purchase
  | "RESERVE"      // Reserve tokens for operation
  | "COMMIT"       // Commit reserved tokens
  | "RELEASE"      // Release reserved tokens
  | "REFUND"       // Refund tokens
  | "ADJUSTMENT";  // Manual adjustment

export type TokenTransactionSource =
  | "QUIZ_GENERATION"  // Quiz generation operation
  | "AI_CHECK"         // AI content check
  | "ADMIN"            // Administrative action
  | "STRIPE";          // Stripe payment
```

### BalanceDto
```ts
type BalanceDto = {
  userId: string;              // UUID
  availableTokens: number;     // Available for use (long in Java)
  reservedTokens: number;      // Reserved for pending operations (long in Java)
  updatedAt: string;           // ISO date-time (LocalDateTime in Java)
};
```

### TransactionDto
```ts
type TransactionDto = {
  id: string;                          // UUID
  userId: string;                      // UUID
  type: TokenTransactionType;
  source: TokenTransactionSource;
  amountTokens: number;                // Token amount (positive/negative, long in Java)
  refId: string;                       // External reference (Stripe ID, etc.)
  idempotencyKey: string;              // Idempotency key
  balanceAfterAvailable: number | null; // Available balance after transaction (Long in Java)
  balanceAfterReserved: number | null;  // Reserved balance after transaction (Long in Java)
  metaJson: string;                    // Additional metadata as JSON
  createdAt: string;                   // ISO date-time (LocalDateTime in Java)
};
```

### EstimationDto
```ts
type EstimationDto = {
  estimatedLlmTokens: number;          // Raw LLM tokens needed (long in Java)
  estimatedBillingTokens: number;      // Billing tokens (converted, long in Java)
  approxCostCents: number | null;      // Cost in cents (Long in Java, not implemented)
  currency: string;                    // Currency code
  estimate: boolean;                   // Always true
  humanizedEstimate: string;           // Human-readable description
  estimationId: string;                // UUID for correlation
};
```

### ConfigResponse
```ts
type ConfigResponse = {
  publishableKey: string;              // Stripe publishable key
  prices: PackDto[];                   // Available token packs
};
```

### PackDto
```ts
type PackDto = {
  id: string;                          // UUID
  name: string;                        // Pack name
  tokens: number;                      // Token amount
  priceCents: number;                  // Price in cents
  currency: string;                    // Currency code
  stripePriceId: string;               // Stripe Price ID
};
```

### CreateCheckoutSessionRequest
```ts
type CreateCheckoutSessionRequest = {
  priceId: string;                     // Stripe Price ID (required)
  packId?: string;                     // Internal pack ID (optional)
};
```

### CheckoutSessionResponse
```ts
type CheckoutSessionResponse = {
  url: string;                         // Stripe checkout URL
  sessionId: string;                   // Stripe session ID
};
```

### CheckoutSessionStatus
```ts
type CheckoutSessionStatus = {
  sessionId: string;                   // Stripe session ID
  status: string;                      // Session status
  paymentStatus: string;               // Payment status
  amountTotal: number;                 // Total amount in cents
  currency: string;                    // Currency code
  customerEmail: string;               // Customer email
};
```

### CreateCustomerRequest
```ts
type CreateCustomerRequest = {
  email: string;                       // Customer email
};
```

### CustomerResponse
```ts
type CustomerResponse = {
  customerId: string;                  // Stripe customer ID
  email: string;                       // Customer email
  created: number;                     // Unix timestamp
};
```

### CreateSubscriptionRequest
```ts
type CreateSubscriptionRequest = {
  priceId: string;                     // Stripe Price ID
};
```

### SubscriptionResponse
```ts
type SubscriptionResponse = {
  subscriptionId: string;              // Stripe subscription ID
  status: string;                      // Subscription status
  currentPeriodStart: number;          // Unix timestamp
  currentPeriodEnd: number;            // Unix timestamp
};
```

### UpdateSubscriptionRequest
```ts
type UpdateSubscriptionRequest = {
  subscriptionId: string;              // Stripe subscription ID
  newPriceLookupKey: string;           // New price lookup key
};
```

### CancelSubscriptionRequest
```ts
type CancelSubscriptionRequest = {
  subscriptionId: string;              // Stripe subscription ID
};
```

## Error Responses

### 400 Bad Request
```json
{
  "timestamp": "2025-01-21T15:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    "priceId: Price ID is required"
  ]
}
```

### 401 Unauthorized
```json
{
  "timestamp": "2025-01-21T15:30:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "timestamp": "2025-01-21T15:30:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Insufficient permissions to access this resource"
}
```

### 429 Too Many Requests
```json
{
  "timestamp": "2025-01-21T15:30:00",
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "timestamp": "2025-01-21T15:30:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Notes for Frontend

### Authentication
- Use `Authorization: Bearer <accessToken>` for all protected endpoints
- The `/config` and `/stripe/webhook` endpoints don't require authentication

### Rate Limiting
- Balance endpoint: 60 requests/minute per user
- Transactions endpoint: 30 requests/minute per user
- Estimation endpoint: 10 requests/minute per user
- Checkout creation: 5 requests/minute per user
- Customer creation: 3 requests/minute per user (expensive operation)
- Implement exponential backoff for rate limit errors

### Caching
- Balance endpoint has 30-second cache
- Transactions endpoint has 60-second cache
- Respect cache headers for optimal performance

### Stripe Integration
- Use the publishable key from `/config` for Stripe.js initialization
- Redirect users to the checkout URL from `/checkout-sessions`
- Poll `/checkout-sessions/{sessionId}` to check payment status
- Handle webhook events for real-time payment updates

### Customer Ownership Validation
- Customer access is validated through Stripe customer metadata (`userId` field)
- If metadata is missing and email fallback is enabled, ownership is validated via email matching
- Email fallback behavior is configurable via `billing.allow-email-fallback-for-customer-ownership` property
- Users can only access customers they own or have created

### Token Management
- Always check balance before starting expensive operations
- Use estimation endpoint to show users expected costs
- Handle insufficient tokens gracefully with clear error messages

### Error Handling
- Surface validation errors from the `details` array
- Handle Stripe-specific errors (card declined, etc.)
- Implement retry logic for transient errors
- Show user-friendly messages for common error scenarios

## Known Issues and Limitations

- **Cost calculation**: The `approxCostCents` field in estimations is not implemented in the MVP
- **Webhook security**: Webhook signature verification should be thoroughly tested in production
- **Idempotency**: Some operations may not be fully idempotent, leading to potential duplicate charges
- **Feature flag dependency**: All billing endpoints return `404 Not Found` when the billing feature flag is disabled
- **Customer ownership**: Email fallback for customer ownership validation may have security implications if not properly configured
- **Rate limiting configuration**: Rate limiting thresholds are hardcoded and not configurable via properties
- **Subscription management**: Subscription update/cancel operations return raw Stripe JSON instead of structured DTOs
