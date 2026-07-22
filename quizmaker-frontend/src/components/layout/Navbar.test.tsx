import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import Navbar from './Navbar';

const authMocks = vi.hoisted(() => ({
  logout: vi.fn(),
  useAuth: vi.fn(),
}));
const billingMocks = vi.hoisted(() => ({
  getBalance: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  useAuth: authMocks.useAuth,
}));

vi.mock('@/services', () => ({
  billingService: {
    getBalance: billingMocks.getBalance,
  },
}));

vi.mock('@/features/bug-report/components/BugReportModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div role="dialog">Bug report form</div> : null,
}));

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    billingMocks.getBalance.mockResolvedValue({ availableTokens: 0 });
  });

  it('provides guest navigation and opens the bug-report entry point', async () => {
    authMocks.useAuth.mockReturnValue({ isLoggedIn: false, user: null, logout: authMocks.logout });
    const { user } = renderWithProviders(<Navbar />, { withAuthProvider: false });

    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');

    await user.click(screen.getByRole('button', { name: 'Found a bug?' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Bug report form');
  });

  it('shows the authenticated navigation, token balance, and logout action', async () => {
    billingMocks.getBalance.mockResolvedValue({ availableTokens: 1250 });
    authMocks.useAuth.mockReturnValue({
      isLoggedIn: true,
      user: { roles: ['ROLE_SUPER_ADMIN'] },
      logout: authMocks.logout,
    });
    const { user } = renderWithProviders(<Navbar />, { withAuthProvider: false });

    expect(screen.getByRole('link', { name: 'My Quizzes' })).toHaveAttribute('href', '/my-quizzes');
    expect(screen.getByRole('link', { name: 'Bug Reports' })).toHaveAttribute('href', '/bug-reports');
    await waitFor(() => {
      expect(screen.getByLabelText('Profile - 1250 tokens available')).toBeInTheDocument();
    });
    expect(screen.getByText('1k')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(authMocks.logout).toHaveBeenCalledOnce();
  });

  it('only exposes the administration entry point to moderation roles', () => {
    authMocks.useAuth.mockReturnValue({
      isLoggedIn: true,
      user: { roles: ['ROLE_MODERATOR'] },
      logout: authMocks.logout,
    });
    const moderatorView = renderWithProviders(<Navbar />, { withAuthProvider: false });

    expect(screen.getByRole('link', { name: 'Administration' })).toHaveAttribute('href', '/admin');

    moderatorView.unmount();
    authMocks.useAuth.mockReturnValue({
      isLoggedIn: true,
      user: { roles: ['ROLE_USER'] },
      logout: authMocks.logout,
    });
    renderWithProviders(<Navbar />, { withAuthProvider: false });

    expect(screen.queryByRole('link', { name: 'Administration' })).not.toBeInTheDocument();
  });
});
