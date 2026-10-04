import { describe, expect, it } from 'vitest';
import { ARTICLE_FALLBACK_IMAGE, getArticleHeroImage, getArticleSocialImage } from './articleImages';
import type { ArticleImageDto } from './types';

const heroImage: ArticleImageDto = {
  assetId: 'public-hero-asset',
  alt: 'Students retrieving facts from memory',
  caption: 'Retrieval practice in class.',
  rendition: {
    url: 'https://images.example.test/published/hero.webp',
    width: 1600,
    height: 900,
    mimeType: 'image/webp',
  },
};

describe('article image selection', () => {
  it('uses the exact published rendition, intrinsic dimensions, alt and caption', () => {
    expect(getArticleHeroImage({ heroImage })).toEqual({
      url: 'https://images.example.test/published/hero.webp',
      width: 1600,
      height: 900,
      mimeType: 'image/webp',
      alt: 'Students retrieving facts from memory',
      caption: 'Retrieval practice in class.',
    });
  });

  it.each([
    { name: 'no hero', article: {} },
    { name: 'null hero', article: { heroImage: null } },
    { name: 'unavailable rendition', article: { heroImage: { ...heroImage, rendition: null } } },
    { name: 'old response without rendition', article: { heroImage: { assetId: 'deleted-asset', alt: 'Old image' } } },
  ])('uses the approved placeholder for $name without borrowing article alt or caption', ({ article }) => {
    expect(getArticleHeroImage(article)).toEqual({
      url: 'https://cdn.quizzence.com/library/aec804f3-e4b3-430a-ba3e-109e819b3c56.png',
      width: 1792,
      height: 592,
      mimeType: 'image/png',
      alt: 'Illustration of a document turning into quiz questions and a study plan',
    });
  });

  it.each(['', '/guessed/path.png', 'not a URL', 'javascript:alert(1)', 'data:image/png;base64,example', 'https://user:password@example.test/hero.png'])(
    'falls back for an invalid public rendition URL: %s',
    (url) => {
      expect(getArticleHeroImage({
        heroImage: { ...heroImage, rendition: { url, width: 1600, height: 900, mimeType: 'image/png' } },
      })).toEqual(ARTICLE_FALLBACK_IMAGE);
    },
  );

  it('rejects a non-image rendition without guessing another asset URL', () => {
    expect(getArticleHeroImage({
      heroImage: { ...heroImage, rendition: { url: 'https://images.example.test/file', width: 1600, height: 900, mimeType: 'text/html' } },
    })).toEqual(ARTICLE_FALLBACK_IMAGE);
  });

  it.each([null, 0, -10, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'omits unavailable or invalid intrinsic dimensions (%s)',
    (size) => {
      expect(getArticleHeroImage({
        heroImage: { ...heroImage, rendition: { url: 'https://images.example.test/hero.webp', width: size, height: size, mimeType: 'image/webp' } },
      })).toMatchObject({ url: 'https://images.example.test/hero.webp', width: undefined, height: undefined });
    },
  );

  it('keeps a valid dimension when the other one is unknown', () => {
    expect(getArticleHeroImage({
      heroImage: { ...heroImage, rendition: { url: 'http://images.example.test/hero.png', width: 1600, height: null, mimeType: 'image/png' } },
    })).toMatchObject({ url: 'http://images.example.test/hero.png', width: 1600, height: undefined });
  });

  it('gives a separate explicit social image priority without borrowing hero dimensions or alt text', () => {
    expect(getArticleSocialImage({ heroImage, ogImage: 'https://images.example.test/social.png' })).toEqual({
      url: 'https://images.example.test/social.png',
    });
  });

  it('uses known metadata when the explicit social image is the hero rendition', () => {
    expect(getArticleSocialImage({ heroImage, ogImage: 'https://images.example.test/published/hero.webp' }))
      .toEqual(getArticleHeroImage({ heroImage }));
  });

  it('uses the hero when the explicit social URL is invalid', () => {
    expect(getArticleSocialImage({ heroImage, ogImage: 'javascript:alert(1)' }))
      .toEqual(getArticleHeroImage({ heroImage }));
  });

  it('uses the supplied placeholder after the documented hero fails', () => {
    expect(getArticleSocialImage({ heroImage }, ARTICLE_FALLBACK_IMAGE)).toEqual(ARTICLE_FALLBACK_IMAGE);
  });

  it('replaces an explicit social URL with the placeholder when it is the same failed hero URL', () => {
    expect(getArticleSocialImage({
      heroImage, ogImage: 'https://images.example.test/published/hero.webp',
    }, ARTICLE_FALLBACK_IMAGE)).toEqual(ARTICLE_FALLBACK_IMAGE);
  });

  it('omits a failed hero or placeholder while keeping an independent explicit social image', () => {
    expect(getArticleSocialImage({ heroImage }, null)).toBeUndefined();
    expect(getArticleSocialImage({ heroImage, ogImage: 'https://images.example.test/published/hero.webp' }, null)).toBeUndefined();
    expect(getArticleSocialImage({ heroImage, ogImage: ARTICLE_FALLBACK_IMAGE.url }, null)).toBeUndefined();
    expect(getArticleSocialImage({ heroImage, ogImage: 'https://images.example.test/social.png' }, null)).toEqual({
      url: 'https://images.example.test/social.png',
    });
  });
});
