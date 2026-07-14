import fs from 'node:fs/promises';

const getArticleSitemapUrl = (apiBaseUrl) => {
  if (typeof apiBaseUrl !== 'string' || apiBaseUrl.trim().length === 0) {
    throw new Error('Article sitemap generation requires an API base URL.');
  }

  return `${apiBaseUrl.replace(/\/$/, '')}/v1/articles/sitemap`;
};

const parseArticleRoute = (value, index) => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Article sitemap entry ${index + 1} is missing a URL.`);
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Article sitemap entry ${index + 1} has an invalid URL: ${value}`);
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.search || url.hash) {
    throw new Error(`Article sitemap entry ${index + 1} must be a clean HTTP(S) URL: ${value}`);
  }

  const match = url.pathname.match(/^\/blog\/([^/?#]+)\/?$/);
  if (!match) {
    throw new Error(`Article sitemap entry ${index + 1} is not a blog article URL: ${value}`);
  }

  return `/blog/${match[1]}/`;
};

const validateEntry = (entry, index, paths) => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new Error(`Article sitemap entry ${index + 1} must be an object.`);
  }

  const route = parseArticleRoute(entry.url, index);
  if (paths.has(route)) {
    throw new Error(`Article sitemap contains the duplicate route ${route}.`);
  }

  if (
    entry.updatedAt !== undefined &&
    (typeof entry.updatedAt !== 'string' || Number.isNaN(Date.parse(entry.updatedAt)))
  ) {
    throw new Error(`Article sitemap entry ${index + 1} has an invalid updatedAt value.`);
  }

  if (
    entry.priority !== undefined &&
    (typeof entry.priority !== 'number' || !Number.isFinite(entry.priority) || entry.priority < 0 || entry.priority > 1)
  ) {
    throw new Error(`Article sitemap entry ${index + 1} has a priority outside the 0.0-1.0 range.`);
  }

  if (entry.changefreq !== undefined && (typeof entry.changefreq !== 'string' || entry.changefreq.trim().length === 0)) {
    throw new Error(`Article sitemap entry ${index + 1} has an invalid changefreq value.`);
  }

  paths.add(route);
  return {
    path: route,
    priority: entry.priority?.toString() ?? '0.8',
    changefreq: entry.changefreq ?? 'weekly',
    lastmod: entry.updatedAt,
  };
};

const parseEntries = (entries, source) => {
  if (!Array.isArray(entries)) {
    throw new Error(`Article sitemap from ${source} must be a JSON array.`);
  }

  if (entries.length === 0) {
    throw new Error(`Article sitemap from ${source} is empty; refusing to generate a partial sitemap.`);
  }

  const paths = new Set();
  return entries.map((entry, index) => validateEntry(entry, index, paths));
};

const readFixture = async (fixturePath) => {
  try {
    return JSON.parse(await fs.readFile(fixturePath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read article sitemap fixture ${fixturePath}: ${error.message}`);
  }
};

export const loadArticleSitemapRoutes = async ({
  apiBaseUrl,
  fixturePath = process.env.ARTICLE_SITEMAP_FIXTURE,
  fetchImpl = fetch,
}) => {
  if (fixturePath) {
    return parseEntries(await readFixture(fixturePath), `fixture ${fixturePath}`);
  }

  const sitemapUrl = getArticleSitemapUrl(apiBaseUrl);
  let response;

  try {
    response = await fetchImpl(sitemapUrl, {
      headers: { accept: 'application/json' },
    });
  } catch (error) {
    throw new Error(`Unable to fetch article sitemap from ${sitemapUrl}: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(`Article sitemap request failed with ${response.status} ${response.statusText || ''}`.trim());
  }

  try {
    return parseEntries(await response.json(), sitemapUrl);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Article sitemap from ${sitemapUrl} is not valid JSON.`);
    }
    throw error;
  }
};
