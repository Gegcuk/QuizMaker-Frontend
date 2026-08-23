import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackEvent, trackPageView } from './ga4';

describe('GA4 privacy boundary', () => {
  beforeEach(() => {
    window.gtag = vi.fn();
  });

  it('sets and emits only a template-based page context', () => {
    trackPageView({
      path: '/quizzes/:quizId/attempt',
      title: 'Quiz attempt',
      contentGroup: 'app',
    });

    const safeContext = {
      page_path: '/quizzes/:quizId/attempt',
      page_title: 'Quiz attempt',
      page_location: `${window.location.origin}/quizzes/:quizId/attempt`,
      page_referrer: '',
      content_group: 'app',
    };

    expect(window.gtag).toHaveBeenNthCalledWith(
      1,
      'config',
      expect.any(String),
      { send_page_view: false, ...safeContext },
    );
    expect(window.gtag).toHaveBeenNthCalledWith(2, 'event', 'page_view', safeContext);
  });

  it('accepts only bounded event dimensions', () => {
    const untrustedParams = {
      source: 'blog_article',
      value: Number.POSITIVE_INFINITY,
      privateValue: 'private-canary',
    } as unknown as Parameters<typeof trackEvent>[1];

    trackEvent('cta_try_sample_quiz', untrustedParams);

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'cta_try_sample_quiz',
      { source: 'blog_article' },
    );
    expect(JSON.stringify((window.gtag as ReturnType<typeof vi.fn>).mock.calls)).not.toContain('canary');
  });
});
