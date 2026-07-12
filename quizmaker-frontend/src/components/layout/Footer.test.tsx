import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import Footer from './Footer';

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  useAuth: authMocks.useAuth,
}));

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes guests to the public home page and exposes landmark links', () => {
    authMocks.useAuth.mockReturnValue({ isLoggedIn: false });

    renderWithProviders(<Footer />, { withAuthProvider: false });

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/Gegcuk/',
    );
    expect(screen.getByRole('navigation', { name: 'Legal' })).toBeInTheDocument();
  });

  it('routes authenticated users to their quiz dashboard', () => {
    authMocks.useAuth.mockReturnValue({ isLoggedIn: true });

    renderWithProviders(<Footer />, { withAuthProvider: false });

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/quizzes');
  });
});
