import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryProvider } from '@/providers/QueryProvider';
import { server } from '@/test/msw/server';
import { getAccessToken, setAccessToken, setTokens } from '@/utils/tokenUtils';
import { AuthProvider, useAuth } from './AuthContext';

const currentUserEndpoint = 'http://localhost:3000/api/v1/auth/me';
const logoutEndpoint = 'http://localhost:3000/api/v1/auth/logout';

const authenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  username: 'account-a',
  email: 'account-a@example.com',
  isActive: true,
  roles: ['ROLE_USER'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const AuthProbe = () => {
  const { isLoading, logout, user } = useAuth();

  return (
    <div>
      <output aria-label="Authentication state">
        {isLoading ? 'loading' : user?.username ?? 'anonymous'}
      </output>
      <button type="button" onClick={() => void logout()}>
        Log out
      </button>
    </div>
  );
};

const renderAuth = () => render(
  <MemoryRouter initialEntries={['/quizzes']}>
    <QueryProvider>
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </QueryProvider>
  </MemoryRouter>,
);

describe('AuthProvider session transitions', () => {
  it('crosses the local boundary before revoking the captured server session', async () => {
    const user = userEvent.setup();
    let logoutAuthorization: string | null = null;
    let tokenVisibleDuringRevocation: string | null = 'not-called';
    setTokens('access-a', 'refresh-a');

    server.use(
      http.get(currentUserEndpoint, () => HttpResponse.json(authenticatedUser)),
      http.post(logoutEndpoint, ({ request }) => {
        logoutAuthorization = request.headers.get('authorization');
        tokenVisibleDuringRevocation = getAccessToken();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderAuth();
    await screen.findByText('account-a');
    await user.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => expect(logoutAuthorization).toBe('Bearer access-a'));
    expect(tokenVisibleDuringRevocation).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(screen.getByLabelText('Authentication state')).toHaveTextContent('anonymous');
  });

  it('settles a failed restore as one anonymous session', async () => {
    setAccessToken('expired-access');
    server.use(
      http.get(currentUserEndpoint, () => new HttpResponse(null, { status: 401 })),
    );

    renderAuth();

    await waitFor(() => {
      expect(screen.getByLabelText('Authentication state')).toHaveTextContent('anonymous');
    });
    expect(getAccessToken()).toBeNull();
  });
});
