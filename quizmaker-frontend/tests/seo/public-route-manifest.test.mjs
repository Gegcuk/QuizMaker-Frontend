import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getAlternatePublicRoutePath,
  getPublicRoute,
  publicRouteManifest,
  staticPrerenderRoutes,
  staticSitemapRoutes,
} from '../../src/routes/publicRouteManifest.mjs';
import { renderPublicRouteNginx } from '../../scripts/public-route-nginx.mjs';

test('public route manifest has coherent SEO and delivery policies', () => {
  const ids = new Set();
  const paths = new Set();

  for (const route of publicRouteManifest) {
    assert.ok(!ids.has(route.id), `Duplicate public route id: ${route.id}`);
    assert.ok(!paths.has(route.path), `Duplicate public route path: ${route.path}`);
    ids.add(route.id);
    paths.add(route.path);

    if (route.indexable) {
      assert.ok(
        route.delivery === 'prerender' || route.delivery === 'dynamic-prerender',
        `Indexable route ${route.path} must be prerendered`,
      );
      assert.ok(route.sitemap, `Indexable route ${route.path} must have a sitemap policy`);
    } else {
      assert.equal(route.sitemap, false, `Noindex route ${route.path} must stay out of sitemaps`);
    }

    if (route.trailingSlash === 'canonical') {
      assert.ok(route.path.endsWith('/'), `Canonical slash route ${route.path} must end in a slash`);
      assert.ok(getAlternatePublicRoutePath(route), `Canonical route ${route.path} must have an alias`);
    }
  }

  assert.deepEqual(
    staticPrerenderRoutes.map((route) => route.path),
    staticSitemapRoutes.map((route) => route.path),
  );
});

test('development-only theme demo stays accessible but is not indexable or prerendered', () => {
  const themeDemo = getPublicRoute('themeDemo');
  assert.equal(themeDemo.delivery, 'spa');
  assert.equal(themeDemo.indexable, false);
  assert.equal(themeDemo.sitemap, false);
  assert.ok(!staticPrerenderRoutes.includes(themeDemo));
});

test('branded not-found content has an internal prerender policy', () => {
  const notFound = getPublicRoute('notFound');
  assert.equal(notFound.delivery, 'error-page');
  assert.equal(notFound.indexable, false);
  assert.equal(notFound.router, false);
});

test('generated Nginx rules serve files directly and never classify index.html as an article', () => {
  const config = renderPublicRouteNginx();

  assert.match(config, /location = \/terms\/ \{[\s\S]*try_files \/terms\/index\.html =404;/);
  assert.match(config, /location = \/terms \{[\s\S]*return 301 https:\/\/\$host\/terms\//);
  assert.match(config, /location = \/blog\/ \{[\s\S]*try_files \/blog\/index\.html =404;/);
  assert.match(config, /location ~ \^\/blog\/\(\[\^\/\]\+\)\/\$/);
  assert.match(config, /try_files \/blog\/\$1\/index\.html =404;/);
  assert.doesNotMatch(config, /try_files \$uri \$uri\//);
  assert.match(config, /location = \/login \{[\s\S]*X-Robots-Tag "noindex, nofollow"/);
});
