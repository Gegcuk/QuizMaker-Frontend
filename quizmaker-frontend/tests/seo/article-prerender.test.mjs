import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { chromium } from 'playwright';
import { build } from 'vite';
import { prerender } from '../../scripts/prerender.mjs';
import {
  articles, sitemapEntries, imageFixtures, SITE_URL, FALLBACK_URL,
  HERO_URL, SOCIAL_URL, UNKNOWN_SIZE_URL, FAILED_HERO_URL,
} from '../fixtures/articles.mjs';

const appDir = fileURLToPath(new URL('../../', import.meta.url));
const imageMetaSelector = 'meta[property="og:image"], meta[property^="og:image:"], '
  + 'meta[name="twitter:image"], meta[name^="twitter:image:"]';
const meta = (document, key) => document.head.querySelector(`meta[property="${key}"], meta[name="${key}"]`)?.getAttribute('content');
const articleSchema = (document) => [...document.querySelectorAll('script[type="application/ld+json"]')]
  .map((script) => JSON.parse(script.textContent))
  .find((schema) => schema['@type'] === 'Article');
const articleHero = (document) => document.querySelector('img[data-article-hero]');

const startFixtureServer = async (distDir) => {
  const apiRequests = [];
  const unexpectedApiRequests = [];
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const sendJson = (value, status = 200) => {
      response.writeHead(status, { 'content-type': 'application/json' });
      response.end(JSON.stringify(value));
    };
    if (url.pathname.startsWith('/api/')) {
      apiRequests.push(`${request.method} ${url.pathname}`);
      if (url.pathname === '/api/v1/articles/sitemap') return sendJson(sitemapEntries);
      if (url.pathname === '/api/v1/articles/tags') return sendJson([{ tag: 'Learning', count: articles.length }]);
      if (url.pathname === '/api/v1/articles/public') {
        return sendJson({ content: articles, totalElements: articles.length, size: 20, number: 0 });
      }
      const match = url.pathname.match(/^\/api\/v1\/articles\/public\/slug\/([^/]+)$/);
      if (match) {
        const result = articles.find((article) => article.slug === match[1]);
        return sendJson(result ?? { detail: 'Article not found' }, result ? 200 : 404);
      }
      unexpectedApiRequests.push(`${request.method} ${url.pathname}`);
      return sendJson({ detail: 'Unexpected test API request' }, 500);
    }

    const extension = path.extname(url.pathname);
    const requestedPath = path.join(distDir, url.pathname, extension ? '' : 'index.html');
    try {
      const content = await fs.readFile(requestedPath);
      const mimeTypes = {
        '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
        '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
      };
      response.writeHead(200, { 'content-type': mimeTypes[extension] ?? 'text/html' });
      response.end(content);
    } catch {
      response.writeHead(404);
      response.end('Fixture file not found');
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    apiRequests,
    unexpectedApiRequests,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
};

const installLocalRoutes = async (page, localOrigin, unexpectedRemoteRequests) => {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === localOrigin) {
      // The actual prerenderer's API proxy serves these from our local server.
      await route.fallback();
      return;
    }
    if (url.hostname === 'www.googletagmanager.com' && url.pathname === '/gtag/js') {
      await route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
      return;
    }
    if (url.href === FAILED_HERO_URL || (url.href === FALLBACK_URL && page.url().includes('/failed-fallback/'))) {
      // Exercise a failure arriving later than the old 300ms snapshot delay.
      await delay(500);
      await route.fulfill({ status: 404, body: 'Missing fixture image' });
      return;
    }
    const image = imageFixtures.get(url.href);
    if (image) {
      await route.fulfill({
        contentType: 'image/svg+xml',
        body: `<svg xmlns="http://www.w3.org/2000/svg" width="${image.width}" height="${image.height}"><rect width="100%" height="100%" fill="#cbd5e1"/></svg>`,
      });
      return;
    }
    unexpectedRemoteRequests.push(url.href);
    await route.abort('blockedbyclient');
  });
};

const assertSharedImage = (document, expectedUrl) => {
  assert.equal(meta(document, 'og:image'), expectedUrl);
  assert.equal(meta(document, 'twitter:image'), expectedUrl);
  assert.equal(meta(document, 'twitter:card'), 'summary_large_image');
  assert.equal(articleSchema(document).image['@type'], 'ImageObject');
  assert.equal(articleSchema(document).image.url, expectedUrl);
  assert.equal(document.querySelectorAll('meta[property="og:image"]').length, 1);
  assert.equal(document.querySelectorAll('meta[name="twitter:image"]').length, 1);
};

