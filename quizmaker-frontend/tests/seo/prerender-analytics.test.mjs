import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { prerender } from '../../scripts/prerender.mjs';

const appDir = new URL('../../', import.meta.url);
const images = ['values_hero.png', 'values_signal_graphic.png', 'values_learning_loop.png',
  'values_teachers_workflow.png', 'footer_emplem.png'];
const pixelUrl = 'https://www.googletagmanager.com/td?fixture=prerender';

for (const staticOnly of [true, false]) {
  test(`prerender suppresses analytics execution and preserves Values images and visitor tags (staticOnly=${staticOnly})`, { timeout: 45_000 }, async t => {
    const distDir = await fs.mkdtemp(path.join(os.tmpdir(), 'quizzence-prerender-analytics-'));
    t.after(() => fs.rm(distDir, { recursive: true, force: true }));
    const production = new JSDOM(await fs.readFile(new URL('index.html', appDir), 'utf8')).window.document;
    const tag = production.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]');
    assert.ok(tag, 'Use the production analytics loader, not a separately configured test tag');
    const bootstrap = tag.nextElementSibling;
    assert.ok(bootstrap?.textContent.includes('function gtag'));
    await fs.writeFile(path.join(distDir, 'index.html'), `<!doctype html><html><head>
      <title>Values fixture</title><meta property="og:type" content="article">
      ${tag.outerHTML}${bootstrap.outerHTML}
      </head><body><main><h1>Values fixture</h1>
      <a href="/blog/prerender-fixture/">Local article fixture</a>
      ${images.map(name => `<img src="/${name}" alt="${name}">`).join('')}
      </main></body></html>`);
    for (const name of images) await fs.copyFile(new URL(`public/${name}`, appDir), path.join(distDir, name));

    let apiBaseUrl;
    if (!staticOnly) {
      // Also exercise the real API proxy registration order without a remote API.
      const server = http.createServer((request, response) => {
        assert.equal(request.url, '/api/v1/articles/sitemap');
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify([{ url: 'https://www.quizzence.com/blog/prerender-fixture/' }]));
      });
      t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      apiBaseUrl = `http://127.0.0.1:${server.address().port}/api`;
    }

    let analyticsExecutions = 0;
    let analyticsPixels = 0;
    await prerender({
      distDir, staticOnly, apiBaseUrl,
      setupPage: async page => {
        // A context-level provider fake stands in for Google's downloaded JS.
        // The renderer's page policy must intercept the loader before it runs.
        // This reproduces /td deterministically without calling Google or
        // relying on the vendor's variable response time.
        await page.context().route('https://www.googletagmanager.com/**', async route => {
          if (route.request().resourceType() === 'script') {
            analyticsExecutions++;
            await route.fulfill({ contentType: 'application/javascript', body: `
              document.documentElement.dataset.analyticsFixture = 'executed';
              (new Image()).src = ${JSON.stringify(pixelUrl)};
            ` });
          } else await route.abort('blockedbyclient');
        });
        page.on('request', request => { if (request.url() === pixelUrl) analyticsPixels++; });
      },
    });

    assert.equal(analyticsExecutions, 0, 'Build-time page views must never run the downloaded analytics script');
    assert.equal(analyticsPixels, 0, 'No analytics image request may reach the prerender image boundary');
    const saved = new JSDOM(await fs.readFile(path.join(distDir, 'values/index.html'), 'utf8')).window.document;
    assert.equal(saved.querySelector('h1')?.textContent, 'Values fixture');
    assert.deepEqual([...saved.querySelectorAll('img')].map(image => image.getAttribute('src')), images.map(name => `/${name}`));
    assert.equal(saved.documentElement.hasAttribute('data-analytics-fixture'), false);
    assert.equal(saved.querySelector('script[src]')?.getAttribute('src'), tag.getAttribute('src'), 'Visitors retain the original analytics loader');
    assert.ok([...saved.querySelectorAll('script')].some(script => script.textContent === bootstrap.textContent), 'Visitors retain the original inline bootstrap');
  });
}
