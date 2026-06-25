import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Button } from '@/components';
import { useAuth } from '@/features/auth';
import { mockCurrentUserHandler, testUser } from './msw/handlers';
import { server } from './msw/server';
import { renderWithProviders, screen, setTestAuthTokens, waitFor } from './render';

const AuthProbe = () => {
  const { isLoading, isLoggedIn, user } = useAuth();

  if (isLoading) {
    return <p>Loading auth</p>;
  }

  return <p>{isLoggedIn ? `Signed in as ${user?.username}` : 'Signed out'}</p>;
};

describe('renderWithProviders', () => {
  it('renders a component through the shared app provider wrapper', async () => {
    const handleClick = vi.fn();
    const { user } = renderWithProviders(
      <Button onClick={handleClick}>Save changes</Button>,
    );

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('mocks API-backed auth state without calling the real backend', async () => {
    server.use(mockCurrentUserHandler());
    setTestAuthTokens();

    renderWithProviders(<AuthProbe />);

    expect(await screen.findByText(`Signed in as ${testUser.username}`)).toBeInTheDocument();
  });

  it('can override API responses per test with MSW handlers', async () => {
    server.use(
      http.get('http://localhost:3000/api/v1/auth/me', () =>
        HttpResponse.json({ ...testUser, username: 'override-user' }),
      ),
    );
    setTestAuthTokens();

    renderWithProviders(<AuthProbe />);

    await waitFor(() => {
      expect(screen.getByText('Signed in as override-user')).toBeInTheDocument();
    });
  });
});
