import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const PREVIEW_PORT = 4173;
const PREVIEW_ORIGIN = `http://127.0.0.1:${PREVIEW_PORT}`;

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
const apiBaseUrl = normalizeApiBaseUrl(rawApiBaseUrl);

// Routes whose HTML should be fully prerendered with correct <title>/<meta>.
// Keep this list small and focused on key marketing / blog / legal pages.
const STATIC_ROUTES = [
  '/',
  '/blog/',
  '/blog/retrieval-practice-template/',
  '/terms/',
  '/privacy/',
  '/theme-demo/',
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Normalize blog URLs to match canonical format (with trailing slash)
const normalizeBlogUrl = (url) => {
  // Extract slug from URL (handles both /blog/slug and /blog/slug/)
  const match = url.match(/\/blog\/([^\/]+)/);
  if (match) {
    return `/blog/${match[1]}/`; // Always add trailing slash
  }
  return url; // Return as-is for non-blog URLs
};

// Fetch article sitemap from API
const fetchArticleRoutes = async () => {
  const sitemapUrl = `${apiBaseUrl}/v1/articles/sitemap`;

  try {
    console.log(`Fetching article sitemap from ${sitemapUrl}...`);
    const response = await fetch(sitemapUrl);
    
    if (!response.ok) {
      console.warn(`Failed to fetch sitemap (${response.status}): ${response.statusText}`);
      return [];
    }

    const entries = await response.json();
    const routes = entries
      .map((entry) => entry.url)
      .filter((url) => url && url.includes('/blog/'))
      .map(normalizeBlogUrl)
      .filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates

    console.log(`Found ${routes.length} blog article routes`);
    return routes;
  } catch (error) {
    console.warn(`Error fetching article sitemap: ${error.message}`);
    console.warn('Continuing with static routes only...');
    return [];
  }
};

const setupApiProxy = async (page) => {
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

const resolveOutputPath = (route) => {
  if (route === '/' || route === '') {
    return path.join(distDir, 'index.html');
  }

  const cleaned = route.replace(/^\//, '').replace(/\/$/, '');
  return path.join(distDir, cleaned, 'index.html');
};

const waitForPreviewServer = async () => {
  const maxAttempts = 30;
  const url = `${PREVIEW_ORIGIN}/`;

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

const startPreviewServer = () =>
  new Promise((resolve, reject) => {
    const preview = spawn(
      'npm',
      ['run', 'preview', '--', '--port', String(PREVIEW_PORT), '--host', '127.0.0.1'],
      {
        cwd: rootDir,
        stdio: 'ignore',
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
      },
    );

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
      resolve(preview);
    };

    preview.on('error', (err) => {
      handleFailure(err);
    });

    // If preview dies before we're ready, fail fast. If it dies after ready, ignore.
    preview.on('exit', (code) => {
      if (!settled) {
        handleFailure(new Error(`Vite preview exited early with code ${code}`));
      }
    });

    const checkReady = async () => {
      try {
        await waitForPreviewServer();
        handleReady();
      } catch (error) {
        handleFailure(error);
      }
    };

    void checkReady();
  });

const prerender = async () => {
  const distExists = await fs
    .access(distDir)
    .then(() => true)
    .catch(() => false);

  if (!distExists) {
    throw new Error('dist directory not found. Run `npm run build` first.');
  }

  // Fetch dynamic blog routes from API
  const articleRoutes = await fetchArticleRoutes();
  const ROUTES_TO_PRERENDER = [...STATIC_ROUTES, ...articleRoutes];

  let preview;
  let browser;

  try {
    preview = await startPreviewServer();

    browser = await chromium.launch();
    const page = await browser.newPage();
    await setupApiProxy(page);

    for (const route of ROUTES_TO_PRERENDER) {
      const url = `${PREVIEW_ORIGIN}${route}`;
      console.log(`Prerendering ${route}...`);
      
      // Load the page
      await page.goto(url, { waitUntil: 'load' });

      // Wait for content to be ready based on route type
      if (route.startsWith('/blog/') && route !== '/blog/') {
        // Blog article page - wait for SEO meta + title to confirm data loaded.
        await page.waitForSelector('meta[property="og:type"][content="article"]', { timeout: 15000 });
        await page.waitForFunction(() => {
          const heading = document.querySelector('h1');
          return heading && heading.textContent && heading.textContent.trim().length > 0;
        }, { timeout: 15000 });
      } else if (route === '/blog/') {
        // Blog index page - wait for article links or empty state.
        await page.waitForFunction(() => {
          const hasArticleLink = Array.from(document.querySelectorAll('a')).some((link) => {
            const href = link.getAttribute('href') || '';
            return href.startsWith('/blog/') && href !== '/blog/' && href !== '/blog';
          });
          const emptyState = document.body?.textContent?.includes('No articles found.');
          return hasArticleLink || emptyState;
        }, { timeout: 15000 });
      } else {
        // Other pages - wait for main content to render.
        await page.waitForSelector('main, h1', { timeout: 10000 });
      }

      // Additional small delay to ensure all metadata is injected.
      await delay(300);

      const html = await page.content();
      const outputPath = resolveOutputPath(route);

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

prerender()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
     
    console.error('Prerender failed:', err);
    process.exit(1);
  });
