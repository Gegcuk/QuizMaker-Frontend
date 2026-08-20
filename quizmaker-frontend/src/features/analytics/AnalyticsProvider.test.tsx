import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, waitFor } from '@/test/render';
import AnalyticsProvider from './AnalyticsProvider';

const analyticsMocks = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
}));

vi.mock('./ga4', () => analyticsMocks);

describe('AnalyticsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['/oauth2/redirect', '/oauth/callback'])(
    'omits the callback query from analytics for %s',
    async (callbackPath) => {
      renderWithProviders(
        <AnalyticsProvider><div>Callback</div></AnalyticsProvider>,
        {
          route: `${callbackPath}?code=code-canary&error_description=secret-canary`,
          withAuthProvider: false,
        },
      );

      await waitFor(() => {
        expect(analyticsMocks.trackPageView).toHaveBeenCalledWith(
          expect.objectContaining({ path: callbackPath }),
        );
      });
      expect(JSON.stringify(analyticsMocks.trackPageView.mock.calls)).not.toContain('canary');
    },
  );

  it('retains query parameters for an ordinary page view', async () => {
    renderWithProviders(
      <AnalyticsProvider><div>Quiz list</div></AnalyticsProvider>,
      { route: '/quizzes?page=2', withAuthProvider: false },
    );

    await waitFor(() => {
      expect(analyticsMocks.trackPageView).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/quizzes?page=2' }),
      );
    });
  });
});
