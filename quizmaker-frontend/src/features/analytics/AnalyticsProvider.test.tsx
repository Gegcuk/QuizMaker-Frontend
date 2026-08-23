import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNavigate } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import AnalyticsProvider from './AnalyticsProvider';

const analyticsMocks = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
}));

vi.mock('./ga4', () => analyticsMocks);

const NavigationProbe = () => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/quizzes/quiz-id-canary/attempt?attemptId=attempt-canary#hash-canary')}
    >
      Navigate
    </button>
  );
};

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

  it('drops arbitrary query parameters from an ordinary page view', async () => {
    renderWithProviders(
      <AnalyticsProvider><div>Quiz list</div></AnalyticsProvider>,
      { route: '/quizzes?page=2&search=private-canary', withAuthProvider: false },
    );

    await waitFor(() => {
      expect(analyticsMocks.trackPageView).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/quizzes' }),
      );
    });
    expect(JSON.stringify(analyticsMocks.trackPageView.mock.calls)).not.toContain('canary');
  });

  it('uses a fixed template for dynamic routes during SPA navigation', async () => {
    const { user } = renderWithProviders(
      <AnalyticsProvider><NavigationProbe /></AnalyticsProvider>,
      { route: '/', withAuthProvider: false },
    );

    await waitFor(() => expect(analyticsMocks.trackPageView).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'Navigate' }));

    await waitFor(() => expect(analyticsMocks.trackPageView).toHaveBeenCalledTimes(2));
    expect(analyticsMocks.trackPageView).toHaveBeenLastCalledWith({
      path: '/quizzes/:quizId/attempt',
      title: 'Quiz attempt',
      contentGroup: 'app',
    });
    expect(JSON.stringify(analyticsMocks.trackPageView.mock.calls)).not.toContain('canary');
  });

  it('does not track an unknown route that may contain sensitive identifiers', () => {
    renderWithProviders(
      <AnalyticsProvider><div>Unknown</div></AnalyticsProvider>,
      { route: '/unknown/private-canary?token=query-canary#hash-canary', withAuthProvider: false },
    );

    expect(analyticsMocks.trackPageView).not.toHaveBeenCalled();
    expect(analyticsMocks.trackEvent).not.toHaveBeenCalled();
  });
});
