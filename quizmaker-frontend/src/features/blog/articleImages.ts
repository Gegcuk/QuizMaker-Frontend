import type { ArticleImageDto } from './types';

export interface ArticlePresentationImage {
  url: string;
  width?: number;
  height?: number;
  mimeType?: string;
  alt?: string;
  caption?: string;
}

export const ARTICLE_FALLBACK_IMAGE: Readonly<ArticlePresentationImage> = Object.freeze({
  url: 'https://cdn.quizzence.com/library/aec804f3-e4b3-430a-ba3e-109e819b3c56.png',
  width: 1792,
  height: 592,
  mimeType: 'image/png',
  alt: 'Illustration of a document turning into quiz questions and a study plan',
});

interface ArticleImageInput {
  heroImage?: ArticleImageDto | null;
  ogImage?: string | null;
}

const publicImageUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      return undefined;
    }
    return url.href;
  } catch {
    return undefined;
  }
};

const dimension = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined;

export const getArticleHeroImage = (article: ArticleImageInput): ArticlePresentationImage => {
  const hero = article.heroImage;
  const rendition = hero?.rendition;
  const url = publicImageUrl(rendition?.url);
  if (!url || typeof rendition?.mimeType !== 'string' || !/^image\/[a-z0-9.+-]+$/i.test(rendition.mimeType)) {
    return ARTICLE_FALLBACK_IMAGE;
  }

  return {
    url,
    width: dimension(rendition.width),
    height: dimension(rendition.height),
    mimeType: rendition.mimeType,
    alt: typeof hero?.alt === 'string' ? hero.alt : undefined,
    caption: typeof hero?.caption === 'string' ? hero.caption : undefined,
  };
};

export const getArticleSocialImage = (
  article: ArticleImageInput,
  heroImage: ArticlePresentationImage | null = getArticleHeroImage(article),
): ArticlePresentationImage | undefined => {
  const explicitUrl = publicImageUrl(article.ogImage);
  const documentedHero = getArticleHeroImage(article);

  if (explicitUrl) {
    // If the explicit URL is also the failed hero, follow its fallback instead.
    if (explicitUrl === documentedHero.url && heroImage?.url !== documentedHero.url) {
      return heroImage ?? undefined;
    }
    // A failed hero (or failed placeholder) must not survive as the same social image.
    if (!heroImage && [documentedHero.url, ARTICLE_FALLBACK_IMAGE.url].includes(explicitUrl)) {
      return undefined;
    }
    const matchingImage = [heroImage, documentedHero, ARTICLE_FALLBACK_IMAGE]
      .find((image) => image?.url === explicitUrl);
    return matchingImage ?? { url: explicitUrl };
  }

  return heroImage ?? undefined;
};
