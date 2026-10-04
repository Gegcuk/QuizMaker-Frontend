import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { articleService } from './articleService';
import type { ArticleUpsertPayload } from '../types';

const payload: ArticleUpsertPayload = {
  slug: 'recall', title: 'Recall practice', description: 'Practise remembering.', excerpt: 'Daily recall.',
  tags: ['learning'], author: { name: 'Editor', title: 'Teacher' }, readingTime: '3 min',
  publishedAt: '2026-01-01T00:00:00Z', status: 'PUBLISHED',
  canonicalUrl: 'https://www.quizzence.com/blog/recall/',
  ogImage: 'https://images.example.test/explicit.png',
};

describe('article authoring compatibility', () => {
  it.each(['create', 'update'] as const)('%s sends only authored hero fields even when editing a full response', async operation => {
    let body: unknown;
    server.use(http[operation === 'create' ? 'post' : 'put'](
      `http://localhost:3000/api/v1/articles${operation === 'create' ? '' : '/article-123'}`,
      async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...payload, id: 'article-123' });
      },
    ));
    const heroImage = {
      assetId: 'hero-123', alt: 'Authored alt', caption: 'Authored caption',
      rendition: { url: 'https://images.example.test/hero.png', width: 1200, height: 630, mimeType: 'image/png' },
    };
    const draft = { ...payload, heroImage };
    if (operation === 'create') await articleService.create(draft);
    else await articleService.update('article-123', draft);
    expect(body).toEqual({ ...payload, heroImage: { assetId: 'hero-123', alt: 'Authored alt', caption: 'Authored caption' } });
    expect(draft.heroImage.rendition.url).toBe('https://images.example.test/hero.png');
  });

  it.each([undefined, null])('preserves an absent or removed hero (%s) without persisting the display fallback', async heroImage => {
    let body: unknown;
    server.use(http.put('http://localhost:3000/api/v1/articles/article-123', async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ ...payload, id: 'article-123' });
    }));
    await articleService.update('article-123', { ...payload, heroImage });
    expect(body).toEqual({ ...payload, ...(heroImage === null ? { heroImage: null } : {}) });
  });
});
