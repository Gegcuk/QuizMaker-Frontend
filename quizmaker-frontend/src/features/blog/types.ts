import { ReactNode } from 'react';
import { AnalyticsEventName } from '@/features/analytics';

export interface ArticleCTA {
  label: string;
  href: string;
  eventName?: AnalyticsEventName;
}

export interface ArticleStat {
  label: string;
  value: string;
  detail: string;
  link?: string;
}

export interface ArticleSection {
  id: string;
  title: string;
  summary?: string;
  content: ReactNode;
}

export interface ArticleFAQ {
  question: string;
  answer: string;
}

export interface ArticleReference {
  title: string;
  url: string;
  sourceType?: string;
}

export interface ArticleData {
  slug: string;
  title: string;
  description: string;
  heroKicker?: string;
  author: { name: string; title: string };
  publishedAt: string;
  updatedAt?: string;
  readingTime: string;
  tags: string[];
  stats: ArticleStat[];
  keyPoints: string[];
  sections: ArticleSection[];
  faqs: ArticleFAQ[];
  checklist?: string[];
  primaryCta?: ArticleCTA;
  secondaryCta?: ArticleCTA;
  references?: ArticleReference[];
}

/* ---------------------------------------------------------------------- */
/*  API-facing article types (no React nodes)                             */
/* ---------------------------------------------------------------------- */

// Backend enum is serialized as uppercase strings.
export type ArticleStatus = 'DRAFT' | 'PUBLISHED';

export interface ArticleAuthorDto {
  name: string;
  title: string;
}

export interface ArticleImageDto {
  assetId: string;
  alt: string;
  caption?: string;
  url?: string; // CDN URL - may be included by backend when serializing
}

export interface ArticleCtaDto {
  label: string;
  href: string;
  eventName?: string;
}

export interface ArticleStatDto {
  label: string;
  value: string;
  detail: string;
  link?: string;
}

export interface ArticleSectionDto {
  sectionId: string;
  title: string;
  summary?: string;
  content?: string; // HTML or Markdown rendered to HTML server-side
}

export interface ArticleFaqDto {
  question: string;
  answer: string;
}

export interface ArticleReferenceDto {
  title: string;
  url: string;
  sourceType?: string;
}

export interface ArticleDto {
  id?: string;
  revision?: number;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  heroKicker?: string;
  heroImage?: ArticleImageDto;
  tags: string[];
  author: ArticleAuthorDto;
  readingTime: string;
  publishedAt: string;
  updatedAt?: string;
  status: ArticleStatus;
  canonicalUrl?: string;
  ogImage?: string;
  noindex?: boolean;
  contentGroup?: string;
  primaryCta?: ArticleCtaDto;
  secondaryCta?: ArticleCtaDto;
  stats?: ArticleStatDto[];
  keyPoints?: string[];
  checklist?: string[];
  sections?: ArticleSectionDto[];
  faqs?: ArticleFaqDto[];
  references?: ArticleReferenceDto[];
}

// Payloads for create/update (admin)
export interface ArticleUpsertPayload {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  heroKicker?: string;
  heroImage?: ArticleImageDto;
  tags: string[];
  author: ArticleAuthorDto;
  readingTime: string;
  publishedAt: string;
  updatedAt?: string;
  status: ArticleStatus;
  canonicalUrl?: string;
  ogImage?: string;
  noindex?: boolean;
  contentGroup?: string;
  primaryCta?: ArticleCtaDto;
  secondaryCta?: ArticleCtaDto;
  stats?: ArticleStatDto[];
  keyPoints?: string[];
  checklist?: string[];
  sections?: ArticleSectionDto[];
  faqs?: ArticleFaqDto[];
  references?: ArticleReferenceDto[];
}

export interface ArticleListResponse {
  items: ArticleDto[];
  total: number;
  limit: number;
  offset: number;
}

// Article endpoints return the DTO directly (not wrapped).
export type ArticleResponse = ArticleDto;

export interface ArticleSitemapEntry {
  url: string;
  updatedAt?: string;
  changefreq?: string;
  priority?: number;
}

export interface ArticleTagSummary {
  tag: string;
  count: number;
}
