import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type {
  BalanceDto,
  BillingConfigResponse,
  CheckoutSessionStatus,
  CustomerResponse,
  EstimationDto,
  PackDto,
  SubscriptionResponse,
  TransactionPage,
} from '../types/billing.types';
import { BillingService } from './billing.service';

const pack: PackDto = {
  id: 'pack-1',
  name: 'Starter',
  description: 'Starter token pack',
  tokens: 1_000,
  priceCents: 500,
  currency: 'gbp',
  stripePriceId: 'price-1',
};

const config: BillingConfigResponse = {
  publishableKey: 'pk_test_public',
  prices: [pack],
};

const balance: BalanceDto = {
  userId: 'user-1',
  availableTokens: 900,
  reservedTokens: 100,
  updatedAt: '2026-07-07T12:00:00Z',
};

const transactionPage: TransactionPage = {
  content: [],
  pageable: {
    pageNumber: 0,
    pageSize: 20,
    sort: { sorted: true, unsorted: false, empty: false },
  },
  totalElements: 0,
  totalPages: 0,
  last: true,
  first: true,
  numberOfElements: 0,
  size: 20,
  number: 0,
  empty: true,
};

const problemError = (status: number, detail: string) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: {
    status,
    data: {
      type: 'https://quizzence.com/docs/errors/validation-failed',
      title: status === 429 ? 'Too Many Requests' : 'Validation Failed',
      status,
      detail,
    },
  },
});

