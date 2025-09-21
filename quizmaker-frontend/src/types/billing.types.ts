export interface TokenPackDto {
    id: string;
    name: string;
    tokens: number;
    priceCents: number;
    currency: string;
    stripePriceId: string;
  }
  
  export interface BillingConfigResponse {
    publishableKey: string;
    prices: TokenPackDto[];
  }
  
  export interface BalanceDto {
    userId: string;
    availableTokens: number;
    reservedTokens: number;
    updatedAt: string;
  }
  
  export interface TransactionDto {
    id: string;
    userId: string;
    type: string;
    source: string;
    amountTokens: number;
    refId?: string | null;
    idempotencyKey?: string | null;
    balanceAfterAvailable: number;
    balanceAfterReserved: number;
    metaJson?: string | null;
    createdAt: string;
  }
  
  export interface PageableMetadata {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
  }
  
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
  
  export interface QuizGenerationEstimateRequest {
    documentId?: string;
    questionCount?: number;
    questionTypes?: string[];
    difficulty?: string;
  }
  
  export interface EstimationDto {
    estimatedLlmTokens: number;
    estimatedBillingTokens: number;
    approxCostCents: number | null;
    currency: string | null;
    estimate: boolean;
    humanizedEstimate: string;
    estimationId: string;
  }
  
  export interface CreateCheckoutSessionRequest {
    priceId?: string;
    packId?: string;
  }
  
  export interface CheckoutSessionResponse {
    checkoutUrl: string;
  }