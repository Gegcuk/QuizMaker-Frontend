import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { renderWithProviders, screen } from '@/test/render';
import UserMenu from './UserMenu';

const authMocks = vi.hoisted(() => ({
  logout: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  useAuth: authMocks.useAuth,
}));

const LocationProbe = () => <output data-testid="location">{useLocation().pathname}</output>;

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.logout.mockResolvedValue(undefined);
    authMocks.useAuth.mockReturnValue({
      user: {
        id: 'user-1',
        username: 'Quiz Creator',
        email: 'creator@example.com',
        roles: ['ROLE_QUIZ_CREATOR'],
      },
      logout: authMocks.logout,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows role-specific actions and navigates from the expanded menu', async () => {
    const { user } = renderWithProviders(
      <>
        <UserMenu />
        <LocationProbe />
      </>,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'User menu' }));

    expect(screen.getAllByText('Quiz Creator')).toHaveLength(3);
    expect(screen.getByRole('menuitem', { name: 'My Quizzes' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Create Quiz' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Admin Panel' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: 'Profile' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/profile');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('confirms logout and surfaces a logout failure', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    authMocks.logout.mockRejectedValue(new Error('Network unavailable'));
    const { user } = renderWithProviders(<UserMenu />, { withAuthProvider: false });

    await user.click(screen.getByRole('button', { name: 'User menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Logout' }));

    expect(authMocks.logout).toHaveBeenCalledOnce();
    expect(await screen.findByText('Logout failed. Please try again.')).toBeInTheDocument();
  });

  it('does not render without an authenticated user', () => {
    authMocks.useAuth.mockReturnValue({ user: null, logout: authMocks.logout });

    renderWithProviders(<UserMenu />, { withAuthProvider: false });

    expect(screen.queryByRole('button', { name: 'User menu' })).not.toBeInTheDocument();
  });
});
