// src/features/seo/useSeo.tsx
// ---------------------------------------------------------------------------
// Simple head manager for title/meta/canonical + JSON-LD injection.
// Avoids external deps while keeping SPA pages SEO-friendly.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { DEFAULT_LOCALE, GOOGLE_SITE_VERIFICATION, SITE_URL } from './siteMetadata';

export type StructuredData = Record<string, unknown>;

export interface SeoConfig {
  title: string;
  description?: string;
  canonicalPath?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  structuredData?: StructuredData[];
}

const ensureMetaTag = (key: string, value?: string, property = false) => {
  if (!value) return;
  const selector = property ? `meta[property="${key}"]` : `meta[name="${key}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    if (property) {
      tag.setAttribute('property', key);
    } else {
      tag.setAttribute('name', key);
    }
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
};

const ensureLinkTag = (rel: string, href: string) => {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
};

export const useSeo = ({
  title,
  description,
  canonicalPath,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  noindex = false,
  structuredData = [],
}: SeoConfig) => {
  useEffect(() => {
    if (title) {
      document.title = title;
      ensureMetaTag('og:title', title, true);
      ensureMetaTag('twitter:title', title);
    }

    if (description) {
      ensureMetaTag('description', description);
      ensureMetaTag('og:description', description, true);
      ensureMetaTag('twitter:description', description);
    }

    const baseUrl = SITE_URL.replace(/\/$/, '');
    const computedCanonical =
      canonicalUrl ||
      (canonicalPath
        ? `${baseUrl}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`
        : typeof window !== 'undefined'
          ? `${baseUrl}${window.location.pathname}`
          : baseUrl);

    ensureLinkTag('canonical', computedCanonical);
    ensureMetaTag('og:url', computedCanonical, true);
    ensureMetaTag('twitter:url', computedCanonical);
    ensureMetaTag('og:type', ogType, true);
    ensureMetaTag('og:locale', DEFAULT_LOCALE, true);
    ensureMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    if (ogImage) {
      ensureMetaTag('og:image', ogImage, true);
      ensureMetaTag('twitter:image', ogImage);
      ensureMetaTag('twitter:card', 'summary_large_image');
    }

    if (GOOGLE_SITE_VERIFICATION) {
      ensureMetaTag('google-site-verification', GOOGLE_SITE_VERIFICATION);
    }

    const injectedScripts: HTMLScriptElement[] = [];
    structuredData.forEach((entry, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seo = 'structured-data';
      script.dataset.index = index.toString();
      script.text = JSON.stringify(entry);
      document.head.appendChild(script);
      injectedScripts.push(script);
    });

    return () => {
      injectedScripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [title, description, canonicalPath, canonicalUrl, ogImage, ogType, noindex, structuredData]);
};
