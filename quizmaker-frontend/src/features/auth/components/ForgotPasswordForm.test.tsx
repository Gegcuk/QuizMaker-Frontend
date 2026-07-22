import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import ForgotPasswordForm from './ForgotPasswordForm';

const authMocks = vi.hoisted(() => ({
  forgotPassword: vi.fn(),
}));

vi.mock('@/services', () => ({
  authService: {
    forgotPassword: authMocks.forgotPassword,
  },
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates that an email address is present and well formed', async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />, { withAuthProvider: false });

    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(screen.getByText('Email is required')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Email Address'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    expect(authMocks.forgotPassword).not.toHaveBeenCalled();
  });

  it('submits the live forgot-password payload and renders the confirmation state', async () => {
    const onSuccess = vi.fn();
    authMocks.forgotPassword.mockResolvedValue({ message: 'Reset email sent' });
    const { user } = renderWithProviders(<ForgotPasswordForm onSuccess={onSuccess} />, {
      withAuthProvider: false,
    });

    await user.type(screen.getByLabelText('Email Address'), '  learner@example.com  ');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() => {
      expect(authMocks.forgotPassword).toHaveBeenCalledWith({ email: 'learner@example.com' });
    });
    expect(await screen.findByText('Password reset email sent')).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('renders a returned request error and notifies the caller', async () => {
    const onError = vi.fn();
    authMocks.forgotPassword.mockRejectedValue({
      response: { data: { message: 'Password reset is temporarily unavailable' } },
    });
    const { user } = renderWithProviders(<ForgotPasswordForm onError={onError} />, {
      withAuthProvider: false,
    });

    await user.type(screen.getByLabelText('Email Address'), 'learner@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(
      await screen.findByText('Password reset is temporarily unavailable'),
    ).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith('Password reset is temporarily unavailable');
  });
});
