import React from 'react';
import { ArticleLayout, retrievalPracticeArticle } from '@/features/blog';
import { Seo } from '@/features/seo';
import { buildArticleSeoConfig } from '@/features/blog/seo';

const BlogArticleTemplatePage: React.FC = () => {
  const article = retrievalPracticeArticle;
  const seoConfig = buildArticleSeoConfig(article);

  return (
    <>
      <Seo {...seoConfig} />
      <ArticleLayout article={article} />
    </>
  );
};

export default BlogArticleTemplatePage;
