import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { publicRouteManifest, staticPrerenderRoutes } from '../src/routes/publicRouteManifest.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const readSitemapUrls = (xml, source, { allowEmpty = false } = {}) => {
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (!allowEmpty) {
    assert.ok(urls.length > 0, `Expected ${source} to contain at least one URL.`);
  }
  return urls;
};

const getMetaContent = (document, selector) => document.querySelector(selector)?.getAttribute('content')?.trim();

const getArticleSchema = (document) => {
  const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];

  for (const script of scripts) {
    const parsed = JSON.parse(script.textContent ?? '{}');
    const entries = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
    const articleSchema = entries.find((entry) => entry?.['@type'] === 'Article');
    if (articleSchema) {
      return articleSchema;
    }
  }

  return undefined;
};

const resolveArticleOutputPath = (url) => {
  const pathname = new URL(url).pathname;
  const match = pathname.match(/^\/blog\/([^/]+)\/$/);
  assert.ok(match, `Expected sitemap URL to be a canonical article route, got ${url}`);
  return path.join(distDir, 'blog', match[1], 'index.html');
};

const resolveOutputPath = (routePath) => {
  if (routePath === '/') {
    return path.join(distDir, 'index.html');
  }
  return path.join(distDir, routePath.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
};

const assertStaticRouteHtml = async (route, baseUrl) => {
  const outputPath = resolveOutputPath(route.path);
  const html = await fs.readFile(outputPath, 'utf8');
  const document = new JSDOM(html).window.document;
  const title = document.title.trim();
  const description = getMetaContent(document, 'meta[name="description"]');
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim();
  const robots = getMetaContent(document, 'meta[name="robots"]');
  const headings = [...document.querySelectorAll('h1')]
    .map((heading) => heading.textContent?.trim() ?? '')
    .filter(Boolean);

  assert.ok(title, `Expected a title in ${outputPath}`);
  assert.ok(description, `Expected a description in ${outputPath}`);
  assert.equal(canonical, `${baseUrl}${route.path}`, `Expected the manifest canonical URL in ${outputPath}`);
  assert.doesNotMatch(robots ?? '', /noindex/i, `Expected ${route.path} to be indexable`);
  assert.equal(headings.length, 1, `Expected exactly one meaningful H1 in ${outputPath}`);
};

const assertNotFoundHtml = async () => {
  const outputPath = path.join(distDir, '404.html');
  const document = new JSDOM(await fs.readFile(outputPath, 'utf8')).window.document;
  const robots = getMetaContent(document, 'meta[name="robots"]') ?? '';
  const heading = document.querySelector('h1')?.textContent?.trim();

  assert.equal(document.title.trim(), 'Page Not Found | Quizzence');
  assert.equal(heading, 'Page Not Found');
  assert.match(robots, /noindex/i);
};

const assertArticleHtml = async (articleUrl) => {
  const outputPath = resolveArticleOutputPath(articleUrl);
  const html = await fs.readFile(outputPath, 'utf8');
  const document = new JSDOM(html).window.document;
  const title = document.title.trim();
  const description = getMetaContent(document, 'meta[name="description"]');
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim();
  const ogTitle = getMetaContent(document, 'meta[property="og:title"]');
  const ogDescription = getMetaContent(document, 'meta[property="og:description"]');
  const ogUrl = getMetaContent(document, 'meta[property="og:url"]');
  const ogType = getMetaContent(document, 'meta[property="og:type"]');

  assert.ok(title, `Expected a title in ${outputPath}`);
  assert.ok(description, `Expected a description in ${outputPath}`);
  assert.ok(canonical, `Expected a canonical URL in ${outputPath}`);
  assert.doesNotThrow(() => new URL(canonical), `Expected an absolute canonical URL in ${outputPath}`);
  assert.equal(ogTitle, title, `Expected Open Graph title to match the document title in ${outputPath}`);
  assert.equal(ogDescription, description, `Expected Open Graph description to match the document description in ${outputPath}`);
  assert.equal(ogUrl, canonical, `Expected Open Graph URL to match the canonical URL in ${outputPath}`);
  assert.equal(ogType, 'article', `Expected an article Open Graph type in ${outputPath}`);

  const articleSchema = getArticleSchema(document);
  assert.ok(articleSchema, `Expected an Article JSON-LD object in ${outputPath}`);
  assert.ok(articleSchema.headline, `Expected a JSON-LD headline in ${outputPath}`);
  assert.ok(
    title.startsWith(articleSchema.headline),
    `Expected the document title to begin with the JSON-LD headline in ${outputPath}`,
  );
  assert.equal(
    articleSchema.description,
    description,
    `Expected JSON-LD description to match the document description in ${outputPath}`,
  );
  assert.equal(
    articleSchema.mainEntityOfPage,
    canonical,
    `Expected JSON-LD canonical URL to match the canonical link in ${outputPath}`,
  );
};

const main = async () => {
  const [sitemap, articleSitemap] = await Promise.all([
    fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf8'),
    fs.readFile(path.join(distDir, 'sitemap_articles.xml'), 'utf8'),
  ]);
  const staticSitemapUrls = new Set(readSitemapUrls(sitemap, 'sitemap.xml'));
  const requireArticles = process.env.REQUIRE_ARTICLE_ROUTES === 'true';
  const articleUrls = readSitemapUrls(articleSitemap, 'sitemap_articles.xml', {
    allowEmpty: !requireArticles,
  });
  const articleSitemapUrls = new Set(articleUrls);
  const baseUrl = (process.env.VITE_SITE_URL || 'https://www.quizzence.com').replace(/\/$/, '');

  for (const route of staticPrerenderRoutes) {
    const routeUrl = `${baseUrl}${route.path}`;
    assert.ok(staticSitemapUrls.has(routeUrl), `Expected ${route.path} in sitemap.xml`);
    assert.ok(!articleSitemapUrls.has(routeUrl), `Expected static route ${route.path} outside sitemap_articles.xml`);
    await assertStaticRouteHtml(route, baseUrl);
  }

  for (const route of publicRouteManifest.filter((candidate) => !candidate.indexable)) {
    const routeUrl = `${baseUrl}${route.path}`;
    assert.ok(!staticSitemapUrls.has(routeUrl), `Expected noindex route ${route.path} outside sitemap.xml`);
    assert.ok(!articleSitemapUrls.has(routeUrl), `Expected noindex route ${route.path} outside sitemap_articles.xml`);
  }
  await assertNotFoundHtml();

  for (const articleUrl of articleUrls) {
    assert.ok(!staticSitemapUrls.has(articleUrl), `Expected article URL ${articleUrl} outside static sitemap.xml`);
    await assertArticleHtml(articleUrl);
  }

  console.log(
    `Verified ${staticPrerenderRoutes.length} static public routes and ${articleUrls.length} article routes.`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
