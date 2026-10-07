// src/main.tsx (minimal example – adjust if you already have code here)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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
import './index.css';

const router = createBrowserRouter([{
  path: '*',
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

ReactDOM.createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
