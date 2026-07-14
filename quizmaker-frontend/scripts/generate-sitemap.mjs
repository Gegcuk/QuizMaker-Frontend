import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadArticleSitemapRoutes } from './article-sitemap.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const SITE_URL = process.env.VITE_SITE_URL || 'https://www.quizzence.com';
const baseUrl = SITE_URL.replace(/\/$/, '');

// Static routes with their priorities and change frequencies
const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/blog/', priority: '0.8', changefreq: 'weekly' },
  { path: '/blog/retrieval-practice-template/', priority: '0.8', changefreq: 'weekly' },
  { path: '/terms/', priority: '0.4', changefreq: 'monthly' },
  { path: '/privacy/', priority: '0.4', changefreq: 'monthly' },
  { path: '/faq/', priority: '0.5', changefreq: 'monthly' },
  { path: '/values/', priority: '0.5', changefreq: 'monthly' },
  { path: '/roadmap/', priority: '0.6', changefreq: 'monthly' },
  { path: '/theme-demo/', priority: '0.3', changefreq: 'monthly' },
];

// Generate XML sitemap
const generateSitemap = (routes) => {
  const urlEntries = routes.map((route) => {
    const loc = `${baseUrl}${route.path}`;
    let entry = `  <url>\n    <loc>${escapeXml(loc)}</loc>\n`;
    
    if (route.lastmod) {
      // Format date as ISO 8601 (YYYY-MM-DDThh:mm:ssZ)
      const lastmod = new Date(route.lastmod).toISOString();
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
  const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  const articleRoutes = await loadArticleSitemapRoutes({ apiBaseUrl });
  const allRoutes = [...STATIC_ROUTES, ...articleRoutes];
  const sitemapPath = path.join(distDir, 'sitemap.xml');
  const articlesSitemapPath = path.join(distDir, 'sitemap_articles.xml');

  await fs.mkdir(distDir, { recursive: true });
  await Promise.all([
    fs.writeFile(sitemapPath, generateSitemap(allRoutes), 'utf8'),
    fs.writeFile(articlesSitemapPath, generateSitemap(articleRoutes), 'utf8'),
  ]);

  console.log(`Generated sitemap with ${allRoutes.length} URLs -> ${path.relative(rootDir, sitemapPath)}`);
  console.log(`Generated articles sitemap with ${articleRoutes.length} URLs -> ${path.relative(rootDir, articlesSitemapPath)}`);
};

generateSitemapFile()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Sitemap generation failed:', err);
    process.exit(1);
  });
