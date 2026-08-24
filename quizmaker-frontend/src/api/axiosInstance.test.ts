import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import api from './axiosInstance';
import {
  establishSession,
  getSessionGeneration,
  subscribeToSessionTransitions,
  terminateSession,
} from '@/features/auth/services/sessionLifecycle';
import { getAccessToken, getRefreshToken, setAccessToken } from '@/utils/tokenUtils';
import { server } from '@/test/msw/server';

const privateEndpoint = 'http://localhost:3000/api/v1/private/session-test';
const refreshEndpoint = 'http://localhost:3000/api/v1/auth/refresh';

describe('authenticated Axios session handling', () => {
  it('settles twenty simultaneous 401 responses through one refresh', async () => {
    let refreshCount = 0;
    establishSession('old-access', 'old-refresh');

    server.use(
      http.get(privateEndpoint, ({ request }) => {
        return request.headers.get('authorization') === 'Bearer new-access'
          ? HttpResponse.json({ ok: true })
          : new HttpResponse(null, { status: 401 });
      }),
      http.post(refreshEndpoint, async () => {
        refreshCount += 1;
        await delay(20);
        return HttpResponse.json({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        });
      }),
    );

    const responses = await Promise.all(
      Array.from({ length: 20 }, () => api.get('/v1/private/session-test')),
    );

    expect(responses.every(({ data }) => data.ok === true)).toBe(true);
    expect(refreshCount).toBe(1);
    expect(getAccessToken()).toBe('new-access');
    expect(getRefreshToken()).toBe('new-refresh');
  });

  it('does not replace cleared credentials when logout happens during refresh', async () => {
    let releaseRefresh: (() => void) | undefined;
    const refreshStarted = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    establishSession('old-access', 'old-refresh');

    server.use(
      http.get(privateEndpoint, () => new HttpResponse(null, { status: 401 })),
      http.post(refreshEndpoint, async () => {
        releaseRefresh?.();
        await delay(100);
        return HttpResponse.json({
          accessToken: 'late-access',
          refreshToken: 'late-refresh',
        });
      }),
    );

    const request = api.get('/v1/private/session-test');
    await refreshStarted;
    terminateSession('logout');

    await expect(request).rejects.toBeDefined();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('reconciles concurrent terminal 401 responses exactly once without a refresh token', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToSessionTransitions(listener);
    setAccessToken('expired-access');

    server.use(
      http.get(privateEndpoint, () => new HttpResponse(null, { status: 401 })),
    );

    const outcomes = await Promise.allSettled(
      Array.from({ length: 20 }, () => api.get('/v1/private/session-test')),
    );

    expect(outcomes.every(({ status }) => status === 'rejected')).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      reason: 'forced-logout',
      status: 'anonymous',
    }));
    expect(getSessionGeneration()).toBe(1);
    unsubscribe();
  });

  it('keeps the session recoverable when refresh is temporarily unavailable', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToSessionTransitions(listener);
    establishSession('old-access', 'old-refresh');
    listener.mockClear();

    server.use(
      http.get(privateEndpoint, () => new HttpResponse(null, { status: 401 })),
      http.post(refreshEndpoint, () => new HttpResponse(null, { status: 503 })),
    );

    await expect(api.get('/v1/private/session-test')).rejects.toMatchObject({
      response: { status: 503 },
    });
    expect(listener).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe('old-access');
    expect(getRefreshToken()).toBe('old-refresh');
    unsubscribe();
  });
});
