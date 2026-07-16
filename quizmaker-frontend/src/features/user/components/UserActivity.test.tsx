import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen } from '@/test/render';
import UserActivity from './UserActivity';

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  useAuth: authMocks.useAuth,
}));

describe('UserActivity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-16T12:00:00Z'));
    authMocks.useAuth.mockReturnValue({ user: { id: 'user-1', username: 'learner' } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the current activity feed and filters it by search text', async () => {
    renderWithProviders(<UserActivity />, { withAuthProvider: false });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(screen.getByRole('heading', { name: 'My Activity' })).toBeInTheDocument();
    expect(screen.getByText('You completed "JavaScript Fundamentals"')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search activities...'), {
      target: { value: 'TypeScript Basics' },
    });

    expect(screen.getByText('You shared "TypeScript Basics" with your team')).toBeInTheDocument();
    expect(screen.queryByText('You completed "JavaScript Fundamentals"')).not.toBeInTheDocument();
  });

  it('does not fabricate activity for an unauthenticated visitor', () => {
    authMocks.useAuth.mockReturnValue({ user: null });

    const { container } = renderWithProviders(<UserActivity />, { withAuthProvider: false });

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
