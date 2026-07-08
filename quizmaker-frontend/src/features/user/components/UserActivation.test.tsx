import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { UserDto } from '@/types';
import UserActivationManager, { BulkUserActivation, UserActivation } from './UserActivation';

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  AuthProvider: ({ children }: { children: unknown }) => children,
  useAuth: authMocks.useAuth,
}));

const unavailableMessage =
  'User activation controls are unavailable because the deployed API does not expose activation endpoints.';

const user = (overrides: Partial<UserDto> = {}): UserDto => ({
  id: 'user-1',
  username: 'architect',
  email: 'architect@example.com',
  isActive: true,
  roles: ['ROLE_USER'],
  createdAt: '2026-07-08T09:00:00Z',
  updatedAt: '2026-07-08T09:00:00Z',
  ...overrides,
});

const authUser = (roles: string[]) => ({
  id: 'admin-1',
  username: 'admin',
  email: 'admin@example.com',
  isActive: true,
  roles,
  createdAt: '2026-07-08T09:00:00Z',
  lastLoginDate: null,
  updatedAt: '2026-07-08T09:00:00Z',
});

describe('UserActivation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows disabled unavailable controls for admins instead of calling unsupported endpoints', async () => {
    authMocks.useAuth.mockReturnValue({ user: authUser(['ROLE_ADMIN']) });
    const onActivationChange = vi.fn();
    const onError = vi.fn();
    const { user: eventUser } = renderWithProviders(
      <UserActivation
        userId="user-1"
        user={user()}
        onActivationChange={onActivationChange}
        onError={onError}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText(unavailableMessage)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Deactivate unavailable' });
    expect(button).toBeDisabled();

    await eventUser.click(button);

    expect(onActivationChange).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('keeps activation controls hidden from users without admin roles', () => {
    authMocks.useAuth.mockReturnValue({ user: authUser(['ROLE_USER']) });

    renderWithProviders(
      <UserActivation userId="user-1" user={user()} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Insufficient permissions')).toBeInTheDocument();
    expect(screen.queryByText(unavailableMessage)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /unavailable/i })).not.toBeInTheDocument();
  });
});

describe('BulkUserActivation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables bulk activation actions when the deployed API has no bulk activation endpoints', async () => {
    authMocks.useAuth.mockReturnValue({ user: authUser(['ROLE_SUPER_ADMIN']) });
    const onActivationChange = vi.fn();
    const onError = vi.fn();
    const { user: eventUser } = renderWithProviders(
      <BulkUserActivation
        userIds={['user-1', 'user-2']}
        onActivationChange={onActivationChange}
        onError={onError}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('2 users selected')).toBeInTheDocument();
    expect(screen.getByText(unavailableMessage)).toBeInTheDocument();
    const activateButton = screen.getByRole('button', { name: 'Activate All unavailable' });
    const deactivateButton = screen.getByRole('button', { name: 'Deactivate All unavailable' });
    expect(activateButton).toBeDisabled();
    expect(deactivateButton).toBeDisabled();

    await eventUser.click(activateButton);
    await eventUser.click(deactivateButton);

    expect(onActivationChange).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});

describe('UserActivationManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders selectable users while leaving activation unavailable until the API supports it', async () => {
    authMocks.useAuth.mockReturnValue({ user: authUser(['ROLE_ADMIN']) });
    const onSelectionChange = vi.fn();
    const onActivationChange = vi.fn();
    const { user: eventUser } = renderWithProviders(
      <UserActivationManager
        users={[
          user(),
          user({ id: 'user-2', username: 'reviewer', isActive: false }),
        ]}
        selectedUserIds={[]}
        onSelectionChange={onSelectionChange}
        onActivationChange={onActivationChange}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('architect')).toBeInTheDocument();
    expect(screen.getByText('reviewer')).toBeInTheDocument();
    expect(screen.getAllByText(unavailableMessage)).toHaveLength(3);

    await eventUser.click(screen.getByLabelText('Select All (2 users)'));

    expect(onSelectionChange).toHaveBeenCalledWith(['user-1', 'user-2']);
    expect(onActivationChange).not.toHaveBeenCalled();
  });
});
