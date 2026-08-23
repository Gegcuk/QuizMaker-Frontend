import { describe, expect, it } from 'vitest';
import { useLocation } from 'react-router-dom';
import { renderWithProviders, screen } from '@/test/render';
import { useSensitiveReturn } from './useSensitiveReturn';

const PasswordResetProbe = () => {
  const location = useLocation();
  const passwordReset = useSensitiveReturn('passwordReset');

  return (
    <>
      <output data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</output>
      <output data-testid="token">{passwordReset?.token ?? 'missing'}</output>
    </>
  );
};

describe('SensitiveUrlBoundary', () => {
  it('captures and scrubs a sensitive SPA navigation before rendering its owner', async () => {
    renderWithProviders(<PasswordResetProbe />, {
      route: '/reset-password?token=reset-token-canary&unknown=unknown-canary#hash-canary',
      withAuthProvider: false,
    });

    expect(await screen.findByTestId('location')).toHaveTextContent('/reset-password');
    expect(screen.getByTestId('token')).toHaveTextContent('reset-token-canary');
    expect(window.sessionStorage.length).toBe(0);
  });
});
