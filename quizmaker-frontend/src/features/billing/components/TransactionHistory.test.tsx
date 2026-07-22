import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { TransactionDto, TransactionPage } from '@/types';
import TransactionHistory from './TransactionHistory';

const billingMocks = vi.hoisted(() => ({
  getTransactions: vi.fn(),
}));

vi.mock('@/services', () => ({
  billingService: {
    getTransactions: billingMocks.getTransactions,
  },
}));

const transaction = (overrides: Partial<TransactionDto> = {}): TransactionDto => ({
  id: '11111111-1111-4111-8111-111111111111',
  userId: '22222222-2222-4222-8222-222222222222',
  type: 'PURCHASE',
  source: 'STRIPE',
  amountTokens: 250,
  refId: 'ref_123',
  idempotencyKey: 'idempotency_123',
  balanceAfterAvailable: 1_250,
  balanceAfterReserved: 0,
  metaJson: '{}',
  createdAt: '2026-07-16T12:00:00Z',
  ...overrides,
});

const page = (content: TransactionDto[]): TransactionPage => ({
  content,
  pageable: {
    pageNumber: 0,
    pageSize: 1_000,
    sort: { sorted: false, unsorted: true, empty: true },
  },
  totalElements: content.length,
  totalPages: 1,
  last: true,
  first: true,
  numberOfElements: content.length,
  size: 1_000,
  number: 0,
  empty: content.length === 0,
});

describe('TransactionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the full transaction page, hides reserve entries, and filters displayed transactions', async () => {
    billingMocks.getTransactions.mockResolvedValue(page([
      transaction(),
      transaction({
        id: '33333333-3333-4333-8333-333333333333',
        type: 'COMMIT',
        source: 'QUIZ_GENERATION',
        amountTokens: 50,
        balanceAfterAvailable: 1_200,
        createdAt: '2026-07-15T12:00:00Z',
      }),
      transaction({
        id: '44444444-4444-4444-8444-444444444444',
        type: 'RESERVE',
        source: 'QUIZ_GENERATION',
        amountTokens: 50,
      }),
    ]));
    const { user } = renderWithProviders(<TransactionHistory />, { withAuthProvider: false });

    expect(await screen.findByText('2 transactions found')).toBeInTheDocument();
    expect(billingMocks.getTransactions).toHaveBeenCalledWith({ page: 0, size: 1000 });
    expect(screen.getAllByText('PURCHASE')).toHaveLength(2);
    expect(screen.getAllByText('COMMIT')).toHaveLength(2);
    expect(screen.getAllByText('+250')).toHaveLength(2);
    expect(screen.getAllByText('-50')).toHaveLength(2);
    expect(screen.queryByText('RESERVE')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /filter/i }));
    await user.click(screen.getByRole('button', { name: 'Purchase' }));

    expect(await screen.findByText('1 transaction found')).toBeInTheDocument();
    expect(screen.getAllByText('PURCHASE')).toHaveLength(2);
    expect(screen.queryByText('COMMIT')).not.toBeInTheDocument();
  });

  it('renders the empty state when the account has no visible transactions', async () => {
    billingMocks.getTransactions.mockResolvedValue(page([]));

    renderWithProviders(<TransactionHistory />, { withAuthProvider: false });

    expect(await screen.findByText('No transactions found')).toBeInTheDocument();
  });

  it('renders the service error when loading transactions fails', async () => {
    billingMocks.getTransactions.mockRejectedValue(new Error('Transaction service unavailable'));

    renderWithProviders(<TransactionHistory />, { withAuthProvider: false });

    expect(await screen.findByText('Transaction service unavailable')).toBeInTheDocument();
  });
});
