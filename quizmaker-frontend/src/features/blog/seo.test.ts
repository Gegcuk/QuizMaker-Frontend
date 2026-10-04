import { describe, expect, it } from 'vitest';
import { ARTICLE_FALLBACK_IMAGE } from './articleImages';
import { buildArticleSeoConfig, buildArticleStructuredData } from './seo';
import type { ArticleDto } from './types';

const article: ArticleDto = {
  slug: 'practice-retrieval',
  title: 'Practice retrieval',
  description: 'Remember what you learn.',
  excerpt: 'A local article fixture.',
  tags: ['learning'],
  author: { name: 'Quizzence Team', title: 'Learning science' },
  readingTime: '4 min read',
  publishedAt: '2026-01-01T00:00:00Z',
  status: 'PUBLISHED',
  heroImage: {
    assetId: 'hero-asset',
    alt: 'A student recalling the steps of an experiment',
    rendition: { url: 'https://images.example.test/hero.webp', width: 1600, height: 900, mimeType: 'image/webp' },
  },
};

describe('article image SEO', () => {
  it('shares the documented hero URL, dimensions and type between social tags and Article JSON-LD', () => {
    const seo = buildArticleSeoConfig(article);
    expect(seo).toMatchObject({
      ogImage: 'https://images.example.test/hero.webp',
      ogImageWidth: 1600,
      ogImageHeight: 900,
      ogImageType: 'image/webp',
      ogImageAlt: 'A student recalling the steps of an experiment',
    });
    expect(seo.structuredData?.[0].image).toEqual({
      '@type': 'ImageObject',
      url: 'https://images.example.test/hero.webp',
      width: 1600,
      height: 900,
      encodingFormat: 'image/webp',
    });
  });

  it('uses a separate explicit social image consistently without invented dimensions', () => {
    const seo = buildArticleSeoConfig({ ...article, ogImage: 'https://images.example.test/social.png' });
    expect(seo.ogImage).toBe('https://images.example.test/social.png');
    expect(seo.ogImageWidth).toBeUndefined();
    expect(seo.ogImageHeight).toBeUndefined();
    expect(seo.ogImageType).toBeUndefined();
    expect(seo.ogImageAlt).toBeUndefined();
    expect(seo.structuredData?.[0].image).toEqual({
      '@type': 'ImageObject', url: 'https://images.example.test/social.png',
    });
  });

  it('uses the approved placeholder in social metadata and JSON-LD when public media is unavailable', () => {
    const seo = buildArticleSeoConfig({ ...article, heroImage: { assetId: 'deleted-asset', alt: 'Deleted image', rendition: null } });
    expect(seo.ogImage).toBe('https://cdn.quizzence.com/library/aec804f3-e4b3-430a-ba3e-109e819b3c56.png');
    expect(seo.ogImageWidth).toBe(1792);
    expect(seo.ogImageHeight).toBe(592);
    expect(seo.structuredData?.[0].image).toEqual({
      '@type': 'ImageObject',
      url: 'https://cdn.quizzence.com/library/aec804f3-e4b3-430a-ba3e-109e819b3c56.png',
      width: 1792,
      height: 592,
      encodingFormat: 'image/png',
    });
  });

  it('omits unknown dimensions from JSON-LD instead of publishing null or guessed values', () => {
    const seo = buildArticleSeoConfig({
      ...article,
      heroImage: {
        assetId: 'legacy-asset', alt: 'Legacy image',
        rendition: { url: 'https://images.example.test/legacy.png', width: null, height: null, mimeType: 'image/png' },
      },
    });
    expect(seo.structuredData?.[0].image).toEqual({
      '@type': 'ImageObject', url: 'https://images.example.test/legacy.png', encodingFormat: 'image/png',
    });
    expect(seo.ogImageWidth).toBeUndefined();
    expect(seo.ogImageHeight).toBeUndefined();
  });

  it('updates JSON-LD with the visible fallback and omits images after both fail', () => {
    const fallbackSeo = buildArticleSeoConfig(article, ARTICLE_FALLBACK_IMAGE);
    expect(fallbackSeo.ogImage).toBe(ARTICLE_FALLBACK_IMAGE.url);
    expect(fallbackSeo.structuredData?.[0].image).toMatchObject({ url: ARTICLE_FALLBACK_IMAGE.url });

    const failedSeo = buildArticleSeoConfig(article, null);
    expect(failedSeo.ogImage).toBeUndefined();
    expect(failedSeo.structuredData?.[0]).not.toHaveProperty('image');
    expect(buildArticleStructuredData(article, null)[0]).not.toHaveProperty('image');
  });

  it('keeps an independent explicit social image if the visual images fail', () => {
    const seo = buildArticleSeoConfig({ ...article, ogImage: 'https://images.example.test/social.jpg' }, null);
    expect(seo.ogImage).toBe('https://images.example.test/social.jpg');
    expect(seo.structuredData?.[0].image).toEqual({
      '@type': 'ImageObject', url: 'https://images.example.test/social.jpg',
    });
  });

  it('preserves canonical paths, canonical overrides, article identity and FAQ data', () => {
    const seo = buildArticleSeoConfig({
      ...article,
      canonicalUrl: 'https://www.quizzence.com/blog/practice-retrieval',
      noindex: true,
      faqs: [{ question: 'How should I practice?', answer: 'Recall before reviewing.' }],
    });
    expect(seo).toMatchObject({
      canonicalPath: '/blog/practice-retrieval/',
      canonicalUrl: 'https://www.quizzence.com/blog/practice-retrieval/',
      title: 'Practice retrieval | Quizzence',
      ogType: 'article',
      noindex: true,
    });
    expect(seo.structuredData?.[0]).toMatchObject({
      headline: 'Practice retrieval',
      mainEntityOfPage: 'https://www.quizzence.com/blog/practice-retrieval/',
    });
    expect(seo.structuredData?.[2]).toMatchObject({
      '@type': 'FAQPage',
      mainEntity: [{ name: 'How should I practice?', acceptedAnswer: { text: 'Recall before reviewing.' } }],
    });
  });
});
