import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen } from '@/test/render';
import Sidebar from './Sidebar';

const authMocks = vi.hoisted(() => ({
  logout: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  useAuth: authMocks.useAuth,
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024, writable: true });
    authMocks.useAuth.mockReturnValue({
      isLoggedIn: true,
      logout: authMocks.logout,
      user: {
        username: 'architect',
        email: 'architect@example.com',
        roles: ['ROLE_USER'],
      },
    });
  });

  it('filters role-protected links while supporting search, expansion, and collapse', async () => {
    const { user } = renderWithProviders(
      <Sidebar isOpen onToggle={vi.fn()} onClose={vi.fn()} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('architect')).toBeInTheDocument();
    expect(screen.queryByText('Question Management')).not.toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Search...'), 'quiz');
    expect(screen.getByPlaceholderText('Search...')).toHaveValue('quiz');

    await user.click(screen.getByRole('button', { name: 'Quiz Management' }));
    expect(screen.getByRole('link', { name: 'Create Quiz' })).toHaveAttribute('href', '/quizzes/create');

    await user.click(screen.getByTitle('Collapse sidebar'));
    expect(screen.getByTitle('Expand sidebar')).toBeInTheDocument();
  });

  it('closes an open sidebar when a user clicks outside it', () => {
    const onClose = vi.fn();
    renderWithProviders(<Sidebar isOpen onToggle={vi.fn()} onClose={onClose} />, {
      withAuthProvider: false,
    });

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
