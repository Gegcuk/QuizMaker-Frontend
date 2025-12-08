import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardBody, CardHeader, PageContainer } from '@/components';
import { trackEvent } from '@/features/analytics';
import type { ArticleCTA, ArticleData } from '../types';

interface ArticleLayoutProps {
  article: ArticleData;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const StatCard: React.FC<{ stat: ArticleData['stats'][number] }> = ({ stat }) => (
  <Card variant="elevated" padding="md" className="h-full">
    <CardHeader className="border-none pb-2 mb-0">
      <p className="text-sm font-semibold uppercase tracking-wide text-theme-text-tertiary">{stat.label}</p>
    </CardHeader>
    <CardBody className="space-y-1">
      <p className="text-3xl font-bold text-theme-text-primary">{stat.value}</p>
      <p className="text-sm text-theme-text-secondary leading-relaxed">{stat.detail}</p>
    </CardBody>
  </Card>
);

const ArticleLayout: React.FC<ArticleLayoutProps> = ({ article }) => {
  const navigate = useNavigate();

  const handleCta = (cta?: ArticleCTA) => {
    if (!cta) return;
    if (cta.eventName) {
      trackEvent(cta.eventName, { source: 'blog_article', slug: article.slug });
    }
    if (cta.href.startsWith('http')) {
      window.location.assign(cta.href);
      return;
    }
    navigate(cta.href);
  };

  return (
    <div className="bg-theme-bg-secondary min-h-screen">
      <PageContainer title={article.title} showHeader={false} containerClassName="py-10">
        <div className="max-w-5xl mx-auto space-y-10">
          <header className="bg-theme-bg-primary border border-theme-border-primary rounded-2xl shadow-theme p-8 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              {article.heroKicker && (
                <Badge variant="success" className="uppercase tracking-wide">
                  {article.heroKicker}
                </Badge>
              )}
              <div className="flex items-center gap-3 text-sm text-theme-text-tertiary">
                <span>{formatDate(article.publishedAt)}</span>
                {article.updatedAt && <span>• Updated {formatDate(article.updatedAt)}</span>}
                <span>• {article.readingTime}</span>
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-theme-text-primary leading-tight">
                {article.title}
              </h1>
              <p className="text-lg text-theme-text-secondary leading-relaxed max-w-3xl">
                {article.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {article.primaryCta && (
                <Button size="lg" onClick={() => handleCta(article.primaryCta)}>
                  {article.primaryCta.label}
                </Button>
              )}
              {article.secondaryCta && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleCta(article.secondaryCta)}
                >
                  {article.secondaryCta.label}
                </Button>
              )}
              <div className="text-sm text-theme-text-tertiary">
                By {article.author.name} — {article.author.title}
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {article.stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <Card className="lg:col-span-2" padding="lg">
              <CardHeader>
                <h2 className="text-2xl font-bold text-theme-text-primary">Why this matters</h2>
              </CardHeader>
              <CardBody className="space-y-3">
                <p className="text-theme-text-secondary">
                  Retrieval practice and pre-testing consistently outperform re-reading and passive review.
                  This template turns those findings into a publish-ready article format that also nudges readers
                  toward trying a sample quiz or importing their own content.
                </p>
                <ul className="space-y-2">
                  {article.keyPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-theme-interactive-primary" aria-hidden="true" />
                      <span className="text-theme-text-secondary">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>

            <Card padding="lg" className="lg:col-span-1">
              <CardHeader>
                <h3 className="text-xl font-semibold text-theme-text-primary">Table of contents</h3>
              </CardHeader>
              <CardBody className="space-y-2">
                {article.sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-start gap-2 text-theme-text-secondary hover:text-theme-text-primary"
                  >
                    <span className="text-sm text-theme-text-tertiary">{index + 1}.</span>
                    <span>{section.title}</span>
                  </a>
                ))}
              </CardBody>
            </Card>
          </section>

          {article.checklist && (
            <section>
              <Card padding="lg" className="border-theme-border-primary">
                <CardHeader>
                  <h3 className="text-xl font-semibold text-theme-text-primary">Publishing checklist</h3>
                </CardHeader>
                <CardBody className="grid gap-3 sm:grid-cols-2">
                  {article.checklist.map((item) => (
                    <div key={item} className="flex items-start gap-3 p-3 rounded-lg bg-theme-bg-tertiary">
                      <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-theme-interactive-success text-white text-xs">
                        ✓
                      </span>
                      <p className="text-theme-text-secondary">{item}</p>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </section>
          )}

          <section className="space-y-8">
            {article.sections.map((section) => (
              <Card key={section.id} padding="lg" className="anchor-target" id={section.id}>
                <CardHeader>
                  <h3 className="text-2xl font-semibold text-theme-text-primary">{section.title}</h3>
                  {section.summary && (
                    <p className="mt-2 text-theme-text-secondary">{section.summary}</p>
                  )}
                </CardHeader>
                <CardBody className="space-y-4 text-theme-text-secondary">{section.content}</CardBody>
              </Card>
            ))}
          </section>

          <section>
            <Card padding="lg">
              <CardHeader>
                <h3 className="text-xl font-semibold text-theme-text-primary">FAQs</h3>
              </CardHeader>
              <CardBody className="divide-y divide-theme-border-primary">
                {article.faqs.map((faq) => (
                  <div key={faq.question} className="py-4">
                    <p className="font-semibold text-theme-text-primary">{faq.question}</p>
                    <p className="mt-2 text-theme-text-secondary">{faq.answer}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          </section>
        </div>
      </PageContainer>
    </div>
  );
};

export default ArticleLayout;
