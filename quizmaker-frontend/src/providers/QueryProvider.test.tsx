import { act, render, waitFor } from '@testing-library/react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { establishSession } from '@/features/auth/services/sessionLifecycle';
import { QueryProvider } from './QueryProvider';

describe('QueryProvider session boundary', () => {
  it('removes the previous principal cache and supplies a new client', async () => {
    const observedClients: QueryClient[] = [];

    const Probe = () => {
      const queryClient = useQueryClient();
      if (observedClients.at(-1) !== queryClient) {
        observedClients.push(queryClient);
      }
      return null;
    };

    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    );

    const firstClient = observedClients[0];
    firstClient.setQueryData(['private', 'attempts'], { owner: 'account-a' });
    firstClient.getMutationCache().build(firstClient, {
      mutationKey: ['private', 'update-profile'],
      mutationFn: async () => undefined,
    });

    act(() => {
      establishSession('access-b', 'refresh-b', 'account-switch');
    });

    await waitFor(() => expect(observedClients).toHaveLength(2));
    expect(observedClients[1]).not.toBe(firstClient);
    expect(firstClient.getQueryData(['private', 'attempts'])).toBeUndefined();
    expect(firstClient.getMutationCache().getAll()).toHaveLength(0);
    expect(observedClients[1].getQueryData(['private', 'attempts'])).toBeUndefined();
  });
});