const assertKnownSize = (document, width, height, mimeType) => {
  assert.equal(meta(document, 'og:image:width'), String(width));
  assert.equal(meta(document, 'og:image:height'), String(height));
  assert.equal(meta(document, 'og:image:type'), mimeType);
  assert.equal(articleSchema(document).image.width, width);
  assert.equal(articleSchema(document).image.height, height);
  assert.equal(articleSchema(document).image.encodingFormat, mimeType);
};

const assertNoBorrowedDimensions = (document) => {
  assert.equal(meta(document, 'og:image:width'), undefined);
  assert.equal(meta(document, 'og:image:height'), undefined);
  assert.equal(articleSchema(document).image.width, undefined);
  assert.equal(articleSchema(document).image.height, undefined);
};

const readArticleDocument = async (distDir, slug) => new JSDOM(
  await fs.readFile(path.join(distDir, 'blog', slug, 'index.html'), 'utf8'),
).window.document;

const waitForArticle = async (page, article) => {
  await page.getByRole('heading', { level: 1, name: article.title, exact: true }).waitFor();
  await page.waitForFunction((title) => document.title === `${title} | Quizzence`, article.title);
};

const browserDocument = async (page) => new JSDOM(await page.content()).window.document;

// The CI SEO gate runs before npm run build. Build to a private temporary folder
// here, then exercise the real prerenderer rather than relying on static routes.
test('article output and browser navigation use local rendition fixtures', { timeout: 180_000 }, async (t) => {
  const temporaryDir = await fs.mkdtemp(path.join(os.tmpdir(), 'quizzence-article-prerender-'));
  const distDir = path.join(temporaryDir, 'dist');
  t.after(() => fs.rm(temporaryDir, { recursive: true, force: true }));
  const fixtureServer = await startFixtureServer(distDir);
  t.after(() => fixtureServer.close());
  const unexpectedRemoteRequests = [];

  await build({
    root: appDir,
    logLevel: 'error',
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api'),
      'import.meta.env.VITE_SITE_URL': JSON.stringify(SITE_URL),
    },
    build: { outDir: distDir, emptyOutDir: true },
  });
  await prerender({
    distDir,
    apiBaseUrl: `${fixtureServer.origin}/api`,
    staticOnly: false,
    setupPage: (page, previewOrigin) => installLocalRoutes(page, previewOrigin, unexpectedRemoteRequests),
  });

  await t.test('saved HTML preserves each canonical URL and complete article body', async () => {
    for (const article of articles) {
      const document = await readArticleDocument(distDir, article.slug);
      assert.equal(document.querySelector('h1')?.textContent, article.title);
      assert.match(document.body.textContent, /Local fixture article body remains readable\./);
      assert.equal(document.querySelector('link[rel="canonical"]')?.getAttribute('href'), article.canonicalUrl);
      assert.equal(meta(document, 'og:url'), article.canonicalUrl);
      assert.equal(meta(document, 'og:type'), 'article');
      assert.equal(articleSchema(document).mainEntityOfPage, article.canonicalUrl);
    }
  });

  await t.test('saved hero image and metadata use the rendition URL, dimensions, MIME and alt', async () => {
    const document = await readArticleDocument(distDir, 'hero-rendition');
    assert.equal(articleHero(document)?.getAttribute('src'), HERO_URL);
    assert.equal(articleHero(document)?.getAttribute('width'), '1200');
    assert.equal(articleHero(document)?.getAttribute('height'), '630');
    assert.equal(articleHero(document)?.getAttribute('alt'), 'Students practise recalling a lesson');
    assertSharedImage(document, HERO_URL);
    assertKnownSize(document, 1200, 630, 'image/jpeg');
    assert.equal(meta(document, 'og:image:alt'), 'Students practise recalling a lesson');
    assert.equal(meta(document, 'twitter:image:alt'), 'Students practise recalling a lesson');
  });

  await t.test('separate authored social image never borrows hero metadata', async () => {
    const document = await readArticleDocument(distDir, 'explicit-social');
    assert.equal(articleHero(document)?.getAttribute('src'), HERO_URL);
    assertSharedImage(document, SOCIAL_URL);
    assertNoBorrowedDimensions(document);
    assert.equal(meta(document, 'og:image:type'), undefined);
    assert.equal(meta(document, 'og:image:alt'), undefined);
    assert.equal(meta(document, 'twitter:image:alt'), undefined);
    assert.equal(articleSchema(document).image.encodingFormat, undefined);
  });

  await t.test('unknown rendition dimensions remain omitted without discarding the image', async () => {
    const document = await readArticleDocument(distDir, 'unknown-dimensions');
    assertSharedImage(document, UNKNOWN_SIZE_URL);
    assertNoBorrowedDimensions(document);
    assert.equal(meta(document, 'og:image:type'), 'image/webp');
    assert.equal(articleHero(document)?.hasAttribute('width'), false);
    assert.equal(articleHero(document)?.hasAttribute('height'), false);
  });

  await t.test('missing, unresolved, deleted and failed images save the approved fallback', async () => {
    for (const slug of ['missing-hero', 'missing-rendition', 'deleted-rendition', 'failed-hero']) {
      const document = await readArticleDocument(distDir, slug);
      assert.equal(articleHero(document)?.getAttribute('src'), FALLBACK_URL, slug);
      assert.equal(articleHero(document)?.getAttribute('width'), '1792', slug);
      assert.equal(articleHero(document)?.getAttribute('height'), '592', slug);
      assertSharedImage(document, FALLBACK_URL);
      assertKnownSize(document, 1792, 592, 'image/png');
      assert.doesNotMatch(document.body.textContent, /Stale cover caption|The article cover caption/);
      assert.notEqual(articleHero(document)?.getAttribute('alt'), 'Students practise recalling a lesson');
    }
  });

  await t.test('failed fallback keeps the saved article readable with no broken image or image metadata', async () => {
    const document = await readArticleDocument(distDir, 'failed-fallback');
    assert.equal(articleHero(document), null);
    assert.equal(document.querySelectorAll(imageMetaSelector).length, 0);
    assert.equal(meta(document, 'twitter:card'), 'summary');
    assert.equal(articleSchema(document).image, undefined);
  });

  const browser = await chromium.launch();
  t.after(() => browser.close());
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await t.test(`browser transitions remove stale image tags at ${viewport.width}px`, async () => {
      const page = await browser.newPage({ viewport });
      try {
        await installLocalRoutes(page, fixtureServer.origin, unexpectedRemoteRequests);
        await page.goto(`${fixtureServer.origin}/blog/hero-rendition/`);
        await waitForArticle(page, articles[0]);
        const hero = page.locator('img[data-article-hero]');
        await hero.waitFor();
        await page.waitForFunction(() => [...document.querySelectorAll('img[data-article-hero]')].every((image) => image.complete && image.naturalWidth > 0));
        const bounds = await hero.boundingBox();
        assert.ok(bounds && bounds.width > 0 && bounds.height > 0);
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= viewport.width);
        assert.ok(Math.abs(bounds.width / bounds.height - 1200 / 630) < 0.03);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
        assertSharedImage(await browserDocument(page), HERO_URL);

        // Real internal buttons exercise same-document React navigation, where
        // stale tags survive unless the head manager actively removes them.
        await page.getByRole('button', { name: 'Next fixture article', exact: true }).click();
        await waitForArticle(page, articles[1]);
        let document = await browserDocument(page);
        assertSharedImage(document, SOCIAL_URL);
        assertNoBorrowedDimensions(document);
        assert.equal(meta(document, 'og:image:type'), undefined);
        assert.equal(meta(document, 'twitter:image:alt'), undefined);

        await page.getByRole('button', { name: 'Next fixture article', exact: true }).click();
        await waitForArticle(page, articles[2]);
        document = await browserDocument(page);
        assertSharedImage(document, UNKNOWN_SIZE_URL);
        assertNoBorrowedDimensions(document);

        await page.getByRole('button', { name: 'Next fixture article', exact: true }).click();
        await waitForArticle(page, articles[3]);
        document = await browserDocument(page);
        assertSharedImage(document, FALLBACK_URL);
        assertKnownSize(document, 1792, 592, 'image/png');

        await page.getByRole('link', { name: '← Back to blog', exact: true }).click();
        await page.getByRole('heading', { level: 1, name: 'Learning science blog', exact: true }).waitFor();
        await page.waitForFunction(() => document.querySelector('meta[property="og:type"]')?.getAttribute('content') === 'website');
        document = await browserDocument(page);
        assert.equal(document.querySelectorAll(imageMetaSelector).length, 0);
        assert.equal(meta(document, 'twitter:card'), 'summary');
        assert.equal(articleSchema(document), undefined);
      } finally {
        await page.close();
      }
    });
  }

  assert.ok(fixtureServer.apiRequests.includes('GET /api/v1/articles/sitemap'));
  for (const { slug } of articles) {
    assert.ok(fixtureServer.apiRequests.includes(`GET /api/v1/articles/public/slug/${slug}`), `Expected rendered article request for ${slug}`);
  }
  assert.deepEqual(fixtureServer.unexpectedApiRequests, []);
  assert.deepEqual(unexpectedRemoteRequests, [], 'No unexpected remote resource may leave the local test harness');
});
