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
}
