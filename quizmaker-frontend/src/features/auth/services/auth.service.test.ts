import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type {
  AuthenticatedUserDto,
  JwtResponse,
  LinkedAccountsResponse,
} from '../types/auth.types';
import { AuthService } from './auth.service';

const user: AuthenticatedUserDto = {
  id: 'user-1',
  username: 'architect',
  email: 'architect@example.com',
  isActive: true,
  roles: ['ROLE_USER'],
  createdAt: '2026-06-30T12:00:00Z',
  lastLoginDate: null,
  updatedAt: '2026-06-30T12:00:00Z',
};

const tokens: JwtResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  accessExpiresInMs: 900_000,
  refreshExpiresInMs: 2_592_000_000,
};

const problemError = (status: number, detail: string) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: {
    status,
    data: {
      type: 'https://quizzence.com/docs/errors/authentication-failed',
      title: 'Authentication Failed',
      status,
      detail,
    },
  },
});

describe('AuthService', () => {
  let axios: AxiosMock;
  let service: AuthService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new AuthService(axios.instance);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers with the deployed AuthenticatedUserDto response contract', async () => {
    const request = {
      username: 'architect',
      email: 'architect@example.com',
      password: 'SecurePassword1!',
    };
    axios.post.mockResolvedValue({ data: user });

    await expect(service.register(request)).resolves.toBe(user);
    expect(axios.post).toHaveBeenCalledWith('/v1/auth/register', request);
  });

  it('logs in and refreshes tokens with unchanged request bodies', async () => {
    const loginRequest = { username: 'architect', password: 'SecurePassword1!' };
    const refreshRequest = { refreshToken: 'refresh-token' };
    axios.post
      .mockResolvedValueOnce({ data: tokens })
      .mockResolvedValueOnce({ data: tokens });

    await expect(service.login(loginRequest)).resolves.toBe(tokens);
    await expect(service.refreshToken(refreshRequest)).resolves.toBe(tokens);

    expect(axios.post).toHaveBeenNthCalledWith(1, '/v1/auth/login', loginRequest);
    expect(axios.post).toHaveBeenNthCalledWith(2, '/v1/auth/refresh', refreshRequest);
  });

  it('logs out through the bearer-authenticated endpoint without a body', async () => {
    axios.post.mockResolvedValue({ data: undefined });

    await expect(service.logout()).resolves.toBeUndefined();
    expect(axios.post).toHaveBeenCalledWith('/v1/auth/logout');
  });

  it('keeps logout idempotent when server revocation fails', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    axios.post.mockRejectedValue(new Error('Network unavailable'));

    await expect(service.logout()).resolves.toBeUndefined();
    expect(warning).toHaveBeenCalledWith(
      'Logout request failed:',
      expect.any(Error),
    );
  });

  it('retrieves the current authenticated user', async () => {
    axios.get.mockResolvedValue({ data: user });

    await expect(service.getCurrentUser()).resolves.toBe(user);
    expect(axios.get).toHaveBeenCalledWith('/v1/auth/me');
  });

  it('submits forgot, reset, and authenticated change-password requests', async () => {
    const forgotRequest = { email: 'architect@example.com' };
    const resetRequest = { newPassword: 'NewSecurePassword1!' };
    const changeRequest = {
      currentPassword: 'SecurePassword1!',
      newPassword: 'NewSecurePassword1!',
    };
    axios.post
      .mockResolvedValueOnce({ data: { message: 'Reset email sent' } })
      .mockResolvedValueOnce({ data: { message: 'Password reset' } })
      .mockResolvedValueOnce({ data: { message: 'Password updated successfully' } });

    await service.forgotPassword(forgotRequest);
    await service.resetPassword('reset-token', resetRequest);
    await expect(service.changePassword(changeRequest)).resolves.toEqual({
      message: 'Password updated successfully',
    });

    expect(axios.post).toHaveBeenNthCalledWith(
      1,
      '/v1/auth/forgot-password',
      forgotRequest,
    );
    expect(axios.post).toHaveBeenNthCalledWith(
      2,
      '/v1/auth/reset-password',
      resetRequest,
      { params: { token: 'reset-token' } },
    );
    expect(axios.post).toHaveBeenNthCalledWith(
      3,
      '/v1/auth/change-password',
      changeRequest,
    );
  });

  it('verifies an email and resends verification', async () => {
    const verifyRequest = { token: 'verification-token' };
    const resendRequest = { email: 'architect@example.com' };
    const verifyResponse = {
      verified: true,
      message: 'Email verified',
      verifiedAt: '2026-06-30T12:05:00Z',
    };
    axios.post
      .mockResolvedValueOnce({ data: verifyResponse })
      .mockResolvedValueOnce({ data: { message: 'Verification email sent' } });

    await expect(service.verifyEmail(verifyRequest)).resolves.toBe(verifyResponse);
    await service.resendVerification(resendRequest);

    expect(axios.post).toHaveBeenNthCalledWith(
      1,
      '/v1/auth/verify-email',
      verifyRequest,
    );
    expect(axios.post).toHaveBeenNthCalledWith(
      2,
      '/v1/auth/resend-verification',
      resendRequest,
    );
  });

  it('builds OAuth login/link URLs and manages linked accounts', async () => {
    const accounts: LinkedAccountsResponse = {
      accounts: [
        {
          id: 1,
          provider: 'GOOGLE',
          email: 'architect@example.com',
          name: 'Architect',
          createdAt: '2026-06-30T12:00:00Z',
          updatedAt: '2026-06-30T12:00:00Z',
        },
      ],
    };
    axios.get.mockResolvedValue({ data: accounts });
    axios.delete.mockResolvedValue({ data: undefined });

    expect(service.getOAuthAuthorizationUrl('GOOGLE')).toBe(
      '/oauth2/authorization/google',
    );
    expect(service.getOAuthAuthorizationUrl('GITHUB', 'link')).toBe(
      '/oauth2/authorization/github?action=link',
    );
    await expect(service.getLinkedAccounts()).resolves.toBe(accounts);
    await service.unlinkAccount({ provider: 'GOOGLE' });

    expect(axios.get).toHaveBeenCalledWith('/v1/auth/oauth/accounts');
    expect(axios.delete).toHaveBeenCalledWith('/v1/auth/oauth/accounts', {
      data: { provider: 'GOOGLE' },
    });
  });

  it('preserves live ProblemDetail detail text for validation failures', async () => {
    axios.post.mockRejectedValue(
      problemError(400, 'Current password is incorrect.'),
    );

    await expect(
      service.changePassword({
        currentPassword: 'wrong-password',
        newPassword: 'NewSecurePassword1!',
      }),
    ).rejects.toThrow('Validation error: Current password is incorrect.');
  });

  it.each([
    [401, 'Authentication failed'],
    [409, 'Username or email already exists'],
    [429, 'Too many requests'],
    [500, 'Server error occurred'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.post.mockRejectedValue(problemError(status, 'Backend detail'));

    await expect(
      service.login({ username: 'architect', password: 'password' }),
    ).rejects.toThrow(expectedMessage);
  });

  it('preserves network failure context', async () => {
    axios.get.mockRejectedValue(new Error('Network unavailable'));

    await expect(service.getCurrentUser()).rejects.toThrow('Network unavailable');
  });
});
