import assert from 'node:assert/strict';
import { test } from 'node:test';
import { staticPrerenderRoutes } from '../../src/routes/publicRouteManifest.mjs';
import { validateSitemapPolicy } from '../../scripts/verify-public-route-delivery.mjs';

const staticPaths = staticPrerenderRoutes.map((route) => route.path);
const articlePath = '/blog/retrieval-practice/';

test('split sitemap policy keeps articles out of the static sitemap', () => {
  assert.throws(
    () => validateSitemapPolicy({
      staticSitemapPaths: [...staticPaths, articlePath],
      articleSitemapPaths: [articlePath],
    }),
    /static sitemap\.xml to omit article route/,
  );
});

test('frontend-owned sitemaps reject noindex routes and backend-owned sitemaps report them', () => {
  const sitemapWithNoindexRoute = [...staticPaths, '/theme-demo/'];

  assert.throws(
    () => validateSitemapPolicy({
      staticSitemapPaths: sitemapWithNoindexRoute,
      articleSitemapPaths: [articlePath],
    }),
    /frontend-owned sitemaps to omit noindex routes/,
  );

  assert.deepEqual(
    validateSitemapPolicy({
      staticSitemapPaths: sitemapWithNoindexRoute,
      articleSitemapPaths: [articlePath],
      sitemapOwner: 'backend',
    }),
    { backendOwnedNoindexPaths: ['/theme-demo/'] },
  );
});
