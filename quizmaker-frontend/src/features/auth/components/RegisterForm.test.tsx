import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import RegisterForm from './RegisterForm';

const authMocks = vi.hoisted(() => ({
  register: vi.fn(),
}));

vi.mock('../AuthContext', () => ({
  useAuth: () => ({ register: authMocks.register }),
}));

vi.mock('./OAuthButton', () => ({
  default: () => null,
}));

const fillValidRegistration = async (user: ReturnType<typeof renderWithProviders>['user']) => {
  await user.type(screen.getByLabelText('Username'), 'quiz_user');
  await user.type(screen.getByLabelText('Email Address'), 'learner@example.com');
  await user.type(screen.getByLabelText('Password'), 'SecurePassword1!');
  await user.type(screen.getByLabelText('Confirm Password'), 'SecurePassword1!');
};

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires accepting the terms before registering an account', async () => {
    const { user } = renderWithProviders(<RegisterForm />, { withAuthProvider: false });

    await fillValidRegistration(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('You must accept the terms and conditions')).toBeInTheDocument();
    expect(authMocks.register).not.toHaveBeenCalled();
  });

  it('submits the live registration payload without confirmPassword', async () => {
    const onSuccess = vi.fn();
    authMocks.register.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<RegisterForm onSuccess={onSuccess} />, {
      withAuthProvider: false,
    });

    await fillValidRegistration(user);
    await user.click(screen.getByRole('checkbox', { name: /I agree to the Terms and Conditions/i }));
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(authMocks.register).toHaveBeenCalledWith({
        username: 'quiz_user',
        email: 'learner@example.com',
        password: 'SecurePassword1!',
      });
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('shows a registration error returned by the service', async () => {
    const onError = vi.fn();
    authMocks.register.mockRejectedValue({
      response: { data: { message: 'Username or email already exists' } },
    });
    const { user } = renderWithProviders(<RegisterForm onError={onError} />, {
      withAuthProvider: false,
    });

    await fillValidRegistration(user);
    await user.click(screen.getByRole('checkbox', { name: /I agree to the Terms and Conditions/i }));
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Username or email already exists')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith('Username or email already exists');
  });
});
