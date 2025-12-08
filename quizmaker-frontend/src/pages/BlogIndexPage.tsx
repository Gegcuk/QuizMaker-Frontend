import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, CardBody, CardHeader, PageContainer } from '@/components';
import { retrievalPracticeArticle } from '@/features/blog';
import { Seo } from '@/features/seo';

const posts = [retrievalPracticeArticle];

const BlogIndexPage: React.FC = () => {
  return (
    <>
      <Seo
        title="Learning Science Blog | Quizzence"
        description="Research-backed articles on retrieval practice, pre-testing, and quiz design that convert readers into engaged learners."
        canonicalPath="/blog"
        ogType="website"
      />
      <PageContainer
        title="Learning science blog"
        subtitle="Evidence-based playbooks for quizzes, teaching, and student engagement."
        showHeader
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {posts.map((post) => (
            <Card key={post.slug} padding="lg" hoverable>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-theme-text-tertiary">
                  <span>{new Date(post.updatedAt || post.publishedAt).toLocaleDateString()}</span>
                  <span>• {post.readingTime}</span>
                </div>
                <h2 className="text-2xl font-semibold text-theme-text-primary">{post.title}</h2>
                <p className="text-theme-text-secondary">{post.description}</p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardBody className="flex flex-wrap items-center gap-3">
                <Link to={`/blog/${post.slug}`}>
                  <Button>Read article</Button>
                </Link>
                {post.secondaryCta && (
                  <Link to={post.secondaryCta.href}>
                    <Button variant="ghost">{post.secondaryCta.label}</Button>
                  </Link>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      </PageContainer>
    </>
  );
};

export default BlogIndexPage;
