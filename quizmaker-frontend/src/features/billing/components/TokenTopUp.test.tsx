import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import TokenTopUp from './TokenTopUp';

const billingMocks = vi.hoisted(() => ({
  createCheckoutSession: vi.fn(),
  getPacks: vi.fn(),
}));

vi.mock('@/services', () => ({
  billingService: {
    createCheckoutSession: billingMocks.createCheckoutSession,
    getPacks: billingMocks.getPacks,
  },
}));

const starterPack = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Starter',
  description: 'A small token pack',
  tokens: 1000,
  priceCents: 500,
  currency: 'usd',
  stripePriceId: 'price_starter',
};

const proPack = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Pro',
  description: 'A larger token pack',
  tokens: 5000,
  priceCents: 1500,
  currency: 'usd',
  stripePriceId: 'price_pro',
};

describe('TokenTopUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/');
  });

  it('sorts live packs, submits the selected checkout payload, and redirects to Stripe', async () => {
    billingMocks.getPacks.mockResolvedValue([proPack, starterPack]);
    billingMocks.createCheckoutSession.mockResolvedValue({
      url: '#stripe-checkout',
      sessionId: 'cs_live_123',
    });
    const { user } = renderWithProviders(<TokenTopUp />, { withAuthProvider: false });

    const starter = await screen.findByRole('button', { name: /Select Starter pack/i });
    expect(starter).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: /Select Pro pack/i }));
    await user.click(screen.getByRole('button', { name: 'Top up tokens' }));

    await waitFor(() => {
      expect(billingMocks.createCheckoutSession).toHaveBeenCalledWith({
        packId: proPack.id,
        priceId: 'price_pro',
      });
    });
    expect(window.location.hash).toBe('#stripe-checkout');
  });

  it('keeps a checkout permission failure visible after refreshing packs', async () => {
    billingMocks.getPacks.mockResolvedValue([starterPack]);
    billingMocks.createCheckoutSession.mockRejectedValue({ status: 403 });
    const { user } = renderWithProviders(<TokenTopUp />, { withAuthProvider: false });

    await screen.findByRole('button', { name: /Select Starter pack/i });
    await user.click(screen.getByRole('button', { name: 'Top up tokens' }));

    expect(
      await screen.findByText('You do not have permission to purchase tokens.'),
    ).toBeInTheDocument();
    expect(billingMocks.createCheckoutSession).toHaveBeenCalledOnce();
  });

  it('explains when the billing feature is unavailable', async () => {
    billingMocks.getPacks.mockRejectedValue({ status: 404 });

    renderWithProviders(<TokenTopUp />, { withAuthProvider: false });

    expect(
      await screen.findByText('Token purchases are not yet available in this environment.'),
    ).toBeInTheDocument();
  });
});
