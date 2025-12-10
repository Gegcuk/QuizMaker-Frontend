import type { ArticleData } from './types';
import { SITE_URL } from '@/features/seo';
import type { SeoConfig, StructuredData } from '@/features/seo';

const getBaseSiteUrl = (): string => SITE_URL.replace(/\/$/, '');

export const getArticleCanonicalPath = (article: ArticleData): string =>
  `/blog/${article.slug}`;

export const getArticleCanonicalUrl = (article: ArticleData): string => {
  const baseUrl = getBaseSiteUrl();
  return `${baseUrl}${getArticleCanonicalPath(article)}`;
};

export const buildArticleStructuredData = (article: ArticleData): StructuredData[] => {
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
      { '@type': 'ListItem', position: 1, name: 'Blog', item: `${baseSiteUrl}/blog` },
      { '@type': 'ListItem', position: 2, name: article.title, item: canonicalUrl },
    ],
  };

  const faqSchema: StructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: article.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return [articleSchema, breadcrumbSchema, faqSchema];
};

export const buildArticleSeoConfig = (article: ArticleData): SeoConfig => ({
  title: `${article.title} | Quizzence`,
  description: article.description,
  canonicalPath: getArticleCanonicalPath(article),
  ogType: 'article',
  structuredData: buildArticleStructuredData(article),
});

