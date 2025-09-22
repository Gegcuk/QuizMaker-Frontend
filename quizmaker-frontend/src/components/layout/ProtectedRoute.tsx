// src/components/ProtectedRoute.tsx
// ---------------------------------------------------------------------------
// A tiny wrapper around React-Router's <Navigate> that checks our AuthContext.
// If the user is authenticated we simply render the protected children;
// otherwise we bounce them to /login.
//
// Usage example:
// <Route
//   path="/dashboard"
//   element={
//     <ProtectedRoute>
//       <DashboardPage />
//     </ProtectedRoute>
//   }
// />
//
// With role-based access:
// <Route
//   path="/admin"
//   element={
//     <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
//       <AdminPage />
//     </ProtectedRoute>
//   }
// />
// ---------------------------------------------------------------------------

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Spinner } from '@/components';
import { logger } from '@/utils';

/** Expected prop shape for ProtectedRoute */
export type ProtectedRouteProps = {
  /** The element tree that should only render when logged in */
  children: React.ReactElement;
  /** Optional: Required roles for access. If not provided, any authenticated user can access */
  requiredRoles?: string[];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { isLoggedIn, user, isLoading } = useAuth();

  logger.debug('ProtectedRoute render', 'ProtectedRoute', {
    isLoggedIn,
    hasUser: !!user,
    requiredRoles,
    isLoading
  });

  // Show loading while authentication state is being determined
  if (isLoading) {
    logger.debug('Authentication state loading', 'ProtectedRoute');
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Spinner size="lg" />
      </div>
    );
  }

  // If the user is *not* logged in, redirect to the login page.
  if (!isLoggedIn) {
    logger.info('User not authenticated, redirecting to login', 'ProtectedRoute');
    /* `replace` prevents the protected URL from sticking around in history,
       so hitting "Back" after logging in won't send the user back here. */
    return <Navigate to="/login" replace />;
  }

  // If required roles are specified, check if user has any of them
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = user?.roles?.some(role => requiredRoles.includes(role));
    logger.debug('Role check', 'ProtectedRoute', { hasRequiredRole, userRoles: user?.roles, requiredRoles });
    
    if (!hasRequiredRole) {
      logger.warn('User lacks required roles', 'ProtectedRoute', { 
        userRoles: user?.roles, 
        requiredRoles 
      });
      // Redirect to unauthorized page or home
      return <Navigate to="/" replace />;
    }
  }

  logger.debug('Rendering protected content', 'ProtectedRoute');
  // Otherwise, render the protected children as-is.
  return children;
};

export default ProtectedRoute;
