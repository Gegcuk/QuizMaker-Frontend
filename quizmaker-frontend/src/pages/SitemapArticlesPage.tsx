// src/pages/SitemapArticlesPage.tsx
// ---------------------------------------------------------------------------
// Dynamic sitemap for blog articles
// Fetches articles from backend API and generates XML sitemap
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { articleService } from '@/features/blog/services/articleService';
import { ArticleSitemapEntry } from '@/features/blog/types';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://www.quizzence.com';
const baseUrl = SITE_URL.replace(/\/$/, '');

// Normalize blog URLs to match canonical format (with trailing slash)
const normalizeBlogUrl = (url: string): string => {
  // Extract slug from URL (handles both /blog/slug and /blog/slug/)
  const match = url.match(/\/blog\/([^/]+)/);
  if (match) {
    return `/blog/${match[1]}/`; // Always add trailing slash
  }
  return url; // Return as-is for non-blog URLs
};

// Escape XML special characters
const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Generate XML sitemap from entries
const generateSitemapXml = (entries: ArticleSitemapEntry[]): string => {
  // Normalize and filter blog URLs
  const routes = entries
    .map((entry) => ({
      url: normalizeBlogUrl(entry.url),
      priority: entry.priority?.toString() || '0.8',
      changefreq: entry.changefreq || 'weekly',
      lastmod: entry.updatedAt || undefined,
    }))
    .filter((route) => route.url && route.url.includes('/blog/'))
    .filter((route, index, self) => 
      self.findIndex((r) => r.url === route.url) === index
    ); // Remove duplicates

  const urlEntries = routes.map((route) => {
    const loc = `${baseUrl}${route.url}`;
    let entry = `  <url>\n    <loc>${escapeXml(loc)}</loc>\n`;
    
    if (route.lastmod) {
      // Format date as ISO 8601
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

const SitemapArticlesPage: React.FC = () => {
  const [xmlContent, setXmlContent] = useState<string>('');

  useEffect(() => {
    // Fetch sitemap data from backend API
    articleService.getSitemap()
      .then((entries: ArticleSitemapEntry[]) => {
        setXmlContent(generateSitemapXml(entries));
        document.title = 'Articles Sitemap';
      })
      .catch((error) => {
        console.error('Failed to fetch article sitemap:', error);
        // Return empty sitemap on error
        const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
        setXmlContent(emptySitemap);
      });
  }, []);

  // Production serves this URL directly as application/xml. This fallback keeps
  // the app shell intact in development when Vite handles the route.
  if (xmlContent) {
    return (
      <pre aria-label="Articles sitemap" className="whitespace-pre-wrap font-mono">
        {xmlContent}
      </pre>
    );
  }

  return <div>Loading sitemap...</div>;
};

export default SitemapArticlesPage;
