import React, { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import { clearTokens } from '@/utils';
import OAuthCallbackPage from './OAuthCallbackPage';
import {
  OAUTH_CALLBACK_STORAGE_KEY,
  OAUTH_LEGACY_TEST_STORAGE_KEY,
  resetOAuthCallbackProcessingForTests,
} from '@/features/auth/services/oauthCallback';
import {
  prepareOAuthAuthorization,
  storePendingOAuthFlow,
} from '@/features/auth/services/oauthPkce';

const authMocks = vi.hoisted(() => ({
  checkAuthStatus: vi.fn(),
}));

vi.mock('../features/auth', () => ({
  useAuth: () => ({ checkAuthStatus: authMocks.checkAuthStatus }),
}));

const tokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  accessExpiresInMs: 43_200_000,
  refreshExpiresInMs: 345_600_000,
};

describe('OAuthCallbackPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authMocks.checkAuthStatus.mockReset();
    authMocks.checkAuthStatus.mockResolvedValue(undefined);
    clearTokens();
    sessionStorage.clear();
    resetOAuthCallbackProcessingForTests();
  });

  it('exchanges a secure callback once under React Strict Mode', async () => {
    const now = Date.now();
    const prepared = await prepareOAuthAuthorization({
      provider: 'GOOGLE',
      purpose: 'login',
      returnPath: '/quizzes',
      location: { origin: 'http://localhost:3000' },
      now,
    });
    storePendingOAuthFlow(prepared.pending);
    sessionStorage.setItem(OAUTH_CALLBACK_STORAGE_KEY, JSON.stringify({
      version: 1,
      kind: 'code',
      value: 'C'.repeat(43),
      capturedAt: now,
    }));
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(tokens), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    renderWithProviders(
      <StrictMode><OAuthCallbackPage /></StrictMode>,
      { route: '/oauth2/redirect', withAuthProvider: false },
    );

    expect(await screen.findByText('Success!')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(authMocks.checkAuthStatus).toHaveBeenCalledOnce();
  });

  it('keeps the temporary legacy comparison callback working', async () => {
    sessionStorage.setItem(OAUTH_LEGACY_TEST_STORAGE_KEY, JSON.stringify({
      version: 1,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      capturedAt: Date.now(),
    }));
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    renderWithProviders(
      <StrictMode><OAuthCallbackPage /></StrictMode>,
      { route: '/oauth2/redirect', withAuthProvider: false },
    );

    expect(await screen.findByText('Success!')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(authMocks.checkAuthStatus).toHaveBeenCalledOnce();
  });
});
