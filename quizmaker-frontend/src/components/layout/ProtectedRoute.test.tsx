import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen } from '@/test/render';
import ProtectedRoute from './ProtectedRoute';

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  useAuth: authMocks.useAuth,
}));

const renderProtectedRoute = (requiredRoles?: string[]) =>
  renderWithProviders(
    <Routes>
      <Route
        path="/private"
        element={
          <ProtectedRoute requiredRoles={requiredRoles}>
            <p>Protected content</p>
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<p>Login page</p>} />
      <Route path="/" element={<p>Home page</p>} />
    </Routes>,
    { route: '/private', withAuthProvider: false },
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state while authentication is being restored', () => {
    authMocks.useAuth.mockReturnValue({ isLoading: true, isLoggedIn: false, user: null });

    renderProtectedRoute();

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('redirects an unauthenticated user to login', () => {
    authMocks.useAuth.mockReturnValue({ isLoading: false, isLoggedIn: false, user: null });

    renderProtectedRoute();

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders authenticated content and prevents access without a required role', () => {
    authMocks.useAuth.mockReturnValue({
      isLoading: false,
      isLoggedIn: true,
      user: { roles: ['ROLE_USER'] },
    });

    const { rerender } = renderProtectedRoute();
    expect(screen.getByText('Protected content')).toBeInTheDocument();

    rerender(
      <Routes>
        <Route
          path="/private"
          element={
            <ProtectedRoute requiredRoles={['ROLE_ADMIN']}>
              <p>Protected content</p>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<p>Home page</p>} />
      </Routes>,
    );

    expect(screen.getByText('Home page')).toBeInTheDocument();
  });
});
