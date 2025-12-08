// src/main.tsx (minimal example – adjust if you already have code here)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import AppRoutes from './routes/AppRoutes';
import { ToastProvider } from './components/ui';
import { AuthProvider } from './features/auth';
import { QueryProvider } from './providers/QueryProvider';
import { FeatureFlagProvider } from './utils';
import { ThemeProvider } from './context/ThemeContext';
import { AnalyticsProvider } from './features/analytics';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AnalyticsProvider>
      <ThemeProvider>
        <FeatureFlagProvider>
          <QueryProvider>
            <AuthProvider>
              <ToastProvider>
                <AppRoutes />
              </ToastProvider>
            </AuthProvider>
          </QueryProvider>
        </FeatureFlagProvider>
      </ThemeProvider>
    </AnalyticsProvider>
  </BrowserRouter>
);
