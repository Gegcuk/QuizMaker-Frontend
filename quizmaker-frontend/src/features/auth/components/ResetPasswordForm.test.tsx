import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import ResetPasswordForm from './ResetPasswordForm';

const authMocks = vi.hoisted(() => ({
  resetPassword: vi.fn(),
}));

vi.mock('@/services', () => ({
  authService: {
    resetPassword: authMocks.resetPassword,
  },
}));

const fillValidPassword = async (user: ReturnType<typeof renderWithProviders>['user']) => {
  await user.type(screen.getByLabelText('New Password'), 'NewSecurePassword1!');
  await user.type(screen.getByLabelText('Confirm New Password'), 'NewSecurePassword1!');
};

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not show a password form without a reset token', () => {
    renderWithProviders(<ResetPasswordForm />, { withAuthProvider: false });

    expect(screen.getByText('Invalid reset link')).toBeInTheDocument();
    expect(screen.queryByLabelText('New Password')).not.toBeInTheDocument();
    expect(authMocks.resetPassword).not.toHaveBeenCalled();
  });

  it('validates password confirmation before calling the reset endpoint', async () => {
    const { user } = renderWithProviders(<ResetPasswordForm />, {
      route: '/reset-password?token=reset-token',
      withAuthProvider: false,
    });

    await user.type(screen.getByLabelText('New Password'), 'NewSecurePassword1!');
    await user.type(screen.getByLabelText('Confirm New Password'), 'DifferentPassword1!');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(authMocks.resetPassword).not.toHaveBeenCalled();
  });

  it('uses the query token and live request body when resetting a password', async () => {
    const onSuccess = vi.fn();
    authMocks.resetPassword.mockResolvedValue({ message: 'Password updated successfully' });
    const { user } = renderWithProviders(<ResetPasswordForm onSuccess={onSuccess} />, {
      route: '/reset-password?token=reset-token',
      withAuthProvider: false,
    });

    await fillValidPassword(user);
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    await waitFor(() => {
      expect(authMocks.resetPassword).toHaveBeenCalledWith('reset-token', {
        newPassword: 'NewSecurePassword1!',
      });
    });
    expect(await screen.findByText('Password reset successful')).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('shows a reset failure returned by the service', async () => {
    const onError = vi.fn();
    authMocks.resetPassword.mockRejectedValue({
      response: { data: { message: 'This reset link has expired' } },
    });
    const { user } = renderWithProviders(<ResetPasswordForm onError={onError} />, {
      route: '/reset-password?token=reset-token',
      withAuthProvider: false,
    });

    await fillValidPassword(user);
    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    expect(await screen.findByText('This reset link has expired')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith('This reset link has expired');
  });
});
