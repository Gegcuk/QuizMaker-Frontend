import type { AxiosInstance } from 'axios';
import { BILLING_ENDPOINTS } from './endpoints';
import type {
  BillingConfigResponse,
  BalanceDto,
  TransactionPage,
  CreateCheckoutSessionRequest,
  CheckoutSessionResponse,
  QuizGenerationEstimateRequest,
  EstimationDto,
} from '../types/billing.types';

export class BillingService {
  private axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  /**
   * GET /api/v1/billing/config
   * Returns Stripe publishable key and available token packs
   */
  async getConfig(): Promise<BillingConfigResponse> {
    const response = await this.axiosInstance.get<BillingConfigResponse>(BILLING_ENDPOINTS.CONFIG);
    return response.data;
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
}

// Export default instance
import api from './axiosInstance';
export const billingService = new BillingService(api);