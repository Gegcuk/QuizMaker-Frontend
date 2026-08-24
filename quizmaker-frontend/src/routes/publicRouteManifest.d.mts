export type PublicRouteId =
  | 'home'
  | 'login'
  | 'register'
  | 'forgotPassword'
  | 'resetPassword'
  | 'verifyEmail'
  | 'oauthCallback'
  | 'oauth2Redirect'
  | 'themeDemo'
  | 'terms'
  | 'privacy'
  | 'faq'
  | 'values'
  | 'roadmap'
  | 'blogIndex'
  | 'blogTemplate'
  | 'blogArticle'
  | 'notFound'
  | 'sitemap'
  | 'articleSitemap';

export type PublicRouteDelivery =
  | 'prerender'
  | 'dynamic-prerender'
  | 'spa'
  | 'callback'
  | 'error-page'
  | 'static-file';

export type TrailingSlashPolicy = 'canonical' | 'both' | 'none';

export interface SitemapPolicy {
  priority: string;
  changefreq: string;
}

export interface PublicRouteDefinition {
  readonly id: PublicRouteId;
  readonly path: string;
  readonly delivery: PublicRouteDelivery;
  readonly indexable: boolean;
  readonly trailingSlash: TrailingSlashPolicy;
  readonly sitemap: false | 'dynamic' | Readonly<SitemapPolicy>;
  readonly parameterPatterns?: Readonly<Record<string, string>>;
  readonly router?: boolean;
}

export const publicRouteManifest: readonly PublicRouteDefinition[];
export const getPublicRoute: (id: PublicRouteId) => PublicRouteDefinition;
export const getPublicRouteSeoPolicy: (id: PublicRouteId) => Readonly<{
  canonicalPath: string;
  noindex: boolean;
}>;
export const getAlternatePublicRoutePath: (
  route: PublicRouteDefinition,
) => string | undefined;
export const resolvePublicRoutePath: (
  pathTemplate: string,
  params?: Readonly<Record<string, string | undefined>>,
) => string;
export const staticPrerenderRoutes: readonly PublicRouteDefinition[];
export const staticSitemapRoutes: readonly Readonly<{
  path: string;
  priority: string;
  changefreq: string;
}>[];