describe('BillingService', () => {
  let axios: AxiosMock;
  let service: BillingService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new BillingService(axios.instance);
  });

  it('caches billing config and supports a forced refresh', async () => {
    const refreshedConfig = { ...config, publishableKey: 'pk_test_refreshed' };
    axios.get
      .mockResolvedValueOnce({ data: config })
      .mockResolvedValueOnce({ data: refreshedConfig });

    await expect(service.getConfig()).resolves.toBe(config);
    await expect(service.getConfig()).resolves.toBe(config);
    await expect(service.getConfig({ forceRefresh: true })).resolves.toBe(refreshedConfig);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/billing/config');
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/billing/config');
  });

  it('deduplicates concurrent config requests', async () => {
    let resolveRequest: ((value: { data: BillingConfigResponse }) => void) | undefined;
    axios.get.mockReturnValue(
      new Promise(resolve => {
        resolveRequest = resolve;
      }),
    );

    const first = service.getConfig();
    const second = service.getConfig();
    resolveRequest?.({ data: config });

    await expect(Promise.all([first, second])).resolves.toEqual([config, config]);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('retrieves packs, balance, and filtered transactions', async () => {
    const transactionParams = {
      page: 1,
      size: 10,
      sort: ['createdAt,desc'],
      type: 'PURCHASE' as const,
      source: 'STRIPE' as const,
      dateFrom: '2026-07-01T00:00:00Z',
      dateTo: '2026-07-07T23:59:59Z',
    };
    axios.get
      .mockResolvedValueOnce({ data: [pack] })
      .mockResolvedValueOnce({ data: balance })
      .mockResolvedValueOnce({ data: transactionPage });

    await expect(service.getPacks({ currency: 'gbp' })).resolves.toEqual([pack]);
    await expect(service.getBalance()).resolves.toBe(balance);
    await expect(service.getTransactions(transactionParams)).resolves.toBe(transactionPage);

    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/billing/packs', {
      params: { currency: 'gbp' },
    });
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/billing/balance');
    expect(axios.get).toHaveBeenNthCalledWith(3, '/v1/billing/transactions', {
      params: transactionParams,
    });
  });

  it('submits the deployed quiz-generation estimation request', async () => {
    const request = {
      documentId: 'document-1',
      questionsPerType: { MCQ_SINGLE: 3 },
      quizScope: 'ENTIRE_DOCUMENT' as const,
      difficulty: 'MEDIUM' as const,
    };
    const estimate: EstimationDto = {
      estimatedLlmTokens: 1_500,
      estimatedBillingTokens: 2,
      approxCostCents: null,
      currency: 'gbp',
      estimate: true,
      humanizedEstimate: '~2 billing tokens',
      estimationId: 'estimate-1',
    };
    axios.post.mockResolvedValue({ data: estimate });

    await expect(service.estimateQuizGeneration(request)).resolves.toBe(estimate);
    expect(axios.post).toHaveBeenCalledWith(
      '/v1/billing/estimate/quiz-generation',
      request,
    );
  });

  it('creates a checkout session and retrieves its status', async () => {
    const request = { priceId: 'price-1', packId: 'pack-1' };
    const checkout = { url: 'https://checkout.stripe.com/session', sessionId: 'session-1' };
    const status: CheckoutSessionStatus = {
      sessionId: 'session-1',
      status: 'complete',
      credited: true,
      creditedTokens: 1_000,
    };
    axios.post.mockResolvedValue({ data: checkout });
    axios.get.mockResolvedValue({ data: status });

    await expect(service.createCheckoutSession(request)).resolves.toBe(checkout);
    await expect(service.getCheckoutSessionStatus('session-1')).resolves.toBe(status);

    expect(axios.post).toHaveBeenCalledWith('/v1/billing/checkout-sessions', request);
    expect(axios.get).toHaveBeenCalledWith('/v1/billing/checkout-sessions/session-1');
  });

  it('creates and retrieves a Stripe customer', async () => {
    const request = { email: 'architect@example.com' };
    const customer: CustomerResponse = {
      id: 'customer-1',
      email: request.email,
      name: null,
    };
    axios.post.mockResolvedValue({ data: customer });
    axios.get.mockResolvedValue({ data: customer });

    await expect(service.createCustomer(request)).resolves.toBe(customer);
    await expect(service.getCustomer('customer-1')).resolves.toBe(customer);

    expect(axios.post).toHaveBeenCalledWith('/v1/billing/create-customer', request);
    expect(axios.get).toHaveBeenCalledWith('/v1/billing/customers/customer-1');
  });

  it('creates, updates, and cancels subscriptions with deployed response types', async () => {
    const created: SubscriptionResponse = {
      subscriptionId: 'subscription-1',
      clientSecret: 'client-secret',
    };
    axios.post
      .mockResolvedValueOnce({ data: created })
      .mockResolvedValueOnce({ data: '{"status":"active"}' })
      .mockResolvedValueOnce({ data: '{"status":"canceled"}' });

    await expect(service.createSubscription({ priceId: 'price-1' })).resolves.toBe(created);
    await expect(
      service.updateSubscription({
        subscriptionId: 'subscription-1',
        newPriceLookupKey: 'price-premium',
      }),
    ).resolves.toBe('{"status":"active"}');
    await expect(
      service.cancelSubscription({ subscriptionId: 'subscription-1' }),
    ).resolves.toBe('{"status":"canceled"}');

    expect(axios.post).toHaveBeenNthCalledWith(1, '/v1/billing/create-subscription', {
      priceId: 'price-1',
    });
    expect(axios.post).toHaveBeenNthCalledWith(2, '/v1/billing/update-subscription', {
      subscriptionId: 'subscription-1',
      newPriceLookupKey: 'price-premium',
    });
    expect(axios.post).toHaveBeenNthCalledWith(3, '/v1/billing/cancel-subscription', {
      subscriptionId: 'subscription-1',
    });
  });

  it('formats and evaluates token balances', () => {
    expect(service.formatTokenBalance(balance)).toBe(
      '900 available (1,000 total, 100 reserved)',
    );
    expect(service.formatTokenBalance({ ...balance, reservedTokens: 0 })).toBe('900 tokens');
    expect(service.hasSufficientTokens(balance, 900)).toBe(true);
    expect(service.hasSufficientTokens(balance, 901)).toBe(false);
    expect(service.getBalanceStatus({ ...balance, availableTokens: 99 })).toBe('low');
    expect(service.getBalanceStatus({ ...balance, availableTokens: 100 })).toBe('medium');
    expect(service.getBalanceStatus({ ...balance, availableTokens: 500 })).toBe('high');
  });

  it('preserves live ProblemDetail detail text for validation failures', async () => {
    axios.post.mockRejectedValue(problemError(400, 'Price ID must not be blank.'));

    await expect(
      service.createCheckoutSession({ priceId: '' }),
    ).rejects.toThrow('Validation error: Price ID must not be blank.');
  });

  it.each([
    [401, 'Authentication failed'],
    [403, 'Insufficient permissions'],
    [404, 'Billing feature is not available'],
    [429, 'Too many requests'],
    [500, 'Server error occurred'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.get.mockRejectedValue(problemError(status, 'Backend detail'));

    await expect(service.getBalance()).rejects.toThrow(expectedMessage);
  });

  it('preserves status metadata and network failure context', async () => {
    axios.get
      .mockRejectedValueOnce(problemError(429, 'Rate limit exceeded.'))
      .mockRejectedValueOnce(new Error('Network unavailable'));

    await expect(service.getPacks()).rejects.toMatchObject({ status: 429 });
    await expect(service.getConfig()).rejects.toThrow('Network unavailable');
  });
});
