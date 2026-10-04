import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { chromium } from 'playwright';
import { loadArticleSitemapRoutes } from './article-sitemap.mjs';
import { getPublicRoute, staticPrerenderRoutes } from '../src/routes/publicRouteManifest.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const defaultDistDir = path.join(rootDir, 'dist');

const SITE_URL = process.env.VITE_SITE_URL || 'https://www.quizzence.com';
const rawApiBaseUrl = process.env.VITE_API_BASE_URL || '/api';
const normalizeApiBaseUrl = (value) => {
  if (!value) {
    return `${SITE_URL.replace(/\/$/, '')}/api`;
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value.replace(/\/$/, '');
  }
  const base = SITE_URL.replace(/\/$/, '');
  const path = value.startsWith('/') ? value : `/${value}`;
  return `${base}${path}`.replace(/\/$/, '');
};
const defaultApiBaseUrl = normalizeApiBaseUrl(rawApiBaseUrl);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const setupApiProxy = async (page, apiBaseUrl) => {
  const isApiRequest = (requestUrl) => {
    try {
      const url = new URL(requestUrl);
      return url.pathname.startsWith('/api/') || requestUrl.startsWith(apiBaseUrl);
    } catch {
      return false;
    }
  };

  const resolveTargetUrl = (requestUrl) => {
    if (requestUrl.startsWith(apiBaseUrl)) {
      return requestUrl;
    }

    const url = new URL(requestUrl);
    if (!url.pathname.startsWith('/api/')) {
      return null;
    }

    const rewrittenPath = url.pathname.replace(/^\/api/, '');
    return `${apiBaseUrl}${rewrittenPath}${url.search}`;
  };

  await page.route('**/*', async (route) => {
    const request = route.request();
    const requestUrl = request.url();

    if (!isApiRequest(requestUrl)) {
      await route.continue();
      return;
    }

    const targetUrl = resolveTargetUrl(requestUrl);
    if (!targetUrl) {
      await route.continue();
      return;
    }

    try {
      const method = request.method();
      const headers = request.headers();
      delete headers.origin;
      delete headers.host;

      const response = await fetch(targetUrl, {
        method,
        headers,
        body: method === 'GET' || method === 'HEAD' ? undefined : request.postData(),
      });

      const body = await response.text();
      const contentType = response.headers.get('content-type') || 'application/json';

      await route.fulfill({
        status: response.status,
        headers: {
          'content-type': contentType,
        },
        body,
      });
    } catch (error) {
      console.warn(`API proxy failed for ${requestUrl}: ${error.message}`);
      await route.abort();
    }
  });
};

const resolveOutputPath = (route, distDir) => {
  if (route === getPublicRoute('notFound').path) {
    return path.join(distDir, '404.html');
  }
  if (route === '/' || route === '') {
    return path.join(distDir, 'index.html');
  }

  const cleaned = route.replace(/^\//, '').replace(/\/$/, '');
  return path.join(distDir, cleaned, 'index.html');
};

const findAvailablePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.unref();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    if (!address || typeof address === 'string') {
      server.close(() => reject(new Error('Unable to allocate a preview port.')));
      return;
    }
    server.close(() => resolve(address.port));
  });
});

const waitForPreviewServer = async (previewOrigin) => {
  const maxAttempts = 30;
  const url = `${previewOrigin}/`;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return;
      }
    } catch {
      // Ignore and retry.
    }
    await delay(1000);
  }

  throw new Error('Vite preview server did not start in time.');
};

const startPreviewServer = async (distDir) => {
  const previewPort = await findAvailablePort();
  const previewOrigin = `http://127.0.0.1:${previewPort}`;

  return new Promise((resolve, reject) => {
    const preview = spawn(
      'npm',
      ['run', 'preview', '--', '--outDir', distDir, '--port', String(previewPort), '--strictPort', '--host', '127.0.0.1'],
      {
        cwd: rootDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
      },
    );
    let output = '';
    preview.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    preview.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });

    let settled = false;

    const handleFailure = (error) => {
      if (settled) {
         
        console.error('Vite preview process error after start:', error);
        return;
      }
      settled = true;
      reject(error);
    };

    const handleReady = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve({ preview, previewOrigin });
    };

    preview.on('error', (err) => {
      handleFailure(err);
    });

    // If preview dies before we're ready, fail fast. If it dies after ready, ignore.
    preview.on('exit', (code) => {
      if (!settled) {
        handleFailure(new Error(
          `Vite preview exited early with code ${code}.${output.trim() ? `\n${output.trim()}` : ''}`,
        ));
      }
    });

    const checkReady = async () => {
      try {
        await waitForPreviewServer(previewOrigin);
        handleReady();
      } catch (error) {
        handleFailure(error);
      }
    };

    void checkReady();
  });
};

