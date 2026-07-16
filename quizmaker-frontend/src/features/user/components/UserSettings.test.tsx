import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen } from '@/test/render';
import UserSettings from './UserSettings';

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  ChangePasswordForm: () => <div>Change password form</div>,
  useAuth: authMocks.useAuth,
}));

describe('UserSettings', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    authMocks.useAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders settings after loading and completes the current save flow', async () => {
    const onSave = vi.fn();
    renderWithProviders(<UserSettings onSave={onSave} />, { withAuthProvider: false });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Change password form')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(onSave).toHaveBeenCalledOnce();
  });

  it('retains the loading state without an authenticated user', () => {
    authMocks.useAuth.mockReturnValue({ user: null });

    const { container } = renderWithProviders(<UserSettings />, { withAuthProvider: false });

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
