import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { establishSession, terminateSession } from '@/features/auth/services/sessionLifecycle';
import { generationOperations, GENERATION_STORAGE_PREFIX } from '../services/generationOperations';
import { GenerationOperationBoundary } from './GenerationOperationBoundary';
const auth = vi.hoisted(() => ({ user: { id: 'account-a' } as { id: string } | null }));
vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: auth.user, isLoading: false }) }));
const accepted = { jobId: 'job-1', status: 'PENDING' as const, message: 'queued', estimatedTimeSeconds: 0 };

describe('pending generation session boundary', () => {
  it.each(['logout', 'account-switch'] as const)('removes account A recovery on %s even when no generation form is mounted', async reason => {
    auth.user = { id: 'account-a' };
    establishSession('a', 'refresh-a');
    render(<GenerationOperationBoundary><div>Another screen</div></GenerationOperationBoundary>);
    await generationOperations.start('account-a', 'wizard', 'text', async () => accepted);
    act(() => {
      if (reason === 'logout') terminateSession('logout');
      else establishSession('b', 'refresh-b', 'account-switch');
    });
    expect(generationOperations.getSnapshot().pending).toEqual({});
    expect(localStorage.getItem(`${GENERATION_STORAGE_PREFIX}account-a:wizard`)).toBeNull();
  });

  it('keeps logout authoritative if storage cleanup fails and removes stale keys before the next session starts', async () => {
    auth.user = { id: 'account-a' };
    establishSession('a', 'refresh-a');
    const view = render(<GenerationOperationBoundary><div /></GenerationOperationBoundary>);
    await generationOperations.start('account-a', 'wizard', 'text', async () => accepted);
    const remove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(key => {
      if (key.startsWith(GENERATION_STORAGE_PREFIX)) throw new DOMException('Unavailable');
    });
    act(() => terminateSession('logout'));
    expect(generationOperations.getSnapshot().pending).toEqual({});
    remove.mockRestore();
    auth.user = { id: 'account-a' };
    view.rerender(<GenerationOperationBoundary><div /></GenerationOperationBoundary>);
    // A new same-account login still establishes a credential-free cleanup boundary.
    act(() => establishSession('new-a', 'new-refresh-a'));
    generationOperations.activate('account-a');
    await waitFor(() => expect(localStorage.getItem(`${GENERATION_STORAGE_PREFIX}account-a:wizard`)).toBeNull());
  });
});
