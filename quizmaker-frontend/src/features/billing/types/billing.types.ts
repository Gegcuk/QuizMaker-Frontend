// Billing-related type definitions
// Based on billing_controller.md API specification

/**
 * Token transaction types
 */
export type TokenTransactionType =
  | "PURCHASE"     // Token pack purchase
  | "RESERVE"      // Reserve tokens for operation
  | "COMMIT"       // Commit reserved tokens
  | "RELEASE"      // Release reserved tokens
  | "REFUND"       // Refund tokens
  | "ADJUSTMENT";  // Manual adjustment

/**
 * Token transaction sources
 */
export type TokenTransactionSource =
  | "QUIZ_GENERATION"  // Quiz generation operation
  | "AI_CHECK"         // AI content check
  | "ADMIN"            // Administrative action
  | "STRIPE";          // Stripe payment

/**
 * Token pack DTO (PackDto in OpenAPI)
 */
export interface PackDto {
  id: string;                          // UUID
  name: string;                        // Pack name
  description?: string | null;         // Optional description
  tokens: number;                      // Token amount
  priceCents: number;                  // Price in cents
  currency: string;                    // Currency code
  stripePriceId: string;               // Stripe Price ID
}

// Backward compatibility alias
export type TokenPackDto = PackDto;

/**
 * Billing configuration response
 */
export interface BillingConfigResponse {
  publishableKey: string;              // Stripe publishable key
  prices: PackDto[];                   // Available token packs
}

/**
 * User token balance
 */
export interface BalanceDto {
  userId: string;                      // UUID
  availableTokens: number;             // Available for use (long in Java)
  reservedTokens: number;              // Reserved for pending operations (long in Java)
  updatedAt: string;                   // ISO date-time (LocalDateTime in Java)
}

/**
 * Token transaction record
 */
export interface TransactionDto {
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
}

/**
 * Pageable metadata for paginated responses
 */
export interface PageableMetadata {
  pageNumber: number;
  pageSize: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
}

/**
 * Paginated transaction response
 */
export interface TransactionPage {
  content: TransactionDto[];
  pageable: PageableMetadata;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  empty: boolean;
}

/**
 * Quiz generation cost estimation request
 */
export interface QuizGenerationEstimateRequest {
  documentId?: string;
  questionCount?: number;
  questionTypes?: string[];
  difficulty?: string;
}

/**
 * Cost estimation response
 */
export interface EstimationDto {
  estimatedLlmTokens: number;          // Raw LLM tokens needed (long in Java)
  estimatedBillingTokens: number;      // Billing tokens (converted, long in Java)
  approxCostCents: number | null;      // Cost in cents (Long in Java, not implemented)
  currency: string;                    // Currency code
  estimate: boolean;                   // Always true
  humanizedEstimate: string;           // Human-readable description
  estimationId: string;                // UUID for correlation
}

/**
 * Create checkout session request
 */
export interface CreateCheckoutSessionRequest {
  priceId: string;                     // Stripe Price ID (required)
  packId?: string;                     // Internal pack ID (optional)
}

/**
 * Checkout session response
 */
export interface CheckoutSessionResponse {
  url: string;                         // Stripe checkout URL
  sessionId: string;                   // Stripe session ID
}

/**
 * Checkout session status
 * Matches CheckoutSessionStatus from API documentation
 */
export interface CheckoutSessionStatus {
  sessionId: string;                   // Stripe session ID
  status: string;                      // Session status (e.g., "complete")
  credited: boolean;                   // Whether tokens have been credited to user balance
  creditedTokens: number | null;      // Number of tokens credited (null if not credited)
}

/**
 * Create customer request
 */
export interface CreateCustomerRequest {
  email: string;                       // Customer email
}

/**
 * Customer response
 * Matches CustomerResponse from API documentation
 */
export interface CustomerResponse {
  id: string;                          // Stripe customer ID
  email: string;                       // Customer email
  name: string | null;                 // Customer name (nullable)
}

/**
 * Create subscription request
 */
export interface CreateSubscriptionRequest {
  priceId: string;                     // Stripe Price ID
}

/**
 * Subscription response
 * Matches SubscriptionResponse from API documentation
 */
export interface SubscriptionResponse {
  subscriptionId: string;              // Stripe subscription ID
  clientSecret: string;                // Client secret for confirming subscription
}

/**
 * Update subscription request
 */
export interface UpdateSubscriptionRequest {
  subscriptionId: string;              // Stripe subscription ID
  newPriceLookupKey: string;           // New price lookup key
}

/**
 * Cancel subscription request
 */
export interface CancelSubscriptionRequest {
  subscriptionId: string;              // Stripe subscription ID
}

/**
 * Stripe pack sync response
 */
export type PackSyncResponse = PackDto[];
