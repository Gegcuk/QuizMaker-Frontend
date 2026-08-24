import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  getAlternatePublicRoutePath,
  publicRouteManifest,
} from '../src/routes/publicRouteManifest.mjs';

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const request = (baseUrl, routePath, method = 'GET') =>
  fetch(new URL(routePath, `${baseUrl}/`), {
    method,
    redirect: 'manual',
    headers: { accept: method === 'HEAD' ? '*/*' : 'text/html,application/xml' },
    signal: AbortSignal.timeout(30_000),
  });

const assertStatus = async (baseUrl, routePath, expectedStatus, method = 'GET') => {
  const configuredAttempts = Number.parseInt(process.env.PUBLIC_ROUTE_RETRY_ATTEMPTS ?? '1', 10);
  const attempts = Number.isFinite(configuredAttempts) && configuredAttempts > 0
    ? configuredAttempts
    : 1;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await request(baseUrl, routePath, method);
      if (response.status === expectedStatus) {
        return response;
      }
      lastError = new Error(
        `Expected ${method} ${routePath} to return ${expectedStatus}, got ${response.status}`,
      );
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) {
      await delay(2_000);
    }
  }

  assert.fail(lastError?.message ?? `${method} ${routePath} failed without a response`);
};

const assertIndexableHtml = async ({ baseUrl, canonicalOrigin, routePath }) => {
  const response = await assertStatus(baseUrl, routePath, 200);
  assert.match(response.headers.get('content-type') ?? '', /^text\/html/i);
  const document = new JSDOM(await response.text()).window.document;
  const title = document.title.trim();
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim();
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim();
  const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
  const headings = [...document.querySelectorAll('h1')]
    .map((heading) => heading.textContent?.trim() ?? '')
    .filter(Boolean);

  assert.ok(title, `Expected ${routePath} to contain a title without running JavaScript`);
  assert.ok(description, `Expected ${routePath} to contain a description without running JavaScript`);
  assert.equal(canonical, `${canonicalOrigin}${routePath}`, `Expected ${routePath} to be self-canonical`);
  assert.doesNotMatch(robots, /noindex/i, `Expected ${routePath} to be indexable`);
  assert.equal(headings.length, 1, `Expected ${routePath} to contain exactly one meaningful H1`);

  await assertStatus(baseUrl, routePath, 200, 'HEAD');
};

const assertCanonicalRedirect = async ({ baseUrl, aliasPath, canonicalPath }) => {
  for (const method of ['GET', 'HEAD']) {
    const response = await assertStatus(baseUrl, aliasPath, 301, method);
    const location = response.headers.get('location');
    assert.ok(location, `Expected ${method} ${aliasPath} to include a redirect location`);
    assert.equal(new URL(location, baseUrl).pathname, canonicalPath);
  }
};

const readSitemapPaths = async (baseUrl, sitemapPath) => {
  const response = await assertStatus(baseUrl, sitemapPath, 200);
  assert.match(response.headers.get('content-type') ?? '', /xml/i);
  const xml = await response.text();
  await assertStatus(baseUrl, sitemapPath, 200, 'HEAD');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
};

export const verifyPublicRouteDelivery = async ({
  baseUrl,
  canonicalOrigin = 'https://www.quizzence.com',
  requireArticles = false,
}) => {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const normalizedCanonicalOrigin = canonicalOrigin.replace(/\/$/, '');
  const mainSitemapPaths = new Set(await readSitemapPaths(normalizedBaseUrl, '/sitemap.xml'));
  const articlePaths = await readSitemapPaths(normalizedBaseUrl, '/sitemap_articles.xml');

  if (requireArticles) {
    assert.ok(articlePaths.length > 0, 'Expected the production article sitemap to contain an article URL');
  }

  for (const route of publicRouteManifest) {
    if (route.delivery === 'prerender') {
      assert.ok(mainSitemapPaths.has(route.path), `Expected sitemap.xml to include ${route.path}`);
      await assertIndexableHtml({
        baseUrl: normalizedBaseUrl,
        canonicalOrigin: normalizedCanonicalOrigin,
        routePath: route.path,
      });
      const aliasPath = getAlternatePublicRoutePath(route);
      if (aliasPath) {
        await assertCanonicalRedirect({
          baseUrl: normalizedBaseUrl,
          aliasPath,
          canonicalPath: route.path,
        });
      }
      continue;
    }

    if (route.delivery === 'spa' || route.delivery === 'callback') {
      for (const routePath of [route.path, getAlternatePublicRoutePath(route)].filter(Boolean)) {
        const response = await assertStatus(normalizedBaseUrl, routePath, 200);
        assert.match(response.headers.get('x-robots-tag') ?? '', /noindex, nofollow/i);
        assert.match(response.headers.get('content-type') ?? '', /^text\/html/i);
        await assertStatus(normalizedBaseUrl, routePath, 200, 'HEAD');

        if (route.delivery === 'callback') {
          assert.match(response.headers.get('cache-control') ?? '', /no-store/i);
          assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
        }
      }
      assert.ok(!mainSitemapPaths.has(route.path), `Expected sitemap.xml to omit ${route.path}`);
    }
  }

  for (const articlePath of articlePaths) {
    assert.ok(mainSitemapPaths.has(articlePath), `Expected sitemap.xml to include ${articlePath}`);
    await assertIndexableHtml({
      baseUrl: normalizedBaseUrl,
      canonicalOrigin: normalizedCanonicalOrigin,
      routePath: articlePath,
    });
    await assertCanonicalRedirect({
      baseUrl: normalizedBaseUrl,
      aliasPath: articlePath.replace(/\/$/, ''),
      canonicalPath: articlePath,
    });
  }

  const unknownPage = await assertStatus(normalizedBaseUrl, '/this-route-should-not-exist', 404);
  assert.match(unknownPage.headers.get('x-robots-tag') ?? '', /noindex/i);
  assert.match(unknownPage.headers.get('content-type') ?? '', /^text\/html/i);
  const unknownDocument = new JSDOM(await unknownPage.text()).window.document;
  assert.equal(unknownDocument.title.trim(), 'Page Not Found | Quizzence');
  assert.equal(unknownDocument.querySelector('h1')?.textContent?.trim(), 'Page Not Found');
  assert.match(
    unknownDocument.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
    /noindex/i,
  );

  const missingAsset = await assertStatus(normalizedBaseUrl, '/assets/this-asset-does-not-exist.js', 404);
  assert.doesNotMatch(await missingAsset.text(), /<div id="root"><\/div>/);

  return {
    staticRouteCount: publicRouteManifest.filter((route) => route.delivery === 'prerender').length,
    articleRouteCount: articlePaths.length,
  };
};

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const baseUrl = process.env.PUBLIC_ROUTE_BASE_URL;
  if (!baseUrl) {
    throw new Error('PUBLIC_ROUTE_BASE_URL is required.');
  }

  const result = await verifyPublicRouteDelivery({
    baseUrl,
    canonicalOrigin: process.env.PUBLIC_ROUTE_CANONICAL_ORIGIN,
    requireArticles: process.env.REQUIRE_ARTICLE_ROUTES === 'true',
  });
  console.log(
    `Verified public delivery for ${result.staticRouteCount} static routes and ${result.articleRouteCount} article routes.`,
  );
}
