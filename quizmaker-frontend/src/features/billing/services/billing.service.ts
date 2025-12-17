import type { AxiosInstance } from 'axios';
import { BILLING_ENDPOINTS } from './billing.endpoints';
import type {
  BillingConfigResponse,
  BalanceDto,
  TransactionPage,
  CreateCheckoutSessionRequest,
  CheckoutSessionResponse,
  CheckoutSessionStatus,
  QuizGenerationEstimateRequest,
  EstimationDto,
  CreateCustomerRequest,
  CustomerResponse,
  CreateSubscriptionRequest,
  SubscriptionResponse,
  UpdateSubscriptionRequest,
  CancelSubscriptionRequest,
} from '@/types';

const DEFAULT_BILLING_CONFIG_MAX_AGE_MS = 60 * 60 * 1000;

type BillingConfigCacheEntry = {
  data: BillingConfigResponse;
  fetchedAt: number;
};
export class BillingService {
  private axiosInstance: AxiosInstance;
  private configCache: BillingConfigCacheEntry | null = null;
  private configRequest: Promise<BillingConfigResponse> | null = null;
  private configRequestId = 0;
  private configRequestMeta: { id: number } | null = null;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  /**
   * GET /api/v1/billing/config
   * Returns Stripe publishable key and available token packs
   */
  async getConfig(options: { forceRefresh?: boolean; maxAgeMs?: number } = {}): Promise<BillingConfigResponse> {
    const { forceRefresh = false, maxAgeMs = DEFAULT_BILLING_CONFIG_MAX_AGE_MS } = options;
    const now = Date.now();

    if (!forceRefresh && this.configCache && now - this.configCache.fetchedAt < maxAgeMs) {
      return this.configCache.data;
    }

    if (this.configRequest && !forceRefresh) {
      return this.configRequest;
    }

    const requestId = ++this.configRequestId;
    this.configRequestMeta = { id: requestId };

    const request = this.axiosInstance
      .get<BillingConfigResponse>(BILLING_ENDPOINTS.CONFIG)
      .then(response => {
        if (this.configRequestMeta?.id === requestId) {
          this.configCache = { data: response.data, fetchedAt: Date.now() };
        }
        return response.data;
      })
      .finally(() => {
        if (this.configRequestMeta?.id === requestId) {
          this.configRequest = null;
          this.configRequestMeta = null;
        }
      });

    this.configRequest = request;
    return request;
  }

  /**
   * GET /api/v1/billing/balance
   * Returns the authenticated user's billing token balance
   */
  async getBalance(): Promise<BalanceDto> {
    const response = await this.axiosInstance.get<BalanceDto>(BILLING_ENDPOINTS.BALANCE);
    return response.data;
  }

