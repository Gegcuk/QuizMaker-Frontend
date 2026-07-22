import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadArticleSitemapRoutes } from '../../scripts/article-sitemap.mjs';

const articleEntries = [
  {
    url: 'https://www.quizzence.com/blog/retrieval-practice/',
    updatedAt: '2026-07-14T10:00:00Z',
    changefreq: 'weekly',
    priority: 0.8,
  },
];

test('article sitemap accepts the documented published article route shape', async () => {
  const routes = await loadArticleSitemapRoutes({
    apiBaseUrl: 'https://www.quizzence.com/api',
    fetchImpl: async () => new Response(JSON.stringify(articleEntries), { status: 200 }),
  });

  assert.deepEqual(routes, [
    {
      path: '/blog/retrieval-practice/',
      lastmod: '2026-07-14T10:00:00Z',
      changefreq: 'weekly',
      priority: '0.8',
    },
  ]);
});

test('article sitemap rejects unavailable, empty, and malformed route feeds', async (t) => {
  await t.test('unavailable feed', async () => {
    await assert.rejects(
      loadArticleSitemapRoutes({
        apiBaseUrl: 'https://www.quizzence.com/api',
        fetchImpl: async () => new Response('', { status: 503, statusText: 'Service Unavailable' }),
      }),
      /503 Service Unavailable/,
    );
  });

  await t.test('empty feed', async () => {
    await assert.rejects(
      loadArticleSitemapRoutes({
        apiBaseUrl: 'https://www.quizzence.com/api',
        fetchImpl: async () => new Response('[]', { status: 200 }),
      }),
      /is empty/,
    );
  });

  await t.test('non-article URL', async () => {
    await assert.rejects(
      loadArticleSitemapRoutes({
        apiBaseUrl: 'https://www.quizzence.com/api',
        fetchImpl: async () => new Response(JSON.stringify([{ url: 'https://www.quizzence.com/' }]), { status: 200 }),
      }),
      /not a blog article URL/,
    );
  });

  await t.test('URL query string', async () => {
    await assert.rejects(
      loadArticleSitemapRoutes({
        apiBaseUrl: 'https://www.quizzence.com/api',
        fetchImpl: async () =>
          new Response(
            JSON.stringify([{ ...articleEntries[0], url: 'https://www.quizzence.com/blog/retrieval-practice/?source=test' }]),
            { status: 200 },
          ),
      }),
      /clean HTTP\(S\) URL/,
    );
  });

  await t.test('invalid date metadata', async () => {
    await assert.rejects(
      loadArticleSitemapRoutes({
        apiBaseUrl: 'https://www.quizzence.com/api',
        fetchImpl: async () => new Response(JSON.stringify([{ ...articleEntries[0], updatedAt: 42 }]), { status: 200 }),
      }),
      /invalid updatedAt/,
    );
  });
});
