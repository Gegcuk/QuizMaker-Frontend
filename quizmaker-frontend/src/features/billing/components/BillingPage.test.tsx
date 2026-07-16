import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import BillingPage from './BillingPage';

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const billingMocks = vi.hoisted(() => ({
  getBalance: vi.fn(),
}));

const adminMocks = vi.hoisted(() => ({
  syncBillingPacks: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  useAuth: authMocks.useAuth,
}));

vi.mock('@/services', () => ({
  billingService: {
    getBalance: billingMocks.getBalance,
  },
  adminService: {
    syncBillingPacks: adminMocks.syncBillingPacks,
  },
}));

vi.mock('./TokenTopUp', () => ({
  default: ({ refreshKey }: { refreshKey?: number }) => (
    <output data-testid="token-top-up-refresh-key">{refreshKey}</output>
  ),
}));

vi.mock('./TransactionHistory', () => ({
  default: () => <div data-testid="transaction-history">Transaction history</div>,
}));

const balance = {
  userId: '11111111-1111-4111-8111-111111111111',
  availableTokens: 1_200,
  reservedTokens: 300,
  updatedAt: '2026-07-16T12:00:00Z',
};

describe('BillingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.useAuth.mockReturnValue({ user: { roles: ['ROLE_USER'] } });
  });

  it('renders the live balance and refreshes it on demand', async () => {
    billingMocks.getBalance.mockResolvedValue(balance);
    const { user } = renderWithProviders(<BillingPage />, { withAuthProvider: false });

    expect(await screen.findByText('Available Tokens')).toBeInTheDocument();
    expect(screen.getByText('1,200')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByTestId('token-top-up-refresh-key')).toHaveTextContent('0');
    expect(screen.getByTestId('transaction-history')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /refresh/i }));

    await waitFor(() => {
      expect(billingMocks.getBalance).toHaveBeenCalledTimes(2);
    });
  });

  it('explains when billing is disabled without exposing purchase controls', async () => {
    billingMocks.getBalance.mockRejectedValue({ response: { status: 404 } });

    renderWithProviders(<BillingPage />, { withAuthProvider: false });

    expect(
      await screen.findByText('Billing features are not enabled for this environment yet.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Purchase Tokens')).not.toBeInTheDocument();
    expect(screen.queryByTestId('transaction-history')).not.toBeInTheDocument();
  });

  it('lets superadmins sync Stripe packs and refreshes the purchase controls', async () => {
    authMocks.useAuth.mockReturnValue({ user: { roles: ['ROLE_SUPER_ADMIN'] } });
    billingMocks.getBalance.mockResolvedValue(balance);
    adminMocks.syncBillingPacks.mockResolvedValue([{ id: 'starter-pack' }]);
    const { user } = renderWithProviders(<BillingPage />, { withAuthProvider: false });

    const syncButton = await screen.findByRole('button', { name: 'Sync Stripe packs' });
    await user.click(syncButton);

    await waitFor(() => {
      expect(adminMocks.syncBillingPacks).toHaveBeenCalledOnce();
    });
    expect(await screen.findByText('Synced 1 token pack from Stripe.')).toBeInTheDocument();
    expect(screen.getByTestId('token-top-up-refresh-key')).toHaveTextContent('1');
  });

  it('keeps an authorization error visible when the balance is unavailable', async () => {
    billingMocks.getBalance.mockRejectedValue({ response: { status: 403 } });

    renderWithProviders(<BillingPage />, { withAuthProvider: false });

    expect(
      await screen.findByText('You do not have permission to view billing information.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Purchase Tokens')).not.toBeInTheDocument();
  });
});
