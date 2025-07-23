// src/components/ProtectedRoute.tsx
// ---------------------------------------------------------------------------
// A tiny wrapper around React-Router’s <Navigate> that checks our AuthContext.
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
// ---------------------------------------------------------------------------

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Expected prop shape for ProtectedRoute */
export type ProtectedRouteProps = {
  /** The element tree that should only render when logged in */
  children: React.ReactElement;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn } = useAuth();

  // If the user is *not* logged in, redirect to the login page.
  if (!isLoggedIn) {
    /* `replace` prevents the protected URL from sticking around in history,
       so hitting “Back” after logging in won’t send the user back here. */
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the protected children as-is.
  return children;
};

export default ProtectedRoute;
