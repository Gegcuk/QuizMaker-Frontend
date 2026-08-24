import React, { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { subscribeToSessionTransitions } from '@/features/auth/services/sessionLifecycle';

export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const [queryClient, setQueryClient] = useState(createQueryClient);
  const clientRef = useRef(queryClient);

  useEffect(() => subscribeToSessionTransitions(() => {
    const previousClient = clientRef.current;
    void previousClient.cancelQueries();
    previousClient.clear();

    const nextClient = createQueryClient();
    clientRef.current = nextClient;
    setQueryClient(nextClient);
  }), []);

  useEffect(() => () => {
    const currentClient = clientRef.current;
    void currentClient.cancelQueries();
    currentClient.clear();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
