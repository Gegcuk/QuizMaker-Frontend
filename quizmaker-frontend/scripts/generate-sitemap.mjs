import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const SITE_URL = process.env.VITE_SITE_URL || 'https://www.quizzence.com';
const baseUrl = SITE_URL.replace(/\/$/, '');

// Normalize blog URLs to match canonical format (with trailing slash)
const normalizeBlogUrl = (url) => {
  // Extract slug from URL (handles both /blog/slug and /blog/slug/)
  const match = url.match(/\/blog\/([^\/]+)/);
  if (match) {
    return `/blog/${match[1]}/`; // Always add trailing slash
  }
  return url; // Return as-is for non-blog URLs
};

// Static routes with their priorities and change frequencies
const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/blog/', priority: '0.8', changefreq: 'weekly' },
  { path: '/terms/', priority: '0.4', changefreq: 'monthly' },
  { path: '/privacy/', priority: '0.4', changefreq: 'monthly' },
  { path: '/faq/', priority: '0.5', changefreq: 'monthly' },
  { path: '/values/', priority: '0.5', changefreq: 'monthly' },
  { path: '/roadmap/', priority: '0.6', changefreq: 'monthly' },
  { path: '/theme-demo/', priority: '0.3', changefreq: 'monthly' },
];

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
      .map((entry) => ({
        path: normalizeBlogUrl(entry.url),
        priority: entry.priority?.toString() || '0.8',
        changefreq: entry.changefreq || 'weekly',
        lastmod: entry.updatedAt || undefined,
      }))
      .filter((route) => route.path && route.path.includes('/blog/'))
      .filter((route, index, self) => 
        self.findIndex((r) => r.path === route.path) === index
      ); // Remove duplicates

    console.log(`Found ${routes.length} blog article routes`);
    return routes;
  } catch (error) {
    console.warn(`Error fetching article sitemap: ${error.message}`);
    console.warn('Continuing with static routes only...');
    return [];
  }
};

// Generate XML sitemap
const generateSitemap = (routes) => {
  const urlEntries = routes.map((route) => {
    const loc = `${baseUrl}${route.path}`;
    let entry = `  <url>\n    <loc>${escapeXml(loc)}</loc>\n`;
    
    if (route.lastmod) {
      // Format date as YYYY-MM-DD or ISO 8601
      const lastmod = new Date(route.lastmod).toISOString().split('T')[0];
      entry += `    <lastmod>${lastmod}</lastmod>\n`;
    }
    
    if (route.changefreq) {
      entry += `    <changefreq>${route.changefreq}</changefreq>\n`;
    }
    
    if (route.priority) {
      entry += `    <priority>${route.priority}</priority>\n`;
    }
    
    entry += '  </url>';
    return entry;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
};

// Escape XML special characters
const escapeXml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Main function
const generateSitemapFile = async () => {
  try {
    // Fetch dynamic blog routes
    const articleRoutes = await fetchArticleRoutes();
    
    // Combine static and dynamic routes
    const allRoutes = [
      ...STATIC_ROUTES,
      ...articleRoutes,
    ];

    // Generate XML
    const xml = generateSitemap(allRoutes);
    
    // Ensure dist directory exists
    await fs.mkdir(distDir, { recursive: true });
    
    // Write sitemap to dist
    const sitemapPath = path.join(distDir, 'sitemap.xml');
    await fs.writeFile(sitemapPath, xml, 'utf8');
    
    console.log(`✔ Generated sitemap with ${allRoutes.length} URLs -> ${path.relative(rootDir, sitemapPath)}`);
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    process.exit(1);
  }
};

generateSitemapFile()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Sitemap generation failed:', err);
    process.exit(1);
  });
