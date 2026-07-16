import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import EmailVerification from './EmailVerification';

const authMocks = vi.hoisted(() => ({
  resendVerification: vi.fn(),
  verifyEmail: vi.fn(),
}));

vi.mock('@/services', () => ({
  authService: {
    resendVerification: authMocks.resendVerification,
    verifyEmail: authMocks.verifyEmail,
  },
}));

describe('EmailVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies the query token through the live request payload', async () => {
    const onSuccess = vi.fn();
    authMocks.verifyEmail.mockResolvedValue({
      verified: true,
      message: 'Email verified',
      verifiedAt: '2026-07-16T12:00:00Z',
    });

    renderWithProviders(<EmailVerification onSuccess={onSuccess} />, {
      route: '/verify-email?token=verification-token',
      withAuthProvider: false,
    });

    await waitFor(() => {
      expect(authMocks.verifyEmail).toHaveBeenCalledWith({ token: 'verification-token' });
    });
    expect(await screen.findByText('Email verified successfully!')).toBeInTheDocument();
    expect(screen.getByText('Email verified')).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('offers a resend action after an expired verification token', async () => {
    authMocks.verifyEmail.mockRejectedValue({
      response: { status: 400, data: { message: 'Token expired' } },
    });
    authMocks.resendVerification.mockResolvedValue({ message: 'Verification email sent' });
    const { user } = renderWithProviders(<EmailVerification />, {
      route: '/verify-email?token=expired-token&email=%20learner%40example.com%20',
      withAuthProvider: false,
    });

    expect(await screen.findByText('Verification link expired')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Resend verification email' }));

    await waitFor(() => {
      expect(authMocks.resendVerification).toHaveBeenCalledWith({ email: 'learner@example.com' });
    });
    expect(await screen.findByText('Verification email sent! Please check your inbox.')).toBeInTheDocument();
  });

  it('keeps a verification service error visible and notifies the caller', async () => {
    const onError = vi.fn();
    authMocks.verifyEmail.mockRejectedValue({
      response: { status: 500, data: { message: 'Verification service is unavailable' } },
    });

    renderWithProviders(<EmailVerification onError={onError} />, {
      route: '/verify-email?token=verification-token',
      withAuthProvider: false,
    });

    expect(await screen.findByText('Verification failed')).toBeInTheDocument();
    expect(screen.getByText('Verification service is unavailable')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith('Verification service is unavailable');
  });
});
