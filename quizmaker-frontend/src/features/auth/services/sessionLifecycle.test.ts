import { describe, expect, it, vi } from 'vitest';
import { AuthSessionLifecycle, SessionChangedError } from './sessionLifecycle';

const createCredentials = (accessToken: string | null, refreshToken: string | null) => {
  let access = accessToken;
  let refresh = refreshToken;

  return {
    clearTokens: vi.fn(() => {
      access = null;
      refresh = null;
    }),
    getAccessToken: vi.fn(() => access),
    getRefreshToken: vi.fn(() => refresh),
    setTokens: vi.fn((nextAccess: string, nextRefresh: string) => {
      access = nextAccess;
      refresh = nextRefresh;
    }),
  };
};

describe('AuthSessionLifecycle', () => {
  it('invalidates old requests before replacing credentials', () => {
    const credentials = createCredentials('access-a', 'refresh-a');
    const lifecycle = new AuthSessionLifecycle(credentials);
    const oldRequest = new AbortController();
    const listener = vi.fn();

    lifecycle.subscribe(listener);
    lifecycle.registerRequest(lifecycle.getGeneration(), oldRequest);
    const transition = lifecycle.establishSession('access-b', 'refresh-b', 'account-switch');

    expect(transition.generation).toBe(1);
    expect(oldRequest.signal.aborted).toBe(true);
    expect(credentials.setTokens).toHaveBeenCalledWith('access-b', 'refresh-b');
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      origin: 'local',
      reason: 'account-switch',
      status: 'authenticated',
    }));
    expect(() => lifecycle.rotateTokens(0, 'late-access-a', 'late-refresh-a'))
      .toThrow(SessionChangedError);
    expect(credentials.getAccessToken()).toBe('access-b');
  });

  it('emits one anonymous boundary for repeated terminal logout attempts', () => {
    const credentials = createCredentials('access-a', null);
    const lifecycle = new AuthSessionLifecycle(credentials);
    const listener = vi.fn();

    lifecycle.subscribe(listener);

    expect(lifecycle.terminateSession('forced-logout')).not.toBeNull();
    expect(lifecycle.terminateSession('forced-logout')).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(credentials.clearTokens).toHaveBeenCalledTimes(1);
  });

  it('applies and deduplicates a credential-free remote-tab logout', () => {
    const credentials = createCredentials('access-a', 'refresh-a');
    const lifecycle = new AuthSessionLifecycle(credentials);
    const oldRequest = new AbortController();
    const listener = vi.fn();
    const message = {
      id: 'remote-transition-1',
      reason: 'logout',
      sourceId: 'another-tab',
      status: 'anonymous',
      version: 1,
    } as const;

    lifecycle.subscribe(listener);
    lifecycle.registerRequest(0, oldRequest);
    lifecycle.receiveExternalTransition(message);
    lifecycle.receiveExternalTransition(message);

    expect(lifecycle.getGeneration()).toBe(1);
    expect(oldRequest.signal.aborted).toBe(true);
    expect(credentials.clearTokens).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      origin: 'remote',
      status: 'anonymous',
    }));
  });

  it('keeps local transitions working when storage-based publication fails', () => {
    const credentials = createCredentials(null, null);
    const lifecycle = new AuthSessionLifecycle(credentials);
    const storageFailure = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('Storage unavailable', 'SecurityError');
      });

    lifecycle.subscribe(vi.fn());

    expect(() => lifecycle.establishSession('access-a', 'refresh-a')).not.toThrow();
    expect(lifecycle.getStatus()).toBe('authenticated');
    storageFailure.mockRestore();
  });
});
