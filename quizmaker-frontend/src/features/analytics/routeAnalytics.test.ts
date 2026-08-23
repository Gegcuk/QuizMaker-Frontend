import { describe, expect, it } from 'vitest';
import { getAnalyticsRoute } from './routeAnalytics';

describe('getAnalyticsRoute', () => {
  it.each([
    ['/', '/', 'home'],
    ['/quizzes/create', '/quizzes/create', 'app'],
    ['/quizzes/quiz-id-canary/attempt?ignored=true', null, null],
    ['/quizzes/quiz-id-canary/attempt', '/quizzes/:quizId/attempt', 'app'],
    ['/documents/document-id-canary/', '/documents/:documentId', 'app'],
    ['/blog/article-slug-canary', '/blog/:slug', 'blog'],
    ['/privacy/', '/privacy', 'legal'],
  ])('classifies %s without exposing identifiers', (pathname, template, contentGroup) => {
    const result = getAnalyticsRoute(pathname);

    expect(result?.template ?? null).toBe(template);
    expect(result?.contentGroup ?? null).toBe(contentGroup);
    expect(JSON.stringify(result)).not.toContain('canary');
  });

  it.each([
    '/does-not-exist/private-canary',
    '/reset-password-extra',
    '/quizzes/one/two/three/private-canary',
    '/blog/private-canary/comments',
  ])('fails closed for an unknown route: %s', (pathname) => {
    expect(getAnalyticsRoute(pathname)).toBeNull();
  });
});