// Importable so output checks can use the same renderer with an isolated build and local fixtures.
export const prerender = async ({
  distDir = defaultDistDir,
  apiBaseUrl = defaultApiBaseUrl,
  staticOnly = process.env.PUBLIC_ROUTES_STATIC_ONLY === 'true',
  setupPage,
} = {}) => {
  const distExists = await fs
    .access(distDir)
    .then(() => true)
    .catch(() => false);

  if (!distExists) {
    throw new Error('dist directory not found. Run `npm run build` first.');
  }

  const articleRoutes = staticOnly ? [] : await loadArticleSitemapRoutes({ apiBaseUrl });
  const routesToPrerender = [
    ...new Set([
      ...staticPrerenderRoutes.map((route) => route.path),
      ...articleRoutes.map((route) => route.path),
      getPublicRoute('notFound').path,
    ]),
  ];
  const articleRoutePaths = new Set(articleRoutes.map((route) => route.path));
  const blogIndexPath = getPublicRoute('blogIndex').path;

  let preview;
  let previewOrigin;
  let browser;

  try {
    ({ preview, previewOrigin } = await startPreviewServer(distDir));

    browser = await chromium.launch();
    const page = await browser.newPage();
    if (!staticOnly) {
      await setupApiProxy(page, apiBaseUrl);
    }

    if (setupPage) {
      await setupPage(page, previewOrigin);
    }

    for (const route of routesToPrerender) {
      const url = `${previewOrigin}${route}`;
      console.log(`Prerendering ${route}...`);
      
      // Load the page
      await page.goto(url, { waitUntil: 'load' });

      // Wait for content to be ready based on route type
      if (articleRoutePaths.has(route)) {
        // Blog article page - wait for SEO meta + title to confirm data loaded.
        await page.waitForFunction(() => {
          const meta = document.querySelector('meta[property="og:type"]');
          return meta?.getAttribute('content') === 'article';
        }, undefined, { timeout: 15000 });
        await page.waitForFunction(() => {
          const heading = document.querySelector('h1');
          return heading && heading.textContent && heading.textContent.trim().length > 0;
        }, undefined, { timeout: 15000 });
      } else if (!staticOnly && route === blogIndexPath) {
        // Blog index page - wait for article links or empty state.
        await page.waitForFunction(() => {
          const hasArticleLink = Array.from(document.querySelectorAll('a')).some((link) => {
            const href = link.getAttribute('href') || '';
            return href.startsWith('/blog/') && href !== '/blog/' && href !== '/blog';
          });
          const emptyState = document.body?.textContent?.includes('No articles found.');
          return hasArticleLink || emptyState;
        }, undefined, { timeout: 15000 });
      } else {
        // Other pages - wait for main content to render.
        await page.waitForSelector('main, h1', { timeout: 10000 });
      }

      if (articleRoutePaths.has(route)) {
        // An image can fail after the article data arrives. Wait for the rendered
        // image or its fallback to settle before saving the matching metadata.
        try {
          await page.waitForFunction(() => {
            const image = document.querySelector('img[data-article-hero]');
            return !image || (image.complete && image.naturalWidth > 0);
          }, undefined, { timeout: 15000 });
        } catch (error) {
          if (error.name !== 'TimeoutError') throw error;
          // A stalled CDN must not discard otherwise readable article output.
          console.warn(`Article image still loading for ${route}; keeping its declared metadata.`);
        }
      } else {
        // Allow static-page metadata effects to finish.
        await delay(300);
      }

      const html = await page.content();
      const outputPath = resolveOutputPath(route, distDir);

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, html, 'utf8');
       
      console.log(`✔ Prerendered ${route} -> ${path.relative(rootDir, outputPath)}`);
    }
  } finally {
    // Ensure the browser and preview server are stopped even on failure.
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore close errors
      }
    }
    if (preview && !preview.killed) {
      preview.kill('SIGINT');
      // Do not await child exit; allow process to exit once main work is done.
    }
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  prerender()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Prerender failed:', err);
      process.exit(1);
    });
}
