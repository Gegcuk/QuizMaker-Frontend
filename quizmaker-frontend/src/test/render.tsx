import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { UnsavedChangesProvider } from '@/features/navigation/UnsavedChangesProvider';
import { ToastProvider } from '@/components/ui';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/features/auth';
import { FeatureFlagProvider, setTokens, clearTokens } from '@/utils';
import { SensitiveUrlBoundary } from '@/features/privacy';

interface AppRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  initialEntries?: string[];
  initialIndex?: number;
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

export const createQueryWrapper = (queryClient: QueryClient) => {
  const QueryWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  QueryWrapper.displayName = 'QueryWrapper';
  return QueryWrapper;
};

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
    initialEntries = [route],
    initialIndex,
    queryClient = createTestQueryClient(),
    withAuthProvider = true,
    ...renderOptions
  }: AppRenderOptions = {},
) => {
  const ContentContext = React.createContext<React.ReactNode>(null);
  const RouteContent = () => {
    const children = React.useContext(ContentContext);
    const content = withAuthProvider ? (
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    ) : (
      <ToastProvider>{children}</ToastProvider>
    );

    return (
      <SensitiveUrlBoundary>
        <UnsavedChangesProvider>
          <ThemeProvider defaultTheme="light" defaultColorScheme="light">
            <FeatureFlagProvider>
              <QueryClientProvider client={queryClient}>
                {content}
              </QueryClientProvider>
            </FeatureFlagProvider>
          </ThemeProvider>
        </UnsavedChangesProvider>
      </SensitiveUrlBoundary>
    );
  };

  const router = createMemoryRouter([{ path: '*', element: <RouteContent /> }], { initialEntries, initialIndex });
  const Providers = ({ children }: { children: React.ReactNode }) => (
    <ContentContext.Provider value={children}>
      <RouterProvider router={router} />
    </ContentContext.Provider>
  );
  return {
    router,
    user: userEvent.setup(),
    queryClient,
    ...render(ui, { wrapper: Providers, ...renderOptions }),
  };
};

export * from '@testing-library/react';
export { userEvent };
