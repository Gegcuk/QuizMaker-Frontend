import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { act, renderWithProviders, screen, userEvent } from '@/test/render';
import { establishSession, terminateSession } from '@/features/auth/services/sessionLifecycle';
import { CHECKOUT_RECOVERY_KEY } from '../checkoutRecovery';
import { SENSITIVE_RETURN_STORAGE_KEYS } from '@/features/privacy';
import { CheckoutRecoveryLifecycle } from './CheckoutRecoveryLifecycle';
import BillingSuccessPage from './BillingSuccessPage';

const mocks = vi.hoisted(() => ({
  getBalance: vi.fn(), getCheckoutSessionStatus: vi.fn(), createCheckoutSession: vi.fn(),
  auth: { user: { id: 'account-a' } as { id: string } | null, isLoading: false },
}));
vi.mock('@/services', () => ({ billingService: mocks }));
vi.mock('@/features/auth', () => ({ useAuth: () => mocks.auth }));

const pending = { sessionId: 'checkout-canary', status: 'PENDING', credited: false, creditedTokens: null };
const credited = { ...pending, status: 'SUCCEEDED', credited: true, creditedTokens: 1500 };
const balance = { userId: 'account-a', availableTokens: 3500, reservedTokens: 100, updatedAt: '2026-10-04T12:00:00Z' };
const flush = () => act(async () => {});
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
const click = async (name: string) => {
  await act(async () => {
    const interaction = userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole('button', { name }));
    await vi.advanceTimersByTimeAsync(0);
    await interaction;
  });
};
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
};
const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}{location.hash}</output>;
};
const Content = ({ page = true }: { page?: boolean }) => <>
  <CheckoutRecoveryLifecycle />
  {page && <BillingSuccessPage />}
  <LocationProbe />
</>;
const renderPage = (route = '/billing/success?session_id=checkout-canary&customer=private-canary#hash-canary') =>
  renderWithProviders(<Content />, { route, withAuthProvider: false });
