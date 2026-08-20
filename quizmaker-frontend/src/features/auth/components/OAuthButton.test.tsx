import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import OAuthButton from './OAuthButton';

const authMocks = vi.hoisted(() => ({
  startOAuthAuthorization: vi.fn(),
}));

vi.mock('../services/oauthPkce', () => ({
  startOAuthAuthorization: authMocks.startOAuthAuthorization,
}));

describe('OAuthButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/');
  });

  it('starts secure authorization for the selected provider', async () => {
    authMocks.startOAuthAuthorization.mockResolvedValue(undefined);
    const { user } = renderWithProviders(
      <OAuthButton provider="GOOGLE" actionText="Sign in with" returnPath="/quizzes" />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Sign in with Google' }));

    expect(authMocks.startOAuthAuthorization).toHaveBeenCalledWith({
      provider: 'GOOGLE',
      purpose: 'login',
      returnPath: '/quizzes',
    });
  });

  it('keeps the pre-cutover compact mobile and labeled desktop treatment', () => {
    renderWithProviders(<OAuthButton provider="GITHUB" fullWidth={false} />, {
      withAuthProvider: false,
    });

    const button = screen.getByRole('button', { name: 'Continue with GitHub' });
    expect(button).toHaveClass('w-14', 'h-14', 'sm:w-full', 'sm:h-auto');
    expect(button.querySelector('span')).toHaveClass('hidden', 'sm:inline');
  });

  it('does not allow a disabled OAuth action to initiate a redirect', async () => {
    const { user } = renderWithProviders(<OAuthButton provider="GITHUB" disabled />, {
      withAuthProvider: false,
    });

    const button = screen.getByRole('button', { name: 'Continue with GitHub' });
    expect(button).toBeDisabled();
    await user.click(button);

    expect(authMocks.startOAuthAuthorization).not.toHaveBeenCalled();
  });

  it('preserves registration purpose and return path', async () => {
    authMocks.startOAuthAuthorization.mockResolvedValue(undefined);
    const { user } = renderWithProviders(
      <OAuthButton
        provider="GOOGLE"
        purpose="register"
        returnPath="/my-quizzes"
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(authMocks.startOAuthAuthorization).toHaveBeenCalledWith({
      provider: 'GOOGLE',
      purpose: 'register',
      returnPath: '/my-quizzes',
    });
  });

  it('reports a bounded error when PKCE setup fails', async () => {
    const onStartError = vi.fn();
    authMocks.startOAuthAuthorization.mockRejectedValue(new Error('secret crypto detail'));
    const { user } = renderWithProviders(
      <OAuthButton provider="GITHUB" onStartError={onStartError} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Continue with GitHub' }));

    expect(onStartError).toHaveBeenCalledWith('Secure sign-in could not start. Please try again.');
    expect(JSON.stringify(onStartError.mock.calls)).not.toContain('secret crypto detail');
  });
});
