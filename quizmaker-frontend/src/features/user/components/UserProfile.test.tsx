import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { UserProfileResponse } from '@/types';
import UserProfile from './UserProfile';

const authMocks = vi.hoisted(() => ({
  resendVerification: vi.fn(),
  updateUserProfile: vi.fn(),
  getUserProfile: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  LinkedAccounts: () => <div>Linked accounts</div>,
  useAuth: authMocks.useAuth,
}));

vi.mock('@/services', () => ({
  authService: {
    resendVerification: authMocks.resendVerification,
  },
  userService: {
    getUserProfile: authMocks.getUserProfile,
    updateUserProfile: authMocks.updateUserProfile,
  },
}));

const profile: UserProfileResponse = {
  id: '11111111-1111-4111-8111-111111111111',
  username: 'quizmaster',
  email: 'quizmaster@example.com',
  displayName: 'Quiz Master',
  bio: null,
  avatarUrl: null,
  preferences: {},
  joinedAt: '2026-01-01T12:00:00Z',
  verified: false,
  roles: ['ROLE_USER'],
  version: 1,
};

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.useAuth.mockReturnValue({
      user: {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        roles: profile.roles,
      },
    });
    authMocks.getUserProfile.mockResolvedValue(profile);
  });

  it('loads the authenticated profile and sends a verification email for an unverified user', async () => {
    authMocks.resendVerification.mockResolvedValue({ message: 'Verification email sent' });
    const { user } = renderWithProviders(<UserProfile />, { withAuthProvider: false });

    expect(await screen.findByText('Email Not Verified')).toBeInTheDocument();
    expect(screen.getByText('Linked accounts')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Resend verification email' }));

    await waitFor(() => {
      expect(authMocks.resendVerification).toHaveBeenCalledWith({ email: profile.email });
    });
    expect(
      await screen.findByText('Verification email sent! Please check your inbox.'),
    ).toBeInTheDocument();
  });

  it('validates edits before updating the profile and reports the saved profile', async () => {
    const onUpdate = vi.fn();
    authMocks.updateUserProfile.mockResolvedValue({ ...profile, username: 'updated-user' });
    const { user } = renderWithProviders(<UserProfile onUpdate={onUpdate} />, { withAuthProvider: false });

    await screen.findByText('Email Not Verified');
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByLabelText('Username'));
    await user.type(screen.getByLabelText('Username'), 'bad');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByText('Username must be at least 4 characters')).toBeInTheDocument();
    expect(authMocks.updateUserProfile).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Username'));
    await user.type(screen.getByLabelText('Username'), 'updated-user');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(authMocks.updateUserProfile).toHaveBeenCalledWith({
        username: 'updated-user',
        email: profile.email,
        displayName: profile.displayName,
        bio: '',
      });
    });
    expect(onUpdate).toHaveBeenCalledWith({ ...profile, username: 'updated-user' });
    expect(screen.getByText('@updated-user')).toBeInTheDocument();
  });

  it('renders the service error when profile loading fails', async () => {
    authMocks.getUserProfile.mockRejectedValue({ response: { data: { message: 'Profile unavailable' } } });

    renderWithProviders(<UserProfile />, { withAuthProvider: false });

    expect(await screen.findByText('Profile unavailable')).toBeInTheDocument();
  });
});