const stored = () => JSON.parse(sessionStorage.getItem(CHECKOUT_RECOVERY_KEY) ?? 'null');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-04T12:00:00Z'));
  vi.clearAllMocks();
  mocks.auth.user = { id: 'account-a' };
  mocks.auth.isLoading = false;
  mocks.getCheckoutSessionStatus.mockReset().mockResolvedValue(pending);
  mocks.getBalance.mockReset().mockResolvedValue(balance);
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('checkout reconciliation', () => {
  it('does not request or suggest another purchase when recovery is missing', async () => {
    renderPage('/billing/success');
    await flush();
    expect(screen.getByRole('heading', { name: 'Checkout recovery unavailable' })).toBeInTheDocument();
    expect(mocks.getCheckoutSessionStatus).not.toHaveBeenCalled();
    expect(screen.getByText(/support@quizzence.com/)).toBeInTheDocument();
  });

  it('scrubs return values and confirms a payment taking 45 seconds, beyond the old fifth poll', async () => {
    const start = Date.now();
    mocks.getCheckoutSessionStatus.mockImplementation(() => Promise.resolve(Date.now() - start >= 45_000 ? credited : pending));
    renderPage();
    await flush();
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/billing\/success$/);
    expect(document.body.textContent).not.toMatch(/checkout-canary|private-canary|hash-canary/);
    expect(sessionStorage.getItem(SENSITIVE_RETURN_STORAGE_KEYS.billingCheckout)).toBeNull();
    await advance(44_000);
    expect(mocks.getBalance).not.toHaveBeenCalled();
    expect(screen.getByText('Waiting for confirmation')).toBeInTheDocument();
    await advance(20_000);
    expect(mocks.getCheckoutSessionStatus.mock.calls.length).toBeGreaterThan(5);
    expect(screen.getByText('Payment confirmed — tokens credited')).toBeInTheDocument();
    expect(screen.getByText('3,500 tokens')).toBeInTheDocument();
    expect(stored()).toBeNull();
    expect(mocks.getBalance).toHaveBeenCalledOnce();
    await advance(180_000);
    expect(mocks.getBalance).toHaveBeenCalledOnce();
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('distinguishes successful payment from credit and keeps checking until credited', async () => {
    mocks.getCheckoutSessionStatus.mockResolvedValue({ ...pending, status: 'SUCCEEDED' });
    renderPage();
    await flush();
    expect(screen.getByText('Payment succeeded. Tokens are still awaiting credit.')).toBeInTheDocument();
    expect(mocks.getBalance).not.toHaveBeenCalled();
    expect(stored()).not.toBeNull();
    mocks.getCheckoutSessionStatus.mockResolvedValue(credited);
    await advance(2_000);
    expect(screen.getByText('3,500 tokens')).toBeInTheDocument();
  });

  it('uses increasing delays, stops within three minutes after ten checks, and allows explicit retry', async () => {
    const times: number[] = [];
    mocks.getCheckoutSessionStatus.mockImplementation(() => { times.push(Date.now()); return Promise.resolve(pending); });
    renderPage();
    await flush();
    await advance(180_000);
    expect(times).toHaveLength(10);
    const gaps = times.slice(1).map((time, i) => time - times[i]);
    expect(gaps.every((gap, i) => i === 0 || gap > gaps[i - 1])).toBe(true);
    expect(times[9] - times[0]).toBeLessThanOrEqual(180_000);
    expect(screen.getByText('Automatic checks stopped')).toBeInTheDocument();
    expect(screen.queryByText(/Another automatic check is scheduled/)).not.toBeInTheDocument();
    await advance(20_000);
    expect(times).toHaveLength(10);
    mocks.getCheckoutSessionStatus.mockResolvedValue(credited);
    await click('Check again');
    await flush();
    expect(screen.getByText('3,500 tokens')).toBeInTheDocument();
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('bounds a hung status request and ignores its late success after retry', async () => {
    const old = deferred<typeof credited>();
    mocks.getCheckoutSessionStatus.mockReturnValueOnce(old.promise);
    renderPage();
    expect(screen.getByRole('button', { name: 'Checking…' })).toBeDisabled();
    await advance(10_000);
    expect(screen.getByText('Checkout status unavailable')).toBeInTheDocument();
    expect(mocks.getCheckoutSessionStatus.mock.calls[0][1].aborted).toBe(true);
    await click('Check again');
    await act(async () => old.resolve(credited));
    expect(screen.getByText('Waiting for confirmation')).toBeInTheDocument();
    expect(mocks.getBalance).not.toHaveBeenCalled();
  });

  it('enforces the wall-clock deadline even while the last request is pending', async () => {
    renderPage();
    await flush();
    await advance(177_000);
    const late = deferred<typeof credited>();
    mocks.getCheckoutSessionStatus.mockReturnValueOnce(late.promise);
    await advance(3_000);
    expect(screen.getByText('Automatic checks stopped')).toBeInTheDocument();
    await act(async () => late.resolve(credited));
    expect(mocks.getBalance).not.toHaveBeenCalled();
  });

  it('cancels the scheduled poll when manual retry begins', async () => {
    renderPage();
    await flush();
    await advance(1_000);
    await click('Check again');
    await advance(1_000);
    expect(mocks.getCheckoutSessionStatus).toHaveBeenCalledTimes(2);
    await advance(1_000);
    expect(mocks.getCheckoutSessionStatus).toHaveBeenCalledTimes(3);
  });

  it('pauses offline and coalesces reconnect plus visibility into one resync', async () => {
    renderPage();
    await flush();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    act(() => window.dispatchEvent(new Event('offline')));
    await advance(20_000);
    expect(screen.getByText('You’re offline')).toBeInTheDocument();
    expect(mocks.getCheckoutSessionStatus).toHaveBeenCalledOnce();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('online')));
    await flush();
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    await flush();
    expect(mocks.getCheckoutSessionStatus).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Waiting for confirmation')).toBeInTheDocument();
  });

  it.each(['online', 'visibilitychange'])('performs just one %s resync after exhaustion, without restarting a loop', async event => {
    renderPage();
    await flush();
    await advance(181_000);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(mocks.getCheckoutSessionStatus).toHaveBeenCalledTimes(10);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    act(() => (event === 'online' ? window : document).dispatchEvent(new Event(event)));
    await flush();
    expect(mocks.getCheckoutSessionStatus).toHaveBeenCalledTimes(11);
    expect(screen.getByText('Automatic checks stopped')).toBeInTheDocument();
    await advance(60_000);
    expect(mocks.getCheckoutSessionStatus).toHaveBeenCalledTimes(11);
  });

  it('starts offline without a request and checks backend truth on reconnect', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    renderPage();
    await flush();
    expect(screen.getByText('You’re offline')).toBeInTheDocument();
    expect(mocks.getCheckoutSessionStatus).not.toHaveBeenCalled();
    mocks.getCheckoutSessionStatus.mockResolvedValue(credited);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('online')));
    await flush();
    expect(screen.getByText('3,500 tokens')).toBeInTheDocument();
  });

  it('recovers on same-tab reload without extending expiry, then clears at five minutes', async () => {
    const first = renderPage();
    await flush();
    const original = stored();
    first.unmount();
    await advance(240_000);
    renderPage('/billing/success');
    await flush();
    expect(stored()).toEqual(original);
    expect(mocks.getCheckoutSessionStatus).toHaveBeenCalledTimes(2);
    await advance(60_000);
    expect(stored()).toBeNull();
    expect(screen.getByText('Checkout recovery expired')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check again' })).not.toBeInTheDocument();
  });

  it('clears recovery at expiry even after leaving the page', async () => {
    const page = renderPage();
    await flush();
    page.rerender(<Content page={false} />);
    await advance(300_000);
    expect(stored()).toBeNull();
    expect(mocks.getCheckoutSessionStatus).toHaveBeenCalledOnce();
  });

  it('clears abandoned recovery on logout and prevents reuse by a new account', async () => {
    establishSession('fixture-access', 'fixture-refresh');
    const page = renderPage();
    await flush();
    page.rerender(<Content page={false} />);
    act(() => { terminateSession('logout'); });
    expect(stored()).toBeNull();
    mocks.auth.user = { id: 'account-b' };
    page.rerender(<Content />);
    await flush();
    expect(screen.getByText('Checkout recovery unavailable')).toBeInTheDocument();
    expect(mocks.getCheckoutSessionStatus).toHaveBeenCalledOnce();
  });

  it('discards pending status work on account change', async () => {
    const old = deferred<typeof credited>();
    mocks.getCheckoutSessionStatus.mockReturnValueOnce(old.promise);
    const page = renderPage();
    await flush();
    mocks.auth.user = { id: 'account-b' };
    page.rerender(<Content />);
    await act(async () => old.resolve(credited));
    expect(screen.getByText('Checkout recovery unavailable')).toBeInTheDocument();
    expect(stored()).toBeNull();
    expect(mocks.getBalance).not.toHaveBeenCalled();
    expect(mocks.getCheckoutSessionStatus.mock.calls[0][1].aborted).toBe(true);
  });

  it('discards pending balance work on logout', async () => {
    establishSession('fixture-access', 'fixture-refresh');
    const old = deferred<typeof balance>();
    mocks.getCheckoutSessionStatus.mockResolvedValue(credited);
    mocks.getBalance.mockReturnValueOnce(old.promise);
    renderPage();
    await flush();
    act(() => { terminateSession('logout'); });
    await act(async () => old.resolve(balance));
    expect(screen.queryByText('3,500 tokens')).not.toBeInTheDocument();
    expect(mocks.getBalance.mock.calls[0][0].aborted).toBe(true);
  });

  it('discards status responses after unmount and cannot clear a newer recovery', async () => {
    const old = deferred<typeof credited>();
    mocks.getCheckoutSessionStatus.mockReturnValueOnce(old.promise);
    const page = renderPage();
    await flush();
    page.unmount();
    renderPage('/billing/success?session_id=new-checkout');
    await flush();
    await act(async () => old.resolve(credited));
    expect(stored().sessionId).toBe('new-checkout');
    expect(mocks.getBalance).not.toHaveBeenCalled();
  });

  it('keeps recovery usable across StrictMode effect cleanup', async () => {
    renderWithProviders(<StrictMode><Content /></StrictMode>, {
      route: '/billing/success?session_id=checkout-canary', withAuthProvider: false,
    });
    await flush();
    expect(screen.getByText('Waiting for confirmation')).toBeInTheDocument();
    expect(stored().accountId).toBe('account-a');
  });

  it.each([
    ['FAILED', 'Payment failed'], ['REFUNDED', 'Payment refunded'],
    ['PARTIALLY_REFUNDED', 'Payment partially refunded'],
  ])('renders %s explicitly even if historical credit is true', async (status, title) => {
    mocks.getCheckoutSessionStatus.mockResolvedValue({ ...credited, status });
    renderPage();
    await flush();
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(stored()).toBeNull();
    await advance(180_000);
    expect(mocks.getCheckoutSessionStatus).toHaveBeenCalledOnce();
    expect(mocks.getBalance).not.toHaveBeenCalled();
  });

  it.each([401, 403, 404])('stops and clears inaccessible checkout after HTTP %i without exposing backend text', async status => {
    mocks.getCheckoutSessionStatus.mockRejectedValue(Object.assign(new Error('private-account-canary'), { status }));
    renderPage();
    await flush();
    expect(screen.getByText('Checkout recovery unavailable')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('private-account-canary');
    expect(stored()).toBeNull();
    expect(mocks.getBalance).not.toHaveBeenCalled();
  });

  it.each([429, 500])('offers manual recovery after HTTP %i without an automatic retry storm', async status => {
    mocks.getCheckoutSessionStatus.mockRejectedValue(Object.assign(new Error('private-detail'), { status }));
    renderPage();
    await flush();
    expect(screen.getByText('Checkout status unavailable')).toBeInTheDocument();
    await advance(180_000);
    expect(mocks.getCheckoutSessionStatus).toHaveBeenCalledOnce();
    expect(stored()).not.toBeNull();
  });

  it('renders unknown status safely, without treating a credited flag as a known outcome', async () => {
    mocks.getCheckoutSessionStatus.mockResolvedValue({ ...credited, status: 'private-unknown-canary' });
    renderPage();
    await flush();
    expect(screen.getByText('Checkout status unavailable')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('private-unknown-canary');
    expect(mocks.getBalance).not.toHaveBeenCalled();
  });

  it('shows an explicit stopped state when the service rejects malformed checkout data', async () => {
    mocks.getCheckoutSessionStatus.mockRejectedValue(new Error('Invalid checkout response'));
    renderPage();
    await flush();
    expect(screen.getByText('Checkout status unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check again' })).toBeEnabled();
    expect(mocks.getBalance).not.toHaveBeenCalled();
    await advance(180_000);
    expect(mocks.getCheckoutSessionStatus).toHaveBeenCalledOnce();
  });

  it('discards a status response arriving after recovery expiry', async () => {
    const page = renderPage();
    await flush();
    page.unmount();
    await advance(299_000);
    const late = deferred<typeof credited>();
    mocks.getCheckoutSessionStatus.mockReturnValueOnce(late.promise);
    renderPage('/billing/success');
    await advance(1_000);
    await act(async () => late.resolve(credited));
    expect(screen.getByText('Checkout recovery expired')).toBeInTheDocument();
    expect(mocks.getBalance).not.toHaveBeenCalled();
    expect(stored()).toBeNull();
  });

  it('discards old status work immediately on an authentication generation change', async () => {
    const late = deferred<typeof credited>();
    mocks.getCheckoutSessionStatus.mockReturnValueOnce(late.promise);
    renderPage();
    await flush();
    act(() => { establishSession('other-access-fixture', 'other-refresh-fixture', 'account-switch'); });
    await act(async () => late.resolve(credited));
    expect(screen.getByText('Checkout recovery unavailable')).toBeInTheDocument();
    expect(mocks.getBalance).not.toHaveBeenCalled();
    expect(stored()).toBeNull();
  });

  it('discards old balance work after account change or unmount', async () => {
    const late = deferred<typeof balance>();
    mocks.getCheckoutSessionStatus.mockResolvedValue(credited);
    mocks.getBalance.mockReturnValueOnce(late.promise);
    const page = renderPage();
    await flush();
    mocks.auth.user = { id: 'account-b' };
    page.rerender(<Content />);
    await act(async () => late.resolve(balance));
    expect(screen.queryByText('3,500 tokens')).not.toBeInTheDocument();
    expect(mocks.getBalance.mock.calls[0][0].aborted).toBe(true);
    page.unmount();
    await advance(180_000);
    expect(mocks.getBalance).toHaveBeenCalledOnce();
  });

  it('bounds a hung balance request while preserving confirmed credit', async () => {
    const late = deferred<typeof balance>();
    mocks.getCheckoutSessionStatus.mockResolvedValue(credited);
    mocks.getBalance.mockReturnValueOnce(late.promise);
    renderPage();
    await flush();
    await advance(10_000);
    expect(screen.getByText('Payment confirmed — tokens credited')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh balance' })).toBeInTheDocument();
    await act(async () => late.resolve(balance));
    expect(screen.queryByText('3,500 tokens')).not.toBeInTheDocument();
  });

  it('keeps backend credit confirmation when balance fails, and retries only the balance', async () => {
    mocks.getCheckoutSessionStatus.mockResolvedValue(credited);
    mocks.getBalance.mockRejectedValueOnce(new Error('offline'));
    renderPage();
    await flush();
    expect(screen.getByText('Payment confirmed — tokens credited')).toBeInTheDocument();
    expect(screen.getByText(/latest balance could not be loaded/)).toBeInTheDocument();
    expect(stored()).toBeNull();
    await click('Refresh balance');
    await flush();
    expect(screen.getByText('3,500 tokens')).toBeInTheDocument();
    expect(mocks.getCheckoutSessionStatus).toHaveBeenCalledOnce();
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it.each([{ ...balance, userId: 'account-b' }, { ...balance, availableTokens: '3500' }])('rejects a malformed or other-account balance', async invalid => {
    mocks.getCheckoutSessionStatus.mockResolvedValue(credited);
    mocks.getBalance.mockResolvedValue(invalid);
    renderPage();
    await flush();
    expect(screen.queryByText('3,500 tokens')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh balance' })).toBeInTheDocument();
  });
});
