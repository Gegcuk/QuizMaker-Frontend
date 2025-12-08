import React from 'react';
import { ArticleLayout, retrievalPracticeArticle } from '@/features/blog';
import { Seo, SITE_URL } from '@/features/seo';

const BlogArticleTemplatePage: React.FC = () => {
  const article = retrievalPracticeArticle;
  const canonicalPath = `/blog/${article.slug}`;
  const canonicalUrl = `${SITE_URL.replace(/\/$/, '')}${canonicalPath}`;

  const articleSchema = {
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

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 2, name: article.title, item: canonicalUrl },
    ],
  };

  const faqSchema = {
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

  return (
    <>
      <Seo
        title={`${article.title} | Quizzence`}
        description={article.description}
        canonicalPath={canonicalPath}
        ogType="article"
        structuredData={[articleSchema, breadcrumbSchema, faqSchema]}
      />
      <ArticleLayout article={article} />
    </>
  );
};

export default BlogArticleTemplatePage;
