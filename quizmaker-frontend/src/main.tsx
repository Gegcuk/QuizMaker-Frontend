import { diagnostics } from './features/diagnostics/reporter';
import { startDiagnostics } from './features/diagnostics/lifecycle';
// src/main.tsx (minimal example – adjust if you already have code here)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import RouteFailure from './routes/RouteFailure';
import { UnsavedChangesProvider } from './features/navigation/UnsavedChangesProvider';

import AppRoutes from './routes/AppRoutes';
import { ToastProvider } from './components/ui';
import { AuthProvider } from './features/auth';
import { QueryProvider } from './providers/QueryProvider';
import { FeatureFlagProvider } from './utils';
import { ThemeProvider } from './context/ThemeContext';
import { AnalyticsProvider } from './features/analytics';
import { SensitiveUrlBoundary } from './features/privacy';
import { CheckoutRecoveryLifecycle } from './features/billing/components/CheckoutRecoveryLifecycle';

const router = createBrowserRouter([{
  path: '*',
  errorElement: <ErrorBoundary><RouteFailure /></ErrorBoundary>,
  element: (
    <SensitiveUrlBoundary>
      <AnalyticsProvider>
        <ThemeProvider>
          <FeatureFlagProvider>
            <QueryProvider>
              <AuthProvider>
                <CheckoutRecoveryLifecycle />
                <ToastProvider>
                  <UnsavedChangesProvider>
                    <AppRoutes />
                  </UnsavedChangesProvider>
                </ToastProvider>
              </AuthProvider>
            </QueryProvider>
          </FeatureFlagProvider>
        </ThemeProvider>
      </AnalyticsProvider>
    </SensitiveUrlBoundary>
  ),
}]);

const stopDiagnostics = startDiagnostics();
import.meta.hot?.dispose(stopDiagnostics);

ReactDOM.createRoot(document.getElementById('root')!, {
  onCaughtError: (error) => { diagnostics.report(error, 'render'); },
  onUncaughtError: (error) => { diagnostics.report(error, 'render'); },
}).render(<RouterProvider router={router} onError={(error) => { diagnostics.report(error, 'render'); }} />);
