import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import type { BreadcrumbItem } from '@/components/layout/PageHeader';
import Spinner from '@/components/ui/Spinner';
import SafeContent from '@/components/common/SafeContent';
import { Seo } from '@/features/seo';
import { useAuth } from '@/features/auth';
import { articleService, buildArticleSeoConfig } from '@/features/blog';
import { mediaService } from '@/features/media';
import type { ArticleCtaDto, ArticleDto } from '@/features/blog/types';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

const HERO_IMAGE_CDN_BASE = 'https://cdn.quizzence.com/articles';
const LIBRARY_CDN_BASE = 'https://cdn.quizzence.com/library';

// Common image extensions in order of likelihood
const IMAGE_EXTENSIONS = ['jpg', 'png', 'jpeg', 'webp'];

const buildHeroImageCandidates = (articleId?: string, assetId?: string): string[] => {
  if (!assetId) return [];
  
  const candidates: string[] = [];
  
  // Priority 1: Library CDN URLs (work in production for logged-out users)
  // Format: https://cdn.quizzence.com/library/{assetId}.{ext}
  // Try most common extensions first to reduce flickering
  for (const ext of IMAGE_EXTENSIONS) {
    candidates.push(`${LIBRARY_CDN_BASE}/${assetId}.${ext}`);
  }
  
  // Priority 2: Article-specific CDN URLs (may work in some environments)
  // Format: https://cdn.quizzence.com/articles/{articleId}/{assetId}.{ext}
  if (articleId) {
    const base = `${HERO_IMAGE_CDN_BASE}/${articleId}/${assetId}`;
    for (const ext of IMAGE_EXTENSIONS) {
      candidates.push(`${base}.${ext}`);
    }
  }
  
  return candidates;
};

const BlogArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [heroImageSrc, setHeroImageSrc] = useState<string | null>(null);
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());

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

  // Preload image to find working URL without flickering
  useEffect(() => {
    let isActive = true;
    let preloadImage: HTMLImageElement | null = null;

    const heroImage = article?.heroImage;

    if (!heroImage?.assetId) {
      setHeroImageSrc(null);
      return () => {
        isActive = false;
        if (preloadImage) {
          preloadImage.onload = null;
          preloadImage.onerror = null;
        }
      };
    }

    // Build CDN URL candidates and preload to find working one
    // Note: Backend does NOT provide url field in ArticleImageDto, only assetId
    const candidates = buildHeroImageCandidates(article?.id, heroImage.assetId);

    if (candidates.length === 0) {
      setHeroImageSrc(null);
      return () => {
        isActive = false;
      };
    }

    // Preload strategy: test candidates in order, set src only when one loads successfully
    const testCandidate = (index: number): void => {
      if (!isActive || index >= candidates.length) {
        return;
      }

      const url = candidates[index];
      preloadImage = new Image();
      
      preloadImage.onload = () => {
        if (!isActive) return;
        setHeroImageSrc(url);
        preloadImage = null;
      };

      preloadImage.onerror = () => {
        if (!isActive) return;
        // Try next candidate
        testCandidate(index + 1);
      };

      preloadImage.src = url;
    };

    // Start testing from first candidate
    testCandidate(0);

    // Priority: Try to fetch CDN URL via searchAssets if user is logged in (requires auth)
    // This can override the preload if it finds a URL faster
    if (user) {
      const loadHeroImage = async () => {
        try {
          const { items } = await mediaService.searchAssets({
            type: 'IMAGE',
            query: heroImage.assetId,
            limit: 5,
          });
          if (!isActive) return;
          const match = items.find((item) => item.assetId === heroImage.assetId);
          if (match?.cdnUrl) {
            // Use the authenticated URL immediately if found
            setHeroImageSrc(match.cdnUrl);
          }
        } catch (err) {
          // Silently fail - preload candidates should work
        }
      };

      loadHeroImage();
    }

    return () => {
      isActive = false;
      if (preloadImage) {
        preloadImage.onload = null;
        preloadImage.onerror = null;
        preloadImage = null;
      }
    };
  }, [article?.id, article?.heroImage?.assetId, user]);

  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', path: '/' },
      { label: 'Blog', path: '/blog/' },
    ];
    if (article?.title && article?.slug) {
      items.push({ label: article.title, path: `/blog/${article.slug}/`, isCurrent: true } as BreadcrumbItem);
      return items;
    }
    if (normalizedSlug) {
      items.push({ label: 'Article', path: `/blog/${normalizedSlug}/`, isCurrent: true } as BreadcrumbItem);
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

  const toggleFaq = (faqQuestion: string) => {
    setExpandedFaqs(prev => {
      const next = new Set(prev);
      if (next.has(faqQuestion)) {
        next.delete(faqQuestion);
      } else {
        next.add(faqQuestion);
      }
      return next;
    });
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

  const seoConfig = article ? buildArticleSeoConfig(article) : null;

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
                {isAdmin && article.id && article.slug && (
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/blog?edit=${article.id}&slug=${encodeURIComponent(article.slug)}`)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Article
                    </Button>
                  </div>
                )}
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
                      <CardBody className="space-y-0 article-content">
                        <div className="divide-y divide-theme-border-primary">
                          {(article.faqs || []).map((faq) => {
                            const isExpanded = expandedFaqs.has(faq.question);
                            return (
                              <div key={faq.question} className="py-0">
                                <button
                                  type="button"
                                  onClick={() => toggleFaq(faq.question)}
                                  className="w-full flex items-center justify-between py-3 text-left hover:bg-theme-bg-secondary transition-colors rounded-md px-2 -mx-2"
                                >
                                  <p className="font-semibold text-theme-text-primary pr-4">{faq.question}</p>
                                  <svg
                                    className={`h-5 w-5 text-theme-text-secondary flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                                {isExpanded && faq.answer && (
                                  <div className="pb-3 px-2">
                                    <SafeContent
                                      content={faq.answer}
                                      allowHtml={true}
                                      className="text-theme-text-secondary article-content"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
