import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/ui';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/features/auth';
import { FeatureFlagProvider, setTokens, clearTokens } from '@/utils';

interface AppRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  queryClient?: QueryClient;
  withAuthProvider?: boolean;
}

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

export const setTestAuthTokens = (
  accessToken = 'test-access-token',
  refreshToken = 'test-refresh-token',
) => {
  setTokens(accessToken, refreshToken);
};

export const clearTestAuthTokens = () => {
  clearTokens();
};

export const renderWithProviders = (
  ui: React.ReactElement,
  {
    route = '/',
    queryClient = createTestQueryClient(),
    withAuthProvider = true,
    ...renderOptions
  }: AppRenderOptions = {},
) => {
  const Providers = ({ children }: { children: React.ReactNode }) => {
    const content = withAuthProvider ? (
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    ) : (
      <ToastProvider>{children}</ToastProvider>
    );

    return (
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider defaultTheme="light" defaultColorScheme="light">
          <FeatureFlagProvider>
            <QueryClientProvider client={queryClient}>
              {content}
            </QueryClientProvider>
          </FeatureFlagProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  return {
    user: userEvent.setup(),
    queryClient,
    ...render(ui, { wrapper: Providers, ...renderOptions }),
  };
};

export * from '@testing-library/react';
export { userEvent };
