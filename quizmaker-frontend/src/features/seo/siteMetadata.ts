// src/features/seo/siteMetadata.ts
// ---------------------------------------------------------------------------
// Centralised site metadata used for canonical URLs and schema generation.
// ---------------------------------------------------------------------------

export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) || 'https://www.quizzence.com';
export const DEFAULT_LOCALE = 'en';
export const GOOGLE_SITE_VERIFICATION = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION;
