// Complete an existing production build with local article fixtures. CI deploys
// use the real build:prerender command; this helper never contacts production.
import http from 'node:http';
import { createSecurityHeaders } from '../../scripts/deployment/security-headers.mjs';
import { once } from 'node:events';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { prerender } from '../../scripts/prerender.mjs';
import { articles, sitemapEntries } from './articles.mjs';

const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  let value;
  if (url.pathname === '/api/v1/articles/sitemap') value = sitemapEntries;
  else if (url.pathname === '/api/v1/articles/public') value = { content: articles, totalElements: articles.length, size: 20, number: 0 };
  else if (url.pathname === '/api/v1/articles/tags') value = [];
  else value = articles.find(article => url.pathname === `/api/v1/articles/public/slug/${article.slug}`);
  response.writeHead(value ? 200 : 404, { 'content-type': 'application/json' });
  response.end(JSON.stringify(value ?? { detail: 'Fixture not found' }));
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const apiBaseUrl = `http://127.0.0.1:${server.address().port}/api`;
try {
  await promisify(execFile)(process.execPath, ['scripts/generate-sitemap.mjs'], {
    env: { ...process.env, VITE_API_BASE_URL: apiBaseUrl },
  });
  await prerender({ apiBaseUrl, staticOnly: false, setupPage: async (page, origin) => {
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.fallback();
      if (url.hostname === 'www.googletagmanager.com') return route.fulfill({ contentType: 'application/javascript', body: '' });
      if (route.request().resourceType() === 'image') return route.fulfill({
        contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"></svg>',
      });
      return route.abort('blockedbyclient');
    });
  } });
  await createSecurityHeaders('dist');
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
