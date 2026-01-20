import type { ArticleData, ArticleDto } from './types';
import { SITE_URL } from '@/features/seo';
import type { SeoConfig, StructuredData } from '@/features/seo';

const getBaseSiteUrl = (): string => SITE_URL.replace(/\/$/, '');

// Type guard to check if article has required ArticleData fields
type ArticleInput = ArticleData | ArticleDto;

export const getArticleCanonicalPath = (article: { slug: string }): string =>
  `/blog/${article.slug}/`;

export const getArticleCanonicalUrl = (article: { slug: string }): string => {
  const baseUrl = getBaseSiteUrl();
  return `${baseUrl}${getArticleCanonicalPath(article)}`;
};

export const buildArticleStructuredData = (article: ArticleInput): StructuredData[] => {
  const canonicalUrl = getArticleCanonicalUrl(article);
  const baseSiteUrl = getBaseSiteUrl();

  const articleSchema: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author.name,
    },
    mainEntityOfPage: canonicalUrl,
    articleSection: article.tags,
  };

  const breadcrumbSchema: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Blog', item: `${baseSiteUrl}/blog/` },
      { '@type': 'ListItem', position: 2, name: article.title, item: canonicalUrl },
    ],
  };

  // Handle optional faqs (ArticleDto) vs required faqs (ArticleData)
  const faqs = 'faqs' in article ? (article.faqs || []) : [];
  const schemas: StructuredData[] = [articleSchema, breadcrumbSchema];
  
  // Only add FAQ schema if there are FAQs
  if (faqs.length > 0) {
    const faqSchema: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
    schemas.push(faqSchema);
  }

  return schemas;
};

export const buildArticleSeoConfig = (article: ArticleInput): SeoConfig => {
  // Use article's canonicalUrl only if it's provided and not empty/whitespace
  // Otherwise fall back to auto-generated canonical URL
  let canonicalUrl: string | undefined = undefined;
  if ('canonicalUrl' in article && article.canonicalUrl) {
    const trimmedUrl = article.canonicalUrl.trim();
    // Only use it if it's a valid URL (starts with http:// or https://) and not empty
    if (trimmedUrl && (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://'))) {
      canonicalUrl = trimmedUrl;
    }
    // If canonicalUrl is empty/invalid, fall back to auto-generated canonicalPath
  }
  
  return {
    title: `${article.title} | Quizzence`,
    description: article.description,
    canonicalPath: getArticleCanonicalPath(article),
    canonicalUrl,
    ogType: 'article',
    ogImage: 'ogImage' in article ? (article.ogImage || undefined) : undefined,
    noindex: 'noindex' in article ? !!article.noindex : false,
    structuredData: buildArticleStructuredData(article),
  };
};