  /**
   * GET /api/v1/billing/transactions
   * Returns paginated billing transactions for the authenticated user
   */
  async getTransactions(params?: {
    page?: number;
    size?: number;
    type?: string;
    source?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<TransactionPage> {
    const response = await this.axiosInstance.get<TransactionPage>(BILLING_ENDPOINTS.TRANSACTIONS, {
      params,
    });
    return response.data;
  }

  /**
   * POST /api/v1/billing/estimate/quiz-generation
   * Estimate billing cost for quiz generation requests
   */
  async estimateQuizGeneration(request: QuizGenerationEstimateRequest): Promise<EstimationDto> {
    const response = await this.axiosInstance.post<EstimationDto>(
      BILLING_ENDPOINTS.ESTIMATE_QUIZ_GENERATION,
      request,
    );
    return response.data;
  }

  /**
   * POST /api/v1/billing/checkout-sessions
   * Creates a Stripe Checkout session for purchasing token packs
   */
  async createCheckoutSession(
    request: CreateCheckoutSessionRequest,
  ): Promise<CheckoutSessionResponse> {
    const response = await this.axiosInstance.post<CheckoutSessionResponse>(
      BILLING_ENDPOINTS.CHECKOUT_SESSIONS,
      request,
    );
    return response.data;
  }

  /**
   * Helper method to format token balance for display
   */
  formatTokenBalance(balance: BalanceDto): string {
    const total = balance.availableTokens + balance.reservedTokens;
    if (balance.reservedTokens > 0) {
      return `${balance.availableTokens.toLocaleString()} available (${total.toLocaleString()} total, ${balance.reservedTokens} reserved)`;
    }
    return `${balance.availableTokens.toLocaleString()} tokens`;
  }

  /**
   * Helper method to check if user has sufficient tokens for an operation
   */
  hasSufficientTokens(balance: BalanceDto, requiredTokens: number): boolean {
    return balance.availableTokens >= requiredTokens;
  }

  /**
   * Helper method to get token balance status (low, medium, high)
   */
  getBalanceStatus(balance: BalanceDto): 'low' | 'medium' | 'high' {
    if (balance.availableTokens < 100) return 'low';
    if (balance.availableTokens < 500) return 'medium';
    return 'high';
  }

  /**
   * GET /api/v1/billing/checkout-sessions/{sessionId}
   * Get checkout session status
   */
  async getCheckoutSessionStatus(sessionId: string): Promise<CheckoutSessionStatus> {
    try {
      const response = await this.axiosInstance.get<CheckoutSessionStatus>(
        BILLING_ENDPOINTS.CHECKOUT_SESSION_BY_ID(sessionId)
      );
      return response.data;
    } catch (error) {
      throw this.handleBillingError(error);
    }
  }

  /**
   * POST /api/v1/billing/create-customer
   * Create Stripe customer for user
   */
  async createCustomer(data: CreateCustomerRequest): Promise<CustomerResponse> {
    try {
      const response = await this.axiosInstance.post<CustomerResponse>(
        BILLING_ENDPOINTS.CREATE_CUSTOMER,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleBillingError(error);
    }
  }

  /**
   * GET /api/v1/billing/customers/{customerId}
   * Get Stripe customer details
   */
  async getCustomer(customerId: string): Promise<CustomerResponse> {
    try {
      const response = await this.axiosInstance.get<CustomerResponse>(
        BILLING_ENDPOINTS.CUSTOMER_BY_ID(customerId)
      );
      return response.data;
    } catch (error) {
      throw this.handleBillingError(error);
    }
  }

  /**
   * POST /api/v1/billing/create-subscription
   * Create Stripe subscription
   */
  async createSubscription(data: CreateSubscriptionRequest): Promise<SubscriptionResponse> {
    try {
      const response = await this.axiosInstance.post<SubscriptionResponse>(
        BILLING_ENDPOINTS.CREATE_SUBSCRIPTION,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleBillingError(error);
    }
  }

  /**
   * POST /api/v1/billing/update-subscription
   * Update existing subscription
   */
  async updateSubscription(data: UpdateSubscriptionRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        BILLING_ENDPOINTS.UPDATE_SUBSCRIPTION,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleBillingError(error);
    }
  }

  /**
   * POST /api/v1/billing/cancel-subscription
   * Cancel subscription
   */
  async cancelSubscription(data: CancelSubscriptionRequest): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        BILLING_ENDPOINTS.CANCEL_SUBSCRIPTION,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleBillingError(error);
    }
  }

  /**
   * Handle billing-specific errors
   */
  private handleBillingError(error: any): Error {
    if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          return new Error(`Validation error: ${message}`);
        case 401:
          return new Error('Authentication failed');
        case 403:
          return new Error('Insufficient permissions to access this resource');
        case 404:
          return new Error('Billing feature is not available');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error occurred');
        default:
          return new Error(message || 'Billing operation failed');
      }
    }

    return new Error(error.message || 'Network error occurred');
  }
}

// Export default instance
import api from '../../../api/axiosInstance';
export const billingService = new BillingService(api);
