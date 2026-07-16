import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import UserStats from './UserStats';

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  useAuth: authMocks.useAuth,
}));

describe('UserStats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    authMocks.useAuth.mockReturnValue({ user: { id: 'user-1', username: 'learner' } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the current statistics and achievement progress', async () => {
    renderWithProviders(<UserStats />, { withAuthProvider: false });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(screen.getByRole('heading', { name: 'My Statistics' })).toBeInTheDocument();
    expect(screen.getByText('78.5%')).toBeInTheDocument();
    expect(screen.getByText('20h 40m')).toBeInTheDocument();
    expect(screen.getByText('Quiz Master')).toBeInTheDocument();
    expect(screen.getByText('38/50')).toBeInTheDocument();
  });

  it('keeps the loading state when no authenticated user is present', () => {
    authMocks.useAuth.mockReturnValue({ user: null });

    const { container } = renderWithProviders(<UserStats />, { withAuthProvider: false });

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
