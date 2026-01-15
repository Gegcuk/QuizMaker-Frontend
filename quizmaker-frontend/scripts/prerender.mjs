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

// Routes whose HTML should be fully prerendered with correct <title>/<meta>.
// Keep this list small and focused on key marketing / blog / legal pages.
const STATIC_ROUTES = [
  '/',
  '/blog/',
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
  const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
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

    for (const route of ROUTES_TO_PRERENDER) {
      const url = `${PREVIEW_ORIGIN}${route}`;
      console.log(`Prerendering ${route}...`);
      
      // Load the page
      await page.goto(url, { waitUntil: 'load' });

      // Wait for content to be ready based on route type
      if (route.startsWith('/blog/') && route !== '/blog/') {
        // Blog article page - wait for article header/title
        try {
          await page.waitForSelector('h1, [class*="article"], header', { timeout: 5000 });
        } catch {
          // Fallback: wait for any content
          await delay(1000);
        }
        // Wait for JSON-LD structured data to be injected
        try {
          await page.waitForSelector('script[type="application/ld+json"]', { timeout: 3000 });
        } catch {
          // JSON-LD might not be present, continue anyway
        }
      } else if (route === '/blog/') {
        // Blog index page - wait for article list
        try {
          await page.waitForSelector('[class*="card"], [class*="article"], a[href*="/blog/"]', { timeout: 5000 });
        } catch {
          await delay(1000);
        }
      } else {
        // Other pages - wait for main content
        try {
          await page.waitForSelector('main, [class*="container"], h1', { timeout: 5000 });
        } catch {
          await delay(1000);
        }
      }

      // Additional small delay to ensure all metadata is injected
      await delay(500);

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
