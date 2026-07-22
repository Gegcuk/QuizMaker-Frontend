import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import BillingSuccessPage from './BillingSuccessPage';

const billingMocks = vi.hoisted(() => ({
  getBalance: vi.fn(),
  getCheckoutSessionStatus: vi.fn(),
}));

vi.mock('@/services', () => ({
  billingService: {
    getBalance: billingMocks.getBalance,
    getCheckoutSessionStatus: billingMocks.getCheckoutSessionStatus,
  },
}));

const LocationProbe = () => <output data-testid="location">{useLocation().pathname}</output>;

describe('BillingSuccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles a Stripe return without a session id without making a status request', async () => {
    const { user } = renderWithProviders(
      <>
        <BillingSuccessPage />
        <LocationProbe />
      </>,
      { route: '/billing/success', withAuthProvider: false },
    );

    expect(screen.getByText('Missing Stripe session id. Please return to billing to retry.')).toBeInTheDocument();
    expect(billingMocks.getCheckoutSessionStatus).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Back to billing' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/billing');
  });

  it('confirms a credited checkout and refreshes the live balance response', async () => {
    billingMocks.getCheckoutSessionStatus.mockResolvedValue({
      sessionId: 'cs_live_123',
      status: 'complete',
      credited: true,
      creditedTokens: 1500,
    });
    billingMocks.getBalance.mockResolvedValue({
      userId: '11111111-1111-4111-8111-111111111111',
      availableTokens: 3500,
      reservedTokens: 100,
      updatedAt: '2026-07-16T12:00:00Z',
    });

    renderWithProviders(<BillingSuccessPage />, {
      route: '/billing/success?session_id=cs_live_123',
      withAuthProvider: false,
    });

    await waitFor(() => {
      expect(billingMocks.getCheckoutSessionStatus).toHaveBeenCalledWith('cs_live_123');
    });
    expect(await screen.findByText('Payment confirmed')).toBeInTheDocument();
    expect(screen.getByText('Yes (1,500 tokens)')).toBeInTheDocument();
    expect(screen.getByText('3,500 tokens')).toBeInTheDocument();
    expect(billingMocks.getBalance).toHaveBeenCalledOnce();
  });

  it('keeps a failed checkout visible and lets the user retry billing', async () => {
    billingMocks.getCheckoutSessionStatus.mockResolvedValue({
      sessionId: 'cs_failed_123',
      status: 'failed',
      credited: false,
      creditedTokens: null,
    });
    const { user } = renderWithProviders(
      <>
        <BillingSuccessPage />
        <LocationProbe />
      </>,
      { route: '/billing/success?session_id=cs_failed_123', withAuthProvider: false },
    );

    expect(await screen.findByText('Payment failed or refunded')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/billing');
  });
});
