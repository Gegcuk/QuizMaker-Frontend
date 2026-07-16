import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor, within } from '@/test/render';
import LinkedAccounts from './LinkedAccounts';

const authMocks = vi.hoisted(() => ({
  getOAuthAuthorizationUrl: vi.fn(),
  getLinkedAccounts: vi.fn(),
  unlinkAccount: vi.fn(),
}));

vi.mock('@/services', () => ({
  authService: {
    getOAuthAuthorizationUrl: authMocks.getOAuthAuthorizationUrl,
    getLinkedAccounts: authMocks.getLinkedAccounts,
    unlinkAccount: authMocks.unlinkAccount,
  },
}));

const googleAccount = {
  id: 101,
  provider: 'GOOGLE' as const,
  email: 'learner@example.com',
  name: 'Quiz Learner',
  createdAt: '2026-07-16T12:00:00Z',
  updatedAt: '2026-07-16T12:00:00Z',
};

describe('LinkedAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/');
  });

  it('renders a loading state until the authenticated account request completes', () => {
    authMocks.getLinkedAccounts.mockReturnValue(new Promise(() => undefined));

    const { container } = renderWithProviders(<LinkedAccounts />, { withAuthProvider: false });

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(2);
    expect(screen.queryByText('Not connected')).not.toBeInTheDocument();
  });

  it('renders linked account data and available providers from the live response shape', async () => {
    authMocks.getLinkedAccounts.mockResolvedValue({ accounts: [googleAccount] });

    renderWithProviders(<LinkedAccounts />, { withAuthProvider: false });

    expect(await screen.findAllByText('learner@example.com')).toHaveLength(1);
    expect(screen.getAllByText('Not connected')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Unlink' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Connect' })).toHaveLength(2);
  });

  it('starts the provider-specific OAuth link flow through the shared URL contract', async () => {
    authMocks.getLinkedAccounts.mockResolvedValue({ accounts: [googleAccount] });
    authMocks.getOAuthAuthorizationUrl.mockReturnValue('#link-github');
    const { user } = renderWithProviders(<LinkedAccounts />, { withAuthProvider: false });

    await screen.findByText('learner@example.com');
    const githubCard = screen.getAllByText('GitHub')[0].closest<HTMLElement>('.bg-theme-bg-primary')!;
    await user.click(within(githubCard).getAllByRole('button', { name: 'Connect' })[0]);

    expect(authMocks.getOAuthAuthorizationUrl).toHaveBeenCalledWith('GITHUB', 'link');
    expect(window.location.hash).toBe('#link-github');
  });

  it('shows an account-loading failure without exposing account actions', async () => {
    authMocks.getLinkedAccounts.mockRejectedValue(new Error('Linked accounts are unavailable'));

    renderWithProviders(<LinkedAccounts />, { withAuthProvider: false });

    expect(await screen.findByText('Linked accounts are unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unlink' })).not.toBeInTheDocument();
  });

  it('disables duplicate unlink confirmation while the authenticated request is pending', async () => {
    let resolveUnlink: () => void;
    authMocks.getLinkedAccounts.mockResolvedValue({ accounts: [googleAccount] });
    authMocks.unlinkAccount.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveUnlink = resolve;
      }),
    );
    const { user } = renderWithProviders(<LinkedAccounts />, { withAuthProvider: false });

    await screen.findAllByText('learner@example.com');
    await user.click(screen.getAllByRole('button', { name: 'Unlink' })[0]);

    const dialog = screen.getByRole('dialog', { name: 'Unlink Account' });
    await user.click(within(dialog).getByRole('button', { name: 'Unlink' }));

    expect(authMocks.unlinkAccount).toHaveBeenCalledWith({ provider: 'GOOGLE' });
    expect(within(dialog).getByRole('button', { name: 'Loading Unlink' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();

    resolveUnlink!();
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Unlink Account' })).not.toBeInTheDocument();
    });
    expect(screen.queryByText('learner@example.com')).not.toBeInTheDocument();
    expect(screen.getByText('Account Unlinked')).toBeInTheDocument();
  });

  it('keeps the confirmation available and shows a failure toast when unlinking is rejected', async () => {
    authMocks.getLinkedAccounts.mockResolvedValue({ accounts: [googleAccount] });
    authMocks.unlinkAccount.mockRejectedValue(new Error('A password login is required before unlinking'));
    const { user } = renderWithProviders(<LinkedAccounts />, { withAuthProvider: false });

    await screen.findAllByText('learner@example.com');
    await user.click(screen.getAllByRole('button', { name: 'Unlink' })[0]);
    await user.click(
      within(screen.getByRole('dialog', { name: 'Unlink Account' })).getByRole('button', {
        name: 'Unlink',
      }),
    );

    expect(await screen.findByText('Unlink Failed')).toBeInTheDocument();
    expect(screen.getByText('A password login is required before unlinking')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Unlink Account' })).toBeInTheDocument();
  });
});
