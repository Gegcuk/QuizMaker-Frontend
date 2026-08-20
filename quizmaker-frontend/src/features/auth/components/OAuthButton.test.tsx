import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import OAuthButton from './OAuthButton';

const authMocks = vi.hoisted(() => ({
  getOAuthAuthorizationUrl: vi.fn(),
  startOAuthAuthorization: vi.fn(),
}));

vi.mock('../services/auth.service', () => ({
  authService: {
    getOAuthAuthorizationUrl: authMocks.getOAuthAuthorizationUrl,
  },
}));

vi.mock('../services/oauthPkce', () => ({
  startOAuthAuthorization: authMocks.startOAuthAuthorization,
}));

describe('OAuthButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/');
  });

  it('uses the shared authorization URL contract for the selected provider', async () => {
    authMocks.getOAuthAuthorizationUrl.mockReturnValue('#google-oauth');
    const { user } = renderWithProviders(
      <OAuthButton provider="GOOGLE" actionText="Sign in with" />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Sign in with Google' }));

    expect(authMocks.getOAuthAuthorizationUrl).toHaveBeenCalledWith('GOOGLE');
    expect(window.location.hash).toBe('#google-oauth');
  });

  it('keeps provider context available on compact controls', () => {
    renderWithProviders(<OAuthButton provider="GITHUB" fullWidth={false} />, {
      withAuthProvider: false,
    });

    const button = screen.getByRole('button', { name: 'Continue with GitHub' });
    expect(button).toHaveClass('w-14', 'h-14');
  });

  it('does not allow a disabled OAuth action to initiate a redirect', async () => {
    authMocks.getOAuthAuthorizationUrl.mockReturnValue('#github-oauth');
    const { user } = renderWithProviders(<OAuthButton provider="GITHUB" disabled />, {
      withAuthProvider: false,
    });

    const button = screen.getByRole('button', { name: 'Continue with GitHub' });
    expect(button).toBeDisabled();
    await user.click(button);

    expect(authMocks.getOAuthAuthorizationUrl).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('');
  });

  it('starts the PKCE coordinator without using the legacy URL', async () => {
    authMocks.startOAuthAuthorization.mockResolvedValue(undefined);
    const { user } = renderWithProviders(
      <OAuthButton
        provider="GOOGLE"
        flow="pkce"
        flowLabel="PKCE"
        purpose="login"
        returnPath="/quizzes"
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Continue with Google (PKCE)' }));

    expect(authMocks.startOAuthAuthorization).toHaveBeenCalledWith({
      provider: 'GOOGLE',
      purpose: 'login',
      returnPath: '/quizzes',
    });
    expect(authMocks.getOAuthAuthorizationUrl).not.toHaveBeenCalled();
  });

  it('reports a bounded error when PKCE setup fails', async () => {
    const onStartError = vi.fn();
    authMocks.startOAuthAuthorization.mockRejectedValue(new Error('secret crypto detail'));
    const { user } = renderWithProviders(
      <OAuthButton provider="GITHUB" flow="pkce" onStartError={onStartError} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Continue with GitHub' }));

    expect(onStartError).toHaveBeenCalledWith('Secure sign-in could not start. Please try again.');
    expect(JSON.stringify(onStartError.mock.calls)).not.toContain('secret crypto detail');
  });
});
