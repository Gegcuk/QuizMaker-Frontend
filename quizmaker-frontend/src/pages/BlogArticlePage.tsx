import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  PageContainer,
} from '@/components';
import Spinner from '@/components/ui/Spinner';
import SafeContent from '@/components/common/SafeContent';
import { Seo } from '@/features/seo';
import { useAuth } from '@/features/auth';
import { articleService } from '@/features/blog';
import { mediaService } from '@/features/media';
import type { ArticleCtaDto, ArticleDto } from '@/features/blog/types';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const HERO_IMAGE_CDN_BASE = 'https://cdn.quizzence.com/articles';

const buildHeroImageCandidates = (articleId?: string, assetId?: string): string[] => {
  if (!articleId || !assetId) return [];
  const base = `${HERO_IMAGE_CDN_BASE}/${articleId}/${assetId}`;
  return [`${base}.jpg`, `${base}.jpeg`, `${base}.png`, `${base}.webp`];
};

const BlogArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [heroImageCandidates, setHeroImageCandidates] = useState<string[]>([]);
  const [heroImageCandidateIndex, setHeroImageCandidateIndex] = useState<number>(-1);

  const isAdmin = useMemo(
    () => user?.roles?.some(role => ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_MODERATOR'].includes(role)),
    [user?.roles]
  );

  const normalizedSlug = (slug || '').trim();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['articles', 'public', 'slug', normalizedSlug, isAdmin],
    enabled: !!normalizedSlug,
    queryFn: async () => {
      const articleData = isAdmin
        ? await articleService.getAdminBySlug(normalizedSlug, true)
        : await articleService.getBySlug(normalizedSlug);
      return articleData;
    },
  });

  useEffect(() => {
    let isActive = true;

    const heroImage = article?.heroImage;
    const directUrl = (heroImage?.url || '').trim();

    if (!heroImage) {
      setHeroImageCandidates([]);
      setHeroImageCandidateIndex(-1);
      return () => {
        isActive = false;
      };
    }

    if (directUrl) {
      setHeroImageCandidates([directUrl]);
      setHeroImageCandidateIndex(0);
      return () => {
        isActive = false;
      };
    }

    const fallbackCandidates = buildHeroImageCandidates(article?.id, heroImage.assetId);
    setHeroImageCandidates(fallbackCandidates);
    setHeroImageCandidateIndex(fallbackCandidates.length ? 0 : -1);

    if (!heroImage.assetId || !user) {
      return () => {
        isActive = false;
      };
    }

    const loadHeroImage = async () => {
      try {
        const { items } = await mediaService.searchAssets({
          type: 'IMAGE',
          query: heroImage.assetId,
          limit: 5,
        });
        if (!isActive) return;
        const match = items.find((item) => item.assetId === heroImage.assetId);
        if (!match?.cdnUrl) {
          return;
        }
        setHeroImageCandidates((prev) => {
          if (prev[0] === match.cdnUrl) return prev;
          const next = [match.cdnUrl, ...prev.filter((url) => url !== match.cdnUrl)];
          return next;
        });
        setHeroImageCandidateIndex(0);
      } catch {
        if (!isActive) return;
      }
    };

    loadHeroImage();

    return () => {
      isActive = false;
    };
  }, [article?.id, article?.heroImage?.assetId, article?.heroImage?.url, user]);

  const heroImageSrc =
    heroImageCandidateIndex >= 0 ? heroImageCandidates[heroImageCandidateIndex] ?? null : null;

  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: 'Home', path: '/' },
      { label: 'Blog', path: '/blog/' },
    ];
    if (article?.title && article?.slug) {
      items.push({ label: article.title, path: `/blog/${article.slug}/`, isCurrent: true });
      return items;
    }
    if (normalizedSlug) {
      items.push({ label: 'Article', path: `/blog/${normalizedSlug}/`, isCurrent: true });
    }
    return items;
  }, [article?.slug, article?.title, normalizedSlug]);

  const handleCta = (cta?: ArticleCtaDto) => {
    if (!cta?.href) return;
    const href = cta.href.trim();
    if (!href) return;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.location.assign(href);
      return;
    }
    navigate(href);
  };

  if (!normalizedSlug) {
    return (
      <PageContainer title="Blog" subtitle="Article not found" showHeader>
        <Alert type="error" className="text-sm">
          Missing article slug.
        </Alert>
      </PageContainer>
    );
  }

  const seoConfig = article
    ? {
        title: `${article.title} | Quizzence`,
        description: article.description,
        canonicalPath: `/blog/${article.slug}/`,
        canonicalUrl: article.canonicalUrl || undefined,
        ogType: 'article' as const,
        ogImage: article.ogImage || undefined,
        noindex: !!article.noindex,
      }
    : null;

  return (
    <>
      {seoConfig && <Seo {...seoConfig} />}
      <div className="bg-theme-bg-secondary min-h-screen">
        <PageContainer
          title={article?.title || 'Blog'}
          showHeader
          showBreadcrumb
          hideTitle
          customBreadcrumbItems={breadcrumbItems}
          containerClassName="py-10"
        >
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-sm text-theme-text-tertiary">
              <Link to="/blog/" className="hover:text-theme-text-primary">
                ← Back to blog
              </Link>
            </div>

            {isLoading && (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            )}

            {!isLoading && error && (
              <Alert type="error" error={error} className="text-sm" />
            )}

            {!isLoading && !error && article && (
              <>
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
                      <span className="inline-flex rounded-full bg-theme-bg-tertiary px-2 py-0.5 text-xs text-theme-text-secondary">
                        {article.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {article.heroImage && heroImageSrc && (
                      <div className="w-full">
                        <img
                          src={heroImageSrc}
                          alt={article.heroImage.alt}
                          className="w-full h-auto rounded-lg border border-theme-border-primary"
                          onError={() => {
                            setHeroImageCandidateIndex((prev) => {
                              const nextIndex = prev + 1;
                              return nextIndex < heroImageCandidates.length ? nextIndex : -1;
                            });
                          }}
                        />
                        {article.heroImage.caption && (
                          <p className="mt-2 text-sm text-theme-text-tertiary italic text-center">
                            {article.heroImage.caption}
                          </p>
                        )}
                      </div>
                    )}
                    <h1 className="text-4xl md:text-5xl font-extrabold text-theme-text-primary leading-tight">
                      {article.title}
                    </h1>
                    <p className="text-lg text-theme-text-secondary leading-relaxed max-w-3xl">
                      {article.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(article.tags || []).map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-sm text-theme-text-tertiary">
                      By {article.author?.name} — {article.author?.title}
                    </div>
                    <div className="flex flex-wrap gap-2 ml-auto">
                      {article.primaryCta && (
                        <Button size="md" onClick={() => handleCta(article.primaryCta)}>
                          {article.primaryCta.label}
                        </Button>
                      )}
                      {article.secondaryCta && (
                        <Button size="md" variant="outline" onClick={() => handleCta(article.secondaryCta)}>
                          {article.secondaryCta.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </header>

                {(article.stats || []).length > 0 && (
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(article.stats || []).slice(0, 3).map((stat) => (
                      <Card key={stat.label} variant="elevated" padding="md" className="h-full">
                        <CardHeader className="border-none pb-2 mb-0">
                          <p className="text-sm font-semibold uppercase tracking-wide text-theme-text-tertiary">
                            {stat.label}
                          </p>
                        </CardHeader>
                        <CardBody className="space-y-1 article-content">
                          <p className="text-3xl font-bold text-theme-text-primary">{stat.value}</p>
                          {stat.detail && <p className="text-sm text-theme-text-secondary leading-relaxed">{stat.detail}</p>}
                          {stat.link && (
                            <a
                              href={stat.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-theme-interactive-primary hover:text-theme-interactive-primary-hover"
                            >
                              Source
                            </a>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </section>
                )}

                {(article.sections || []).length > 0 && (
                  <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <Card className="lg:col-span-2" padding="lg">
                      <CardHeader>
                        <h2 className="text-2xl font-bold text-theme-text-primary">Summary</h2>
                      </CardHeader>
                      <CardBody className="space-y-4 article-content">
                        <p className="text-theme-text-secondary">{article.excerpt}</p>
                        {(article.keyPoints || []).length > 0 && (
                          <ul className="bullet-list">
                            {(article.keyPoints || []).map((point, idx) => (
                              <li key={`${idx}-${point}`} className="text-theme-text-secondary">
                                {point}
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardBody>
                    </Card>

                    <Card padding="lg" className="lg:col-span-1">
                      <CardHeader>
                        <h3 className="text-xl font-semibold text-theme-text-primary">Table of contents</h3>
                      </CardHeader>
                      <CardBody className="space-y-2 article-content">
                        <ol>
                          {(article.sections || []).map((section) => (
                            <li key={section.sectionId}>
                              <a
                                href={`#${section.sectionId}`}
                                className="text-theme-text-secondary hover:text-theme-text-primary"
                              >
                                {section.title}
                              </a>
                            </li>
                          ))}
                        </ol>
                      </CardBody>
                    </Card>
                  </section>
                )}

                {(article.checklist || []).length > 0 && (
                  <section>
                    <Card padding="lg" className="border-theme-border-primary">
                      <CardHeader>
                        <h3 className="text-xl font-semibold text-theme-text-primary">Checklist</h3>
                      </CardHeader>
                      <CardBody className="space-y-2 article-content">
                        <ul className="bullet-list">
                          {(article.checklist || []).map((item, idx) => (
                            <li key={`${idx}-${item}`} className="text-theme-text-secondary">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardBody>
                    </Card>
                  </section>
                )}

                {(article.sections || []).length > 0 && (
                  <section className="space-y-8">
                    {(article.sections || []).map((section) => (
                      <Card key={section.sectionId} padding="lg" className="anchor-target" id={section.sectionId}>
                        <CardHeader>
                          <h3 className="text-2xl font-semibold text-theme-text-primary">{section.title}</h3>
                          {section.summary && <p className="mt-2 text-theme-text-secondary">{section.summary}</p>}
                        </CardHeader>
                        <CardBody className="space-y-4 text-theme-text-secondary article-content">
                          <SafeContent content={section.content || ''} allowHtml className="article-content" />
                        </CardBody>
                      </Card>
                    ))}
                  </section>
                )}

                {(article.references || []).length > 0 && (
                  <section>
                    <Card padding="lg">
                      <CardHeader>
                        <h3 className="text-xl font-semibold text-theme-text-primary">References</h3>
                      </CardHeader>
                      <CardBody className="space-y-3 article-content">
                        <ul className="space-y-2 text-theme-text-secondary">
                          {(article.references || []).map((ref) => (
                            <li key={ref.url}>
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-theme-interactive-primary hover:text-theme-interactive-primary-hover"
                              >
                                {ref.title}
                              </a>
                              {ref.sourceType && (
                                <span className="ml-2 text-theme-text-tertiary text-sm">({ref.sourceType})</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </CardBody>
                    </Card>
                  </section>
                )}

                {(article.faqs || []).length > 0 && (
                  <section>
                    <Card padding="lg">
                      <CardHeader>
                        <h3 className="text-xl font-semibold text-theme-text-primary">FAQs</h3>
                      </CardHeader>
                      <CardBody className="space-y-3 article-content">
                        <div className="divide-y divide-theme-border-primary">
                          {(article.faqs || []).map((faq) => (
                            <div key={faq.question} className="py-3">
                              <p className="font-semibold text-theme-text-primary">{faq.question}</p>
                              {faq.answer && <p className="mt-2 text-theme-text-secondary">{faq.answer}</p>}
                            </div>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  </section>
                )}
              </>
            )}
          </div>
        </PageContainer>
      </div>
    </>
  );
};

export default BlogArticlePage;
