# SEO Improvement Plan (Current Quizzence Vite SPA)

## Short diagnosis (current implementation)
- Blog routes use `BlogIndexPage` and `BlogArticlePage` with client-side fetching via `articleService`.
- Metadata is injected at runtime via `useSeo`, so crawlers without JS only see the SPA shell.
- `nginx.conf` serves `index.html` for all routes, so bots hit the shell unless HTML is pre-rendered.
- `scripts/prerender.mjs` exists but only covers a small static list of routes.
- `public/sitemap.xml` is static and does not include dynamic blog articles.

## Goals
- Return full HTML for `/blog/` and `/blog/<slug>/` on first response.
- Serve correct per-article title/meta/OG/Twitter and structured data.
- Keep app/private routes unindexed.
- Do this without switching frameworks.

## Best plan for the current project (no framework change)

### Phase 1: Make blog content crawlable with the existing prerender pipeline
1) Pre-render all blog articles at build time
   - Extend `quizmaker-frontend/scripts/prerender.mjs` to fetch `/api/v1/articles/sitemap`.
   - Add each article route (`/blog/<slug>/`) to the prerender list.
   - Keep the existing static routes (`/`, `/blog/`, `/terms/`, etc.).

2) Make prerender able to reach the API
   - Vite preview does not proxy `/api`, so article fetches fail during prerender.
   - Add an env override in `quizmaker-frontend/src/api/axiosInstance.ts`:
     - Use `import.meta.env.VITE_API_BASE_URL` when set.
   - Set `VITE_API_BASE_URL` in `npm run prerender` or `build:prerender`.

3) Snapshot after content and metadata are ready
   - Replace fixed delays with `page.waitForSelector` on article content.
   - This ensures `useSeo` has inserted `<title>`, meta, and JSON-LD before writing HTML.

4) Ensure structured data is included for real articles
   - `quizmaker-frontend/src/features/blog/seo.ts` already builds `Article`, `BreadcrumbList`, and `FAQPage`.
   - Use `buildArticleSeoConfig(article)` in `BlogArticlePage` so prerendered HTML contains JSON-LD.

5) Generate a real sitemap at build time
   - Replace the static `quizmaker-frontend/public/sitemap.xml` with a generated sitemap in `dist`.
   - Use the same sitemap endpoint to list all blog URLs.
   - `public/robots.txt` already points to `/sitemap.xml`; keep it.

Why this is good
- Uses existing Vite + Playwright prerender pipeline, minimal code changes.
- Produces real HTML and metadata without introducing a new framework.
- Fixes the core issue for Google, Bing, and ChatGPT browsing.

### Phase 2: Index control and polish
6) Noindex app/private routes
   - Keep `robots.txt` disallows, but add `Seo noindex` to private app routes.
   - Optional: add `X-Robots-Tag: noindex` for app routes at the server level.

7) Canonical URL consistency
   - Keep canonical URLs with trailing slash for `/blog/<slug>/`.
   - Add 301 redirects for any non-canonical variants if needed.

8) Media optimization
   - Ensure article hero images have width/height and optimized formats.
   - Provide per-article `ogImage` for sharing.

## Implementation notes (repo-specific)
- Prerender script: `quizmaker-frontend/scripts/prerender.mjs`
- Blog pages: `quizmaker-frontend/src/pages/BlogIndexPage.tsx`, `quizmaker-frontend/src/pages/BlogArticlePage.tsx`
- SEO helpers: `quizmaker-frontend/src/features/seo/useSeo.tsx`, `quizmaker-frontend/src/features/blog/seo.ts`
- API endpoint for sitemap: `/api/v1/articles/sitemap` via `articleService.getSitemap()`
- Static files: `quizmaker-frontend/public/robots.txt`, `quizmaker-frontend/public/sitemap.xml`
- Nginx SPA routing: `quizmaker-frontend/nginx.conf`

## Success checks
- `curl -A "Googlebot" https://www.quizzence.com/blog/<slug>/` returns article HTML and correct title/meta.
- `curl https://www.quizzence.com/blog/` shows a list of post links.
- `view-source` contains JSON-LD on article pages.
- `https://www.quizzence.com/sitemap.xml` contains all blog URLs.
- Search Console and Bing show correct titles/snippets.
