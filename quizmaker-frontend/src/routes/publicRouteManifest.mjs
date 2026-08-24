const freezeRoute = (route) => Object.freeze({
  ...route,
  sitemap: route.sitemap && route.sitemap !== 'dynamic'
    ? Object.freeze({ ...route.sitemap })
    : route.sitemap,
  parameterPatterns: route.parameterPatterns
    ? Object.freeze({ ...route.parameterPatterns })
    : undefined,
});

export const publicRouteManifest = Object.freeze([
  {
    id: 'home',
    path: '/',
    delivery: 'prerender',
    indexable: true,
    trailingSlash: 'none',
    sitemap: { priority: '1.0', changefreq: 'weekly' },
  },
  {
    id: 'login',
    path: '/login',
    delivery: 'spa',
    indexable: false,
    trailingSlash: 'both',
    sitemap: false,
  },
  {
    id: 'register',
    path: '/register',
    delivery: 'spa',
    indexable: false,
    trailingSlash: 'both',
    sitemap: false,
  },
  {
    id: 'forgotPassword',
    path: '/forgot-password',
    delivery: 'spa',
    indexable: false,
    trailingSlash: 'both',
    sitemap: false,
  },
  {
    id: 'resetPassword',
    path: '/reset-password',
    delivery: 'spa',
    indexable: false,
    trailingSlash: 'both',
    sitemap: false,
  },
  {
    id: 'verifyEmail',
    path: '/verify-email',
    delivery: 'spa',
    indexable: false,
    trailingSlash: 'both',
    sitemap: false,
  },
  {
    id: 'oauthCallback',
    path: '/oauth/callback',
    delivery: 'callback',
    indexable: false,
    trailingSlash: 'both',
    sitemap: false,
  },
  {
    id: 'oauth2Redirect',
    path: '/oauth2/redirect',
    delivery: 'callback',
    indexable: false,
    trailingSlash: 'both',
    sitemap: false,
  },
  {
    id: 'themeDemo',
    path: '/theme-demo',
    delivery: 'spa',
    indexable: false,
    trailingSlash: 'both',
    sitemap: false,
  },
  {
    id: 'terms',
    path: '/terms/',
    delivery: 'prerender',
    indexable: true,
    trailingSlash: 'canonical',
    sitemap: { priority: '0.4', changefreq: 'monthly' },
  },
  {
    id: 'privacy',
    path: '/privacy/',
    delivery: 'prerender',
    indexable: true,
    trailingSlash: 'canonical',
    sitemap: { priority: '0.4', changefreq: 'monthly' },
  },
  {
    id: 'faq',
    path: '/faq/',
    delivery: 'prerender',
    indexable: true,
    trailingSlash: 'canonical',
    sitemap: { priority: '0.5', changefreq: 'monthly' },
  },
  {
    id: 'values',
    path: '/values/',
    delivery: 'prerender',
    indexable: true,
    trailingSlash: 'canonical',
    sitemap: { priority: '0.5', changefreq: 'monthly' },
  },
  {
    id: 'roadmap',
    path: '/roadmap/',
    delivery: 'prerender',
    indexable: true,
    trailingSlash: 'canonical',
    sitemap: { priority: '0.6', changefreq: 'monthly' },
  },
  {
    id: 'blogIndex',
    path: '/blog/',
    delivery: 'prerender',
    indexable: true,
    trailingSlash: 'canonical',
    sitemap: { priority: '0.8', changefreq: 'weekly' },
  },
  {
    id: 'blogTemplate',
    path: '/blog/retrieval-practice-template/',
    delivery: 'prerender',
    indexable: true,
    trailingSlash: 'canonical',
    sitemap: { priority: '0.8', changefreq: 'weekly' },
  },
  {
    id: 'blogArticle',
    path: '/blog/:slug/',
    delivery: 'dynamic-prerender',
    indexable: true,
    trailingSlash: 'canonical',
    sitemap: 'dynamic',
  },
  {
    id: 'notFound',
    path: '/__not-found',
    delivery: 'error-page',
    indexable: false,
    trailingSlash: 'none',
    sitemap: false,
    router: false,
  },
  {
    id: 'sitemap',
    path: '/sitemap.xml',
    delivery: 'static-file',
    indexable: false,
    trailingSlash: 'none',
    sitemap: false,
    router: false,
  },
  {
    id: 'articleSitemap',
    path: '/sitemap_articles.xml',
    delivery: 'static-file',
    indexable: false,
    trailingSlash: 'none',
    sitemap: false,
  },
].map(freezeRoute));

export const getPublicRoute = (id) => {
  const route = publicRouteManifest.find((candidate) => candidate.id === id);
  if (!route) {
    throw new Error(`Unknown public route id: ${id}`);
  }
  return route;
};

export const getPublicRouteSeoPolicy = (id) => {
  const route = getPublicRoute(id);
  return Object.freeze({
    canonicalPath: route.path,
    noindex: !route.indexable,
  });
};

export const getAlternatePublicRoutePath = (route) => {
  if (route.trailingSlash === 'none' || route.path === '/') {
    return undefined;
  }
  return route.path.endsWith('/') ? route.path.slice(0, -1) : `${route.path}/`;
};

export const resolvePublicRoutePath = (pathTemplate, params = {}) =>
  pathTemplate.replace(/:([A-Za-z0-9_]+)/g, (_match, parameterName) => {
    const value = params[parameterName];
    if (typeof value !== 'string' || value.length === 0) {
      throw new Error(`Missing public route parameter: ${parameterName}`);
    }
    return encodeURIComponent(value);
  });

export const staticPrerenderRoutes = Object.freeze(
  publicRouteManifest.filter((route) => route.delivery === 'prerender'),
);

export const staticSitemapRoutes = Object.freeze(
  publicRouteManifest
    .filter((route) => route.sitemap && route.sitemap !== 'dynamic')
    .map((route) => Object.freeze({ path: route.path, ...route.sitemap })),
);
