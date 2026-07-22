import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const readSitemapUrls = (xml, source) => {
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.ok(urls.length > 0, `Expected ${source} to contain at least one URL.`);
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
  const sitemapUrls = new Set(readSitemapUrls(sitemap, 'sitemap.xml'));
  const articleUrls = readSitemapUrls(articleSitemap, 'sitemap_articles.xml');

  for (const articleUrl of articleUrls) {
    assert.ok(sitemapUrls.has(articleUrl), `Expected ${articleUrl} in sitemap.xml as well as sitemap_articles.xml`);
    await assertArticleHtml(articleUrl);
  }

  console.log(`Verified prerendered SEO metadata for ${articleUrls.length} article routes.`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
