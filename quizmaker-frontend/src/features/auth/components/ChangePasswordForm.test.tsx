import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import ChangePasswordForm from './ChangePasswordForm';

const authMocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
}));

vi.mock('@/services', () => ({
  authService: {
    changePassword: authMocks.changePassword,
  },
}));

const fillValidPasswords = async (user: ReturnType<typeof renderWithProviders>['user']) => {
  await user.type(screen.getByLabelText('Current password'), 'CurrentPassword1!');
  await user.type(screen.getByLabelText('New password'), 'NewSecurePassword1!');
  await user.type(screen.getByLabelText('Confirm new password'), 'NewSecurePassword1!');
};

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates required fields, the deployed password length range, and confirmation before submitting', async () => {
    const { user } = renderWithProviders(<ChangePasswordForm />, { withAuthProvider: false });

    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(screen.getByText('Current password is required')).toBeInTheDocument();
    expect(screen.getByText('New password is required')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your new password')).toBeInTheDocument();
    expect(authMocks.changePassword).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Current password'), 'CurrentPassword1!');
    await user.type(screen.getByLabelText('New password'), 'short');
    await user.type(screen.getByLabelText('Confirm new password'), 'different');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(screen.getByText('New password must be between 8 and 100 characters')).toBeInTheDocument();
    expect(screen.getByText('New passwords do not match')).toBeInTheDocument();
    expect(authMocks.changePassword).not.toHaveBeenCalled();
  });

  it('submits the authenticated request, clears password fields, and shows the server success message', async () => {
    const onSuccess = vi.fn();
    authMocks.changePassword.mockResolvedValue({ message: 'Password updated successfully.' });
    const { user } = renderWithProviders(<ChangePasswordForm onSuccess={onSuccess} />, {
      withAuthProvider: false,
    });

    await fillValidPasswords(user);
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => {
      expect(authMocks.changePassword).toHaveBeenCalledWith({
        currentPassword: 'CurrentPassword1!',
        newPassword: 'NewSecurePassword1!',
      });
    });
    expect(screen.getByText('Password updated successfully.')).toBeInTheDocument();
    expect(screen.getByLabelText('Current password')).toHaveValue('');
    expect(screen.getByLabelText('New password')).toHaveValue('');
    expect(screen.getByLabelText('Confirm new password')).toHaveValue('');
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('preserves a failed authenticated request message for the user', async () => {
    authMocks.changePassword.mockRejectedValue(
      new Error('Validation error: Current password is incorrect.'),
    );
    const { user } = renderWithProviders(<ChangePasswordForm />, { withAuthProvider: false });

    await fillValidPasswords(user);
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(
      await screen.findByText('Validation error: Current password is incorrect.'),
    ).toBeInTheDocument();
  });

  it('shows the rate-limit response without retaining a password value in feedback', async () => {
    authMocks.changePassword.mockRejectedValue(
      new Error('Too many requests. Please try again later.'),
    );
    const { user } = renderWithProviders(<ChangePasswordForm />, { withAuthProvider: false });

    await fillValidPasswords(user);
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(
      await screen.findByText('Too many requests. Please try again later.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('CurrentPassword1!')).not.toBeInTheDocument();
    expect(screen.queryByText('NewSecurePassword1!')).not.toBeInTheDocument();
  });

  it('disables all password inputs while the request is pending', async () => {
    let resolveRequest: (value: { message: string }) => void;
    authMocks.changePassword.mockReturnValue(
      new Promise<{ message: string }>((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { user } = renderWithProviders(<ChangePasswordForm />, { withAuthProvider: false });

    await fillValidPasswords(user);
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(screen.getByLabelText('Current password')).toBeDisabled();
    expect(screen.getByLabelText('New password')).toBeDisabled();
    expect(screen.getByLabelText('Confirm new password')).toBeDisabled();
    expect(screen.getByRole('button', { name: /updating password/i })).toBeDisabled();

    resolveRequest!({ message: 'Password updated successfully.' });
    await screen.findByText('Password updated successfully.');
  });
});
