import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import LoginForm from './LoginForm';

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
}));

vi.mock('../AuthContext', () => ({
  useAuth: () => ({ login: authMocks.login }),
}));

vi.mock('./OAuthButton', () => ({
  default: () => null,
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows required field feedback before an authentication request', async () => {
    const { user } = renderWithProviders(<LoginForm />, { withAuthProvider: false });

    await user.click(screen.getByLabelText('Username or Email'));
    await user.tab();
    await user.click(screen.getByLabelText('Password'));
    await user.tab();

    expect(screen.getAllByText('Username or Email is required')).toHaveLength(2);
    expect(screen.getAllByText('Password is required')).toHaveLength(2);
    expect(authMocks.login).not.toHaveBeenCalled();
  });

  it('submits the live login payload and invokes the success callback', async () => {
    const onSuccess = vi.fn();
    authMocks.login.mockResolvedValue(undefined);
    const { user } = renderWithProviders(<LoginForm onSuccess={onSuccess} />, {
      withAuthProvider: false,
    });

    await user.type(screen.getByLabelText('Username or Email'), 'learner@example.com');
    await user.type(screen.getByLabelText('Password'), 'SecurePassword1!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(authMocks.login).toHaveBeenCalledWith({
        username: 'learner@example.com',
        password: 'SecurePassword1!',
      });
    });
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('keeps the authentication failure visible to the user', async () => {
    const onError = vi.fn();
    authMocks.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });
    const { user } = renderWithProviders(<LoginForm onError={onError} />, {
      withAuthProvider: false,
    });

    await user.type(screen.getByLabelText('Username or Email'), 'learner@example.com');
    await user.type(screen.getByLabelText('Password'), 'SecurePassword1!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith('Invalid credentials');
  });
});
