import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSitemapDocuments } from '../../scripts/generate-sitemap.mjs';

test('static and article routes are written to separate sitemap documents', () => {
  const { staticSitemap, articleSitemap } = buildSitemapDocuments({
    siteUrl: 'https://www.quizzence.com/',
    staticRoutes: [{ path: '/faq/', priority: '0.5' }],
    articleRoutes: [{ path: '/blog/retrieval-practice/', priority: '0.8' }],
  });

  assert.match(staticSitemap, /<loc>https:\/\/www\.quizzence\.com\/faq\/<\/loc>/);
  assert.doesNotMatch(staticSitemap, /retrieval-practice/);
  assert.match(articleSitemap, /<loc>https:\/\/www\.quizzence\.com\/blog\/retrieval-practice\/<\/loc>/);
  assert.doesNotMatch(articleSitemap, /\/faq\//);
});
