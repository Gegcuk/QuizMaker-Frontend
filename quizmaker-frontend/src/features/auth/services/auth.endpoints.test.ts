import { describe, expect, it } from 'vitest';
import { AUTH_ENDPOINTS } from './auth.endpoints';

describe('AUTH_ENDPOINTS', () => {
  it('matches every deployed authentication endpoint', () => {
    expect(AUTH_ENDPOINTS.REGISTER).toBe('/v1/auth/register');
    expect(AUTH_ENDPOINTS.LOGIN).toBe('/v1/auth/login');
    expect(AUTH_ENDPOINTS.REFRESH).toBe('/v1/auth/refresh');
    expect(AUTH_ENDPOINTS.LOGOUT).toBe('/v1/auth/logout');
    expect(AUTH_ENDPOINTS.ME).toBe('/v1/auth/me');
    expect(AUTH_ENDPOINTS.FORGOT_PASSWORD).toBe('/v1/auth/forgot-password');
    expect(AUTH_ENDPOINTS.RESET_PASSWORD).toBe('/v1/auth/reset-password');
    expect(AUTH_ENDPOINTS.CHANGE_PASSWORD).toBe('/v1/auth/change-password');
    expect(AUTH_ENDPOINTS.VERIFY_EMAIL).toBe('/v1/auth/verify-email');
    expect(AUTH_ENDPOINTS.RESEND_VERIFICATION).toBe('/v1/auth/resend-verification');
    expect(AUTH_ENDPOINTS.OAUTH_ACCOUNTS).toBe('/v1/auth/oauth/accounts');
  });

  it('builds Spring Security OAuth authorization URLs outside the API prefix', () => {
    expect(AUTH_ENDPOINTS.OAUTH_AUTHORIZATION('GOOGLE')).toBe(
      '/oauth2/authorization/google',
    );
    expect(AUTH_ENDPOINTS.OAUTH_AUTHORIZATION('GitHub')).toBe(
      '/oauth2/authorization/github',
    );
  });
});
