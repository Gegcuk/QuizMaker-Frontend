import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  PageContainer,
  Modal,
  Input,
  Textarea,
  ConfirmationModal,
  Dropdown,
  Switch,
} from '@/components';
import { Seo } from '@/features/seo';
import { articleService } from '@/features/blog';
import {
  ArticleDto,
  ArticleFaqDto,
  ArticleImageDto,
  ArticleReferenceDto,
  ArticleSectionDto,
  ArticleStatDto,
  ArticleStatus,
  ArticleUpsertPayload,
} from '@/features/blog/types';
import { useAuth } from '@/features/auth';
import { mediaService } from '@/features/media';
import { escapeHtmlAttribute, sanitizeUrl } from '@/utils/sanitize';
import Spinner from '@/components/ui/Spinner';

const statusOptions: Array<{ value: ArticleStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Drafts' },
];

const createEmptyPayload = (): ArticleUpsertPayload => ({
  slug: '',
  title: '',
  description: '',
  excerpt: '',
  tags: [],
  author: { name: '', title: '' },
  readingTime: '',
  publishedAt: new Date().toISOString(),
  status: 'DRAFT',
});

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const hasText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const getUniqueSectionId = (
  baseId: string,
  sections: ArticleSectionDto[],
  excludeIndex?: number,
  reservedIds: string[] = []
): string => {
  const normalized = baseId.trim();
  if (!normalized) return '';

  const existingIds = new Set(
    sections
      .map((section, idx) => (idx === excludeIndex ? null : section.sectionId))
      .filter(hasText)
  );
  reservedIds.filter(hasText).forEach((id) => existingIds.add(id));

  if (!existingIds.has(normalized)) {
    return normalized;
  }

  let suffix = 2;
  let candidate = `${normalized}-${suffix}`;
  while (existingIds.has(candidate)) {
    suffix += 1;
    candidate = `${normalized}-${suffix}`;
  }
  return candidate;
};

const splitLines = (value: string): string[] => value.split(/\r\n|\n|\r/);

const normalizeLines = (lines: string[]): string[] =>
  lines
    .map((line) => line.trim())
    .filter(Boolean);

const isExternalUrl = (href: string): boolean => {
  const trimmed = href.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
};

// Helper function to get image dimensions
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

// Helper function to upload an image using the media service
const uploadImage = async (file: File, articleId?: string): Promise<{ assetId: string; cdnUrl: string }> => {
  // Step 1: Get image dimensions (required by backend)
  let width: number | undefined;
  let height: number | undefined;
  
  try {
    const dimensions = await getImageDimensions(file);
    width = dimensions.width;
    height = dimensions.height;
  } catch (error) {
    throw new Error('Failed to read image dimensions. Please ensure the file is a valid image.');
  }

  // Step 2: Create upload intent
  const uploadIntent = await mediaService.createUploadIntent({
    type: 'IMAGE',
    originalFilename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    articleId,
  });

  // Step 3: PUT file to presigned URL
  const response = await fetch(uploadIntent.upload.url, {
    method: uploadIntent.upload.method,
    headers: uploadIntent.upload.headers || {},
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }

  // Step 4: Finalize upload with width and height
  const asset = await mediaService.finalizeUpload(uploadIntent.assetId, {
    width,
    height,
  });

  // Return asset ID and CDN URL
  return { assetId: asset.assetId, cdnUrl: asset.cdnUrl };
};

const BlogIndexPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = useMemo(
    () => user?.roles?.some(role => ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_MODERATOR'].includes(role)),
    [user?.roles]
  );

  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'all'>('PUBLISHED');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [draftPayload, setDraftPayload] = useState<ArticleUpsertPayload>(() => createEmptyPayload());
  const [tagsInput, setTagsInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [articleIdToDelete, setArticleIdToDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editLoadError, setEditLoadError] = useState<unknown>(null);
  const editRequestIdRef = useRef(0);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
  const heroImageInputRef = useRef<HTMLInputElement>(null);
  const [heroImageAlt, setHeroImageAlt] = useState('');
  const [heroImageCaption, setHeroImageCaption] = useState('');
  const sectionsRef = useRef<ArticleSectionDto[]>([]);
  const pendingSectionIdsRef = useRef<Record<number, string>>({});

  const queryClient = useQueryClient();

  useEffect(() => {
    const sections = draftPayload.sections ?? [];
    sectionsRef.current = sections;

    const pending = pendingSectionIdsRef.current;
    const hasPending = Object.keys(pending).length > 0;
    if (!hasPending) {
      return;
    }

    const validIds = new Set(sections.map((section) => section.sectionId));
    const nextPending: Record<number, string> = {};
    for (const [idx, id] of Object.entries(pending)) {
      if (validIds.has(id)) {
        nextPending[Number(idx)] = id;
      }
    }
    pendingSectionIdsRef.current = nextPending;
  }, [draftPayload.sections]);

  const { data, isLoading } = useQuery({
    queryKey: ['articles', statusFilter, isAdmin],
    queryFn: () => {
      const commonParams = {
        page: 0,
        size: 50,
        sort: 'publishedAt,desc',
      };
      if (isAdmin) {
        return articleService.listAdmin({
          ...commonParams,
          status: statusFilter === 'all' ? undefined : statusFilter,
        });
      }
      return articleService.list(commonParams);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: ArticleUpsertPayload) => articleService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setIsModalOpen(false);
      setDraftPayload(createEmptyPayload());
      setTagsInput('');
      setEditingId(null);
      setErrors({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ articleId, payload }: { articleId: string; payload: ArticleUpsertPayload }) =>
      articleService.update(articleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setIsModalOpen(false);
      setDraftPayload(createEmptyPayload());
      setTagsInput('');
      setEditingId(null);
      setErrors({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (articleId: string) => articleService.delete(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setIsDeleteOpen(false);
      setArticleIdToDelete(null);
    },
  });

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearErrorsByPrefix = (prefix: string) => {
    setErrors((prev) => {
      const keys = Object.keys(prev);
      const hasAny = keys.some((k) => k.startsWith(prefix));
      if (!hasAny) {
        return prev;
      }
      const next = { ...prev };
      for (const key of keys) {
        if (key.startsWith(prefix)) {
          delete next[key];
        }
      }
      return next;
    });
  };

  const addStat = () => {
    setDraftPayload((prev) => ({
      ...prev,
      stats: [...(prev.stats ?? []), { label: '', value: '', detail: '' }],
    }));
  };

  const updateStat = (index: number, patch: Partial<ArticleStatDto>) => {
    setDraftPayload((prev) => ({
      ...prev,
      stats: (prev.stats ?? []).map((stat, idx) => (idx === index ? { ...stat, ...patch } : stat)),
    }));
  };

  const removeStat = (index: number) => {
    clearErrorsByPrefix('stats.');
    setDraftPayload((prev) => ({
      ...prev,
      stats: (prev.stats ?? []).filter((_, idx) => idx !== index),
    }));
  };

  const addSection = () => {
    setDraftPayload((prev) => ({
      ...prev,
      sections: [...(prev.sections ?? []), { sectionId: '', title: '', summary: '', content: '' }],
    }));
  };

  const updateSection = (index: number, patch: Partial<ArticleSectionDto> | ((section: ArticleSectionDto) => Partial<ArticleSectionDto>)) => {
    setDraftPayload((prev) => ({
      ...prev,
      sections: (prev.sections ?? []).map((section, idx) => {
        if (idx !== index) return section;
        const patchValue = typeof patch === 'function' ? patch(section) : patch;
        return { ...section, ...patchValue };
      }),
    }));
  };

  const updateSectionById = (
    sectionId: string,
    patch: Partial<ArticleSectionDto> | ((section: ArticleSectionDto) => Partial<ArticleSectionDto>)
  ) => {
    setDraftPayload((prev) => {
      const sections = prev.sections ?? [];
      let didUpdate = false;

      const nextSections = sections.map((section) => {
        if (didUpdate || section.sectionId !== sectionId) return section;
        const patchValue = typeof patch === 'function' ? patch(section) : patch;
        didUpdate = true;
        return { ...section, ...patchValue };
      });

      if (!didUpdate) {
        return prev;
      }

      return { ...prev, sections: nextSections };
    });
  };

  const removeSection = (index: number) => {
    clearErrorsByPrefix('sections.');
    setDraftPayload((prev) => ({
      ...prev,
      sections: (prev.sections ?? []).filter((_, idx) => idx !== index),
    }));
  };

  const addFaq = () => {
    setDraftPayload((prev) => ({
      ...prev,
      faqs: [...(prev.faqs ?? []), { question: '', answer: '' }],
    }));
  };

  const updateFaq = (index: number, patch: Partial<ArticleFaqDto>) => {
    setDraftPayload((prev) => ({
      ...prev,
      faqs: (prev.faqs ?? []).map((faq, idx) => (idx === index ? { ...faq, ...patch } : faq)),
    }));
  };

  const removeFaq = (index: number) => {
    clearErrorsByPrefix('faqs.');
    setDraftPayload((prev) => ({
      ...prev,
      faqs: (prev.faqs ?? []).filter((_, idx) => idx !== index),
    }));
  };

  const addReference = () => {
    setDraftPayload((prev) => ({
      ...prev,
      references: [...(prev.references ?? []), { title: '', url: '' }],
    }));
  };

  const updateReference = (index: number, patch: Partial<ArticleReferenceDto>) => {
    setDraftPayload((prev) => ({
      ...prev,
      references: (prev.references ?? []).map((ref, idx) => (idx === index ? { ...ref, ...patch } : ref)),
    }));
  };

  const removeReference = (index: number) => {
    clearErrorsByPrefix('references.');
    setDraftPayload((prev) => ({
      ...prev,
      references: (prev.references ?? []).filter((_, idx) => idx !== index),
    }));
  };

  const closeEditor = () => {
    editRequestIdRef.current += 1;
    setIsEditLoading(false);
    setEditLoadError(null);
    setIsModalOpen(false);
    setTagsInput('');
    setEditingId(null);
    setErrors({});
    setHeroImageAlt('');
    setHeroImageCaption('');
  };

  const handleEdit = async (article: ArticleDto) => {
    if (!article.id) {
      return;
    }

    const requestId = (editRequestIdRef.current += 1);

    setDraftPayload({
      slug: article.slug,
      title: article.title,
      description: article.description,
      excerpt: article.excerpt,
      heroKicker: article.heroKicker,
      heroImage: article.heroImage,
      tags: article.tags,
      author: article.author,
      readingTime: article.readingTime,
      publishedAt: article.publishedAt,
      status: article.status,
      canonicalUrl: article.canonicalUrl,
      ogImage: article.ogImage,
      noindex: article.noindex,
      contentGroup: article.contentGroup,
      primaryCta: article.primaryCta,
      secondaryCta: article.secondaryCta,
      stats: article.stats,
      keyPoints: article.keyPoints,
      checklist: article.checklist,
      sections: article.sections,
      faqs: article.faqs,
      references: article.references,
    });
    setHeroImageAlt(article.heroImage?.alt || '');
    setHeroImageCaption(article.heroImage?.caption || '');
    setTagsInput((article.tags || []).join(', '));
    setEditingId(article.id);
    setErrors({});
    setEditLoadError(null);
    setIsEditLoading(true);
    setIsModalOpen(true);

    try {
      const fullArticle = await articleService.getAdminBySlug(article.slug, true);
      if (editRequestIdRef.current !== requestId) return;

      setDraftPayload({
        slug: fullArticle.slug,
        title: fullArticle.title,
        description: fullArticle.description,
        excerpt: fullArticle.excerpt,
        heroKicker: fullArticle.heroKicker,
        heroImage: fullArticle.heroImage,
        tags: fullArticle.tags,
        author: fullArticle.author,
        readingTime: fullArticle.readingTime,
        publishedAt: fullArticle.publishedAt,
        status: fullArticle.status,
        canonicalUrl: fullArticle.canonicalUrl,
        ogImage: fullArticle.ogImage,
        noindex: fullArticle.noindex,
        contentGroup: fullArticle.contentGroup,
        primaryCta: fullArticle.primaryCta,
        secondaryCta: fullArticle.secondaryCta,
        stats: fullArticle.stats,
        keyPoints: fullArticle.keyPoints,
        checklist: fullArticle.checklist,
        sections: fullArticle.sections,
        faqs: fullArticle.faqs,
        references: fullArticle.references,
      });
      setHeroImageAlt(fullArticle.heroImage?.alt || '');
      setHeroImageCaption(fullArticle.heroImage?.caption || '');
      setTagsInput((fullArticle.tags || []).join(', '));
      setEditingId(fullArticle.id ?? article.id);
    } catch (err) {
      if (editRequestIdRef.current !== requestId) return;
      setEditLoadError(err);
    } finally {
      if (editRequestIdRef.current === requestId) {
        setIsEditLoading(false);
      }
    }
  };

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};

    const slug = (draftPayload.slug || '').trim();
    const title = (draftPayload.title || '').trim();
    const description = (draftPayload.description || '').trim();
    const excerpt = (draftPayload.excerpt || '').trim();
    const readingTime = (draftPayload.readingTime || '').trim();
    const authorName = (draftPayload.author?.name || '').trim();
    const authorTitle = (draftPayload.author?.title || '').trim();
    const tags = (tagsInput || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (!title) nextErrors.title = 'Title is required';
    if (!slug) {
      nextErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      nextErrors.slug = 'Slug must be lowercase and URL-safe (use hyphens)';
    }
    if (!description) nextErrors.description = 'Description is required';
    if (!excerpt) nextErrors.excerpt = 'Excerpt is required';
    if (!tags.length) nextErrors.tags = 'At least one tag is required';
    if (!readingTime) nextErrors.readingTime = 'Reading time is required';
    if (!authorName) nextErrors.authorName = 'Author name is required';
    if (!authorTitle) nextErrors.authorTitle = 'Author title is required';
    if (!draftPayload.publishedAt) nextErrors.publishedAt = 'Published at is required';
    if (!draftPayload.status) nextErrors.status = 'Status is required';

    const normalizedStats: ArticleStatDto[] = [];
    for (let i = 0; i < (draftPayload.stats ?? []).length; i++) {
      const stat = (draftPayload.stats ?? [])[i];
      if (!stat) continue;

      const label = (stat.label || '').trim();
      const value = (stat.value || '').trim();
      const detail = (stat.detail || '').trim();
      const link = (stat.link || '').trim();

      const hasAny = [label, value, detail, link].some(Boolean);
      if (!hasAny) continue;

      if (!label) nextErrors[`stats.${i}.label`] = 'Label is required';
      if (!value) nextErrors[`stats.${i}.value`] = 'Value is required';

      normalizedStats.push({
        ...stat,
        label,
        value,
        detail,
        ...(hasText(link) ? { link } : {}),
      });
    }

    const normalizedSections: ArticleSectionDto[] = [];
    for (let i = 0; i < (draftPayload.sections ?? []).length; i++) {
      const section = (draftPayload.sections ?? [])[i];
      if (!section) continue;

      const titleValue = (section.title || '').trim();
      const summary = (section.summary || '').trim();
      const content = (section.content || '').trim();

      let sectionIdValue = (section.sectionId || '').trim();
      if (!sectionIdValue && titleValue) {
        sectionIdValue = slugify(titleValue);
      }

      const hasAny = [sectionIdValue, titleValue, summary, content].some(Boolean);
      if (!hasAny) continue;

      if (!titleValue) nextErrors[`sections.${i}.title`] = 'Title is required';
      if (!sectionIdValue) nextErrors[`sections.${i}.sectionId`] = 'ID is required';

      normalizedSections.push({
        ...section,
        sectionId: sectionIdValue,
        title: titleValue,
        summary: hasText(summary) ? summary : undefined,
        content: hasText(content) ? content : undefined,
      });
    }

    const normalizedFaqs: ArticleFaqDto[] = [];
    for (let i = 0; i < (draftPayload.faqs ?? []).length; i++) {
      const faq = (draftPayload.faqs ?? [])[i];
      if (!faq) continue;

      const question = (faq.question || '').trim();
      const answer = (faq.answer || '').trim();

      const hasAny = [question, answer].some(Boolean);
      if (!hasAny) continue;

      if (!question) nextErrors[`faqs.${i}.question`] = 'Question is required';

      normalizedFaqs.push({ question, answer });
    }

    const normalizedReferences: ArticleReferenceDto[] = [];
    for (let i = 0; i < (draftPayload.references ?? []).length; i++) {
      const ref = (draftPayload.references ?? [])[i];
      if (!ref) continue;

      const titleValue = (ref.title || '').trim();
      const url = (ref.url || '').trim();

      const hasAny = [titleValue, url].some(Boolean);
      if (!hasAny) continue;

      if (!titleValue) nextErrors[`references.${i}.title`] = 'Title is required';
      if (!url) nextErrors[`references.${i}.url`] = 'URL is required';

      normalizedReferences.push({ ...ref, title: titleValue, url });
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const normalizedKeyPoints = normalizeLines(draftPayload.keyPoints ?? []);
    const normalizedChecklist = normalizeLines(draftPayload.checklist ?? []);

    const payload: ArticleUpsertPayload = {
      ...draftPayload,
      slug,
      title,
      description,
      excerpt,
      readingTime,
      tags,
      author: { name: authorName, title: authorTitle },
      stats: normalizedStats.length ? normalizedStats : undefined,
      keyPoints: normalizedKeyPoints.length ? normalizedKeyPoints : undefined,
      checklist: normalizedChecklist.length ? normalizedChecklist : undefined,
      sections: normalizedSections.length ? normalizedSections : undefined,
      faqs: normalizedFaqs.length ? normalizedFaqs : undefined,
      references: normalizedReferences.length ? normalizedReferences : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ articleId: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const renderAdminActions = (article: ArticleDto) => {
    if (!isAdmin) return null;
    return (
      <div className="ml-auto">
        <Dropdown
          options={[
            { value: 'edit', label: 'Edit' },
            { value: 'delete', label: 'Delete' },
          ]}
          onChange={(value) => {
            if (value === 'edit') {
              handleEdit(article);
            } else if (value === 'delete') {
              if (article.id) {
                setArticleIdToDelete(article.id);
                setIsDeleteOpen(true);
              }
            }
          }}
          placeholder="Actions"
          size="sm"
        />
      </div>
    );
  };

  return (
    <>
      <Seo
        title="Learning Science Blog | Quizzence"
        description="Research-backed articles on retrieval practice, pre-testing, and quiz design for university students, school pupils and their teachers."
        canonicalPath="/blog/"
        ogType="website"
      />
      <PageContainer
        title="Learning science blog"
        subtitle="Evidence-based playbooks for quizzes, teaching, and student engagement in universities and schools."
        showHeader
        showBreadcrumb
        customBreadcrumbItems={[
          { label: 'Home', path: '/' },
          { label: 'Blog', path: '/blog/', isCurrent: true },
        ]}
      >
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
          {isAdmin && (
            <div className="flex items-center gap-3">
              <Dropdown
                options={statusOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as ArticleStatus | 'all')}
                size="sm"
              />
            </div>
          )}
          {isAdmin && (
            <Button
              variant="primary"
              onClick={() => {
                editRequestIdRef.current += 1;
                setIsEditLoading(false);
                setEditLoadError(null);
                setDraftPayload(createEmptyPayload());
                setTagsInput('');
                setEditingId(null);
                setErrors({});
                setIsModalOpen(true);
              }}
            >
              Create article
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!isLoading && data && data.items?.length === 0 && (
          <div className="text-theme-text-secondary text-sm">No articles found.</div>
        )}

        {!isLoading && data && data.items?.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {data.items.map((post) => (
              <Card key={post.slug} padding="lg" hoverable>
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-theme-text-tertiary">
                    <span>{new Date(post.updatedAt || post.publishedAt).toLocaleDateString()}</span>
                    <span>• {post.readingTime}</span>
                    <span className="inline-flex rounded-full bg-theme-bg-tertiary px-2 py-0.5 text-xs text-theme-text-secondary">
                      {post.status}
                    </span>
                    {renderAdminActions(post)}
                  </div>
                  <h2 className="text-2xl font-semibold text-theme-text-primary">{post.title}</h2>
                  <p className="text-theme-text-secondary">{post.description || post.excerpt}</p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags?.slice(0, 6).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardBody className="flex flex-wrap items-center gap-3">
                  <Link
                    to={`/blog/${post.slug}/`}
                    className="inline-flex items-center justify-center rounded-lg bg-theme-interactive-primary px-4 py-2 text-sm font-medium text-theme-text-inverse transition-colors duration-200 hover:bg-theme-interactive-primary-hover focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary"
                  >
                    Read article
                  </Link>
                  {post.secondaryCta && hasText(post.secondaryCta.href) && (
                    isExternalUrl(post.secondaryCta.href) ? (
                      <a
                        href={post.secondaryCta.href.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-theme-interactive-primary hover:bg-theme-bg-tertiary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary"
                      >
                        {post.secondaryCta.label}
                      </a>
                    ) : (
                      <Link
                        to={post.secondaryCta.href.trim()}
                        className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-theme-interactive-primary hover:bg-theme-bg-tertiary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary"
                      >
                        {post.secondaryCta.label}
                      </Link>
                    )
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>

      <Modal
        isOpen={isModalOpen}
        onClose={closeEditor}
        title={editingId ? 'Edit article' : 'Create article'}
        size="lg"
      >
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {editLoadError != null && (
            <Alert type="error" error={editLoadError} className="text-sm" />
          )}
          {(createMutation.error || updateMutation.error) && (
            <Alert type="error" error={createMutation.error || updateMutation.error} className="text-sm" />
          )}
          {isEditLoading && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}
          <fieldset disabled={isEditLoading} className="space-y-4">
            <p className="text-sm text-theme-text-secondary">Fields marked * are required. Others are optional.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={
                <>
                  Title <span className="text-theme-interactive-danger">*</span>
                </>
              }
              value={draftPayload.title}
              onChange={(e) => {
                setDraftPayload({ ...draftPayload, title: e.target.value });
                clearError('title');
              }}
              error={errors.title}
            />
            <Input
              label={
                <>
                  Slug <span className="text-theme-interactive-danger">*</span>
                </>
              }
              value={draftPayload.slug}
              onChange={(e) => {
                setDraftPayload({ ...draftPayload, slug: e.target.value });
                clearError('slug');
              }}
              helperText="Lowercase, URL-safe"
              error={errors.slug}
              disabled={!!editingId}
            />
          </div>
          <Textarea
            label={
              <>
                Description <span className="text-theme-interactive-danger">*</span>
              </>
            }
            value={draftPayload.description}
            onChange={(e) => {
              setDraftPayload({ ...draftPayload, description: e.target.value });
              clearError('description');
            }}
            rows={2}
            error={errors.description}
          />
          <Textarea
            label={
              <>
                Excerpt <span className="text-theme-interactive-danger">*</span>
              </>
            }
            value={draftPayload.excerpt}
            onChange={(e) => {
              setDraftPayload({ ...draftPayload, excerpt: e.target.value });
              clearError('excerpt');
            }}
            rows={2}
            error={errors.excerpt}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={
                <>
                  Tags (comma-separated) <span className="text-theme-interactive-danger">*</span>
                </>
              }
              value={tagsInput}
              onChange={(e) => {
                const nextValue = e.target.value;
                setTagsInput(nextValue);
                setDraftPayload((prev) => ({
                  ...prev,
                  tags: nextValue
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                }));
                clearError('tags');
              }}
              error={errors.tags}
            />
            <Input
              label={
                <>
                  Reading time <span className="text-theme-interactive-danger">*</span>
                </>
              }
              value={draftPayload.readingTime}
              onChange={(e) => {
                setDraftPayload({ ...draftPayload, readingTime: e.target.value });
                clearError('readingTime');
              }}
              placeholder="e.g. 8 minute read"
              error={errors.readingTime}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Hero kicker (optional)"
              value={draftPayload.heroKicker || ''}
              onChange={(e) => setDraftPayload({ ...draftPayload, heroKicker: e.target.value })}
            />
            <Input
              label="Canonical URL (optional)"
              value={draftPayload.canonicalUrl || ''}
              onChange={(e) => setDraftPayload({ ...draftPayload, canonicalUrl: e.target.value })}
            />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary">
                    Hero Image (optional)
                  </label>
                  <p className="text-xs text-theme-text-tertiary mt-0.5">
                    Recommended: 1920 × 1080px (16:9), max 500 KB. Will be displayed at the top of the article.
                  </p>
                </div>
                <input
                  ref={heroImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const alt = (prompt('Enter alt text for the image (required):') ?? '').trim();
                    if (!alt) {
                      alert('Alt text is required');
                      if (heroImageInputRef.current) {
                        heroImageInputRef.current.value = '';
                      }
                      return;
                    }

                    const captionInput = prompt('Enter caption (optional, press Cancel to skip):');
                    const caption = (captionInput ?? '').trim();

                    setIsUploadingHeroImage(true);
                    try {
                      const { assetId } = await uploadImage(file, editingId || undefined);
                      setDraftPayload((prev) => ({ 
                        ...prev, 
                        heroImage: { assetId, alt, ...(caption ? { caption } : {}) }
                      }));
                      setHeroImageAlt(alt);
                      setHeroImageCaption(caption);
                      clearError('heroImage');
                    } catch (error: any) {
                      setErrors((prev) => ({ ...prev, heroImage: error.message || 'Failed to upload image' }));
                    } finally {
                      setIsUploadingHeroImage(false);
                      if (heroImageInputRef.current) {
                        heroImageInputRef.current.value = '';
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => heroImageInputRef.current?.click()}
                  disabled={isUploadingHeroImage}
                  loading={isUploadingHeroImage}
                >
                  {isUploadingHeroImage ? 'Uploading...' : 'Upload Image'}
                </Button>
              </div>
              {draftPayload.heroImage && (
                <div className="mt-2 p-3 border border-theme-border-primary rounded-lg bg-theme-bg-secondary">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm text-theme-text-secondary">Hero image set</span>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setDraftPayload({ ...draftPayload, heroImage: undefined });
                        setHeroImageAlt('');
                        setHeroImageCaption('');
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    label="Alt text *"
                    value={heroImageAlt}
                    onChange={(e) => {
                      const newAlt = e.target.value;
                      setHeroImageAlt(newAlt);
                      setDraftPayload({ 
                        ...draftPayload, 
                        heroImage: draftPayload.heroImage ? { ...draftPayload.heroImage, alt: newAlt } : undefined
                      });
                    }}
                    placeholder="Describe the image"
                  />
                  <div className="mt-2">
                    <Input
                      label="Caption (optional)"
                      value={heroImageCaption}
                      onChange={(e) => {
                        const newCaption = e.target.value;
                        setHeroImageCaption(newCaption);
                        setDraftPayload({ 
                          ...draftPayload, 
                          heroImage: draftPayload.heroImage ? { ...draftPayload.heroImage, caption: newCaption || undefined } : undefined
                        });
                      }}
                      placeholder="Optional caption text"
                    />
                  </div>
                </div>
              )}
              {errors.heroImage && (
                <p className="mt-1 text-sm text-theme-interactive-danger">{errors.heroImage}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="OG Image URL (optional)"
                value={draftPayload.ogImage || ''}
                onChange={(e) => setDraftPayload({ ...draftPayload, ogImage: e.target.value })}
                helperText="Open Graph image URL for social sharing (separate from hero image)"
                placeholder="https://example.com/image.jpg"
              />
              <Input
                label="Content group (optional)"
                value={draftPayload.contentGroup || ''}
                onChange={(e) => setDraftPayload({ ...draftPayload, contentGroup: e.target.value })}
                placeholder="blog / research / marketing"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={
                <>
                  Author name <span className="text-theme-interactive-danger">*</span>
                </>
              }
              value={draftPayload.author.name}
              onChange={(e) => {
                setDraftPayload({ ...draftPayload, author: { ...draftPayload.author, name: e.target.value } });
                clearError('authorName');
              }}
              error={errors.authorName}
            />
            <Input
              label={
                <>
                  Author title <span className="text-theme-interactive-danger">*</span>
                </>
              }
              value={draftPayload.author.title}
              onChange={(e) => {
                setDraftPayload({ ...draftPayload, author: { ...draftPayload.author, title: e.target.value } });
                clearError('authorTitle');
              }}
              error={errors.authorTitle}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={
                <>
                  Published at <span className="text-theme-interactive-danger">*</span>
                </>
              }
              type="datetime-local"
              value={draftPayload.publishedAt ? draftPayload.publishedAt.slice(0, 16) : ''}
              onChange={(e) => {
                setDraftPayload({ ...draftPayload, publishedAt: new Date(e.target.value).toISOString() });
                clearError('publishedAt');
              }}
              error={errors.publishedAt}
            />
            <Dropdown
              label="Status *"
              options={[
                { value: 'PUBLISHED', label: 'Published' },
                { value: 'DRAFT', label: 'Draft' },
              ]}
              value={draftPayload.status}
              onChange={(val) => {
                setDraftPayload({ ...draftPayload, status: val as ArticleStatus });
                clearError('status');
              }}
              size="sm"
              error={errors.status}
            />
          </div>
          <div>
            <Switch
              checked={!!draftPayload.noindex}
              onChange={(checked) => setDraftPayload({ ...draftPayload, noindex: checked })}
              label="Noindex (hide from search engines)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Primary CTA label"
              value={draftPayload.primaryCta?.label || ''}
              onChange={(e) =>
                setDraftPayload({
                  ...draftPayload,
                  primaryCta: { ...(draftPayload.primaryCta || {}), label: e.target.value, href: draftPayload.primaryCta?.href || '' },
                })
              }
            />
            <Input
              label="Primary CTA href"
              value={draftPayload.primaryCta?.href || ''}
              onChange={(e) =>
                setDraftPayload({
                  ...draftPayload,
                  primaryCta: { ...(draftPayload.primaryCta || {}), href: e.target.value, label: draftPayload.primaryCta?.label || '' },
                })
              }
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Secondary CTA label"
              value={draftPayload.secondaryCta?.label || ''}
              onChange={(e) =>
                setDraftPayload({
                  ...draftPayload,
                  secondaryCta: { ...(draftPayload.secondaryCta || {}), label: e.target.value, href: draftPayload.secondaryCta?.href || '' },
                })
              }
            />
            <Input
              label="Secondary CTA href"
              value={draftPayload.secondaryCta?.href || ''}
              onChange={(e) =>
                setDraftPayload({
                  ...draftPayload,
                  secondaryCta: { ...(draftPayload.secondaryCta || {}), href: e.target.value, label: draftPayload.secondaryCta?.label || '' },
                })
              }
            />
          </div>

          <Textarea
            label="Key points (one per line)"
            value={(draftPayload.keyPoints || []).join('\n')}
            onChange={(e) => setDraftPayload({ ...draftPayload, keyPoints: splitLines(e.target.value) })}
            rows={3}
          />
          <Textarea
            label="Checklist (one per line)"
            value={(draftPayload.checklist || []).join('\n')}
            onChange={(e) => setDraftPayload({ ...draftPayload, checklist: splitLines(e.target.value) })}
            rows={3}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-theme-text-primary">Stats</h4>
              <Button
                variant="secondary"
                size="sm"
                onClick={addStat}
              >
                Add
              </Button>
            </div>
            {(draftPayload.stats ?? []).length === 0 && (
              <p className="text-sm text-theme-text-tertiary">No stats yet.</p>
            )}
            <div className="space-y-3">
              {(draftPayload.stats ?? []).map((stat, idx) => (
                <div
                  key={`stat-${idx}`}
                  className="border border-theme-border-primary rounded-lg p-4 bg-theme-bg-primary text-theme-text-primary"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-theme-text-secondary">Stat {idx + 1}</span>
                    <Button variant="danger" size="sm" onClick={() => removeStat(idx)}>
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      label="Label"
                      value={stat.label}
                      error={errors[`stats.${idx}.label`]}
                      onChange={(e) => {
                        updateStat(idx, { label: e.target.value });
                        clearError(`stats.${idx}.label`);
                      }}
                    />
                    <Input
                      label="Value"
                      value={stat.value}
                      error={errors[`stats.${idx}.value`]}
                      onChange={(e) => {
                        updateStat(idx, { value: e.target.value });
                        clearError(`stats.${idx}.value`);
                      }}
                    />
                    <Input
                      label="Detail"
                      value={stat.detail}
                      onChange={(e) => updateStat(idx, { detail: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-theme-text-primary">Sections</h4>
              <Button
                variant="secondary"
                size="sm"
                onClick={addSection}
              >
                Add
              </Button>
            </div>
            {(draftPayload.sections ?? []).length === 0 && (
              <p className="text-sm text-theme-text-tertiary">No sections yet.</p>
            )}
            <div className="space-y-3">
              {(draftPayload.sections ?? []).map((section, idx) => (
                <div
                  key={`section-${idx}`}
                  className="border border-theme-border-primary rounded-lg p-4 bg-theme-bg-primary text-theme-text-primary"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-theme-text-secondary">Section {idx + 1}</span>
                    <Button variant="danger" size="sm" onClick={() => removeSection(idx)}>
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Title"
                      value={section.title}
                      error={errors[`sections.${idx}.title`]}
                      onChange={(e) => {
                        const nextTitle = e.target.value;
                        const nextPatch: Partial<ArticleSectionDto> = { title: nextTitle };
                        if (!hasText(section.sectionId) && hasText(nextTitle)) {
                          const baseId = slugify(nextTitle);
                          const uniqueId = getUniqueSectionId(baseId, draftPayload.sections ?? [], idx);
                          nextPatch.sectionId = uniqueId;
                        }
                        updateSection(idx, nextPatch);
                        clearError(`sections.${idx}.title`);
                      }}
                    />
                    <Input
                      label="ID (anchor)"
                      value={section.sectionId}
                      error={errors[`sections.${idx}.sectionId`]}
                      helperText="Used for section links; auto-generated from title if empty"
                      onChange={(e) => {
                        updateSection(idx, { sectionId: e.target.value });
                        clearError(`sections.${idx}.sectionId`);
                      }}
                    />
                    <Textarea
                      label="Summary"
                      value={section.summary || ''}
                      onChange={(e) => updateSection(idx, { summary: e.target.value })}
                      rows={2}
                    />
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <label className="block text-sm font-medium text-theme-text-secondary">
                            Content (HTML or Markdown)
                          </label>
                          <p className="text-xs text-theme-text-tertiary mt-0.5">
                            Inline images: Recommended 600-800px wide, max 200 KB
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`section-image-${idx}`}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              const baseSectionId = hasText(section.sectionId)
                                ? section.sectionId
                                : hasText(section.title)
                                ? slugify(section.title)
                                : '';
                              const reservedIds = Object.entries(pendingSectionIdsRef.current)
                                .filter(([reservedIdx]) => Number(reservedIdx) !== idx)
                                .map(([, id]) => id);
                              const targetSectionId = baseSectionId
                                ? getUniqueSectionId(baseSectionId, sectionsRef.current, idx, reservedIds)
                                : '';
                              if (!targetSectionId) {
                                alert('Please add a section title or ID before uploading an image.');
                                e.target.value = '';
                                return;
                              }
                               
                              const alt = (prompt('Enter alt text for the image (required):') ?? '').trim();
                              if (!alt) {
                                alert('Alt text is required');
                                e.target.value = '';
                                return;
                              }

                              const previousSectionId = sectionsRef.current[idx]?.sectionId ?? section.sectionId;

                              pendingSectionIdsRef.current = {
                                ...pendingSectionIdsRef.current,
                                [idx]: targetSectionId,
                              };
                              sectionsRef.current = (sectionsRef.current ?? []).map((current, currentIdx) =>
                                currentIdx === idx ? { ...current, sectionId: targetSectionId } : current
                              );

                              if (targetSectionId !== previousSectionId) {
                                updateSection(idx, { sectionId: targetSectionId });
                                clearError(`sections.${idx}.sectionId`);
                              }

                              try {
                                const { cdnUrl } = await uploadImage(file, editingId || undefined);
                                
                                // Escape HTML attributes to prevent XSS
                                const escapedUrl = escapeHtmlAttribute(cdnUrl);
                                const escapedAlt = escapeHtmlAttribute(alt);
                                const imageHtml = `<img src="${escapedUrl}" alt="${escapedAlt}" />`;
                                // Use functional update to read current section content from state
                                updateSectionById(targetSectionId, (currentSection) => {
                                  const currentContent = currentSection.content || '';
                                  return { content: currentContent + (currentContent ? '\n\n' : '') + imageHtml };
                                });
                              } catch (error: any) {
                                alert(error.message || 'Failed to upload image');
                              } finally {
                                e.target.value = '';
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => document.getElementById(`section-image-${idx}`)?.click()}
                          >
                            Upload Image
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const imageUrl = prompt('Enter image URL:');
                              if (imageUrl && imageUrl.trim()) {
                                // Sanitize URL to prevent javascript: and data: protocols
                                const sanitizedUrl = sanitizeUrl(imageUrl.trim());
                                if (!sanitizedUrl) {
                                  alert('Invalid URL. Please enter a valid http:// or https:// URL.');
                                  return;
                                }
                                
                                // Prompt for alt text (required for accessibility)
                                const alt = prompt('Enter alt text for the image (required):') || '';
                                if (!alt.trim()) {
                                  alert('Alt text is required');
                                  return;
                                }
                                
                                // Escape HTML attributes to prevent XSS
                                const escapedUrl = escapeHtmlAttribute(sanitizedUrl);
                                const escapedAlt = escapeHtmlAttribute(alt);
                                const imageHtml = `<img src="${escapedUrl}" alt="${escapedAlt}" />`;
                                // Use functional update to read current section content from state
                                updateSection(idx, (currentSection) => {
                                  const currentContent = currentSection.content || '';
                                  return { content: currentContent + (currentContent ? '\n\n' : '') + imageHtml };
                                });
                              }
                            }}
                          >
                            Insert URL
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={section.content || ''}
                        onChange={(e) => updateSection(idx, { content: e.target.value })}
                        rows={5}
                        placeholder="Enter section content. Use HTML for formatting. Upload or insert images using the buttons above."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-theme-text-primary">FAQs</h4>
              <Button
                variant="secondary"
                size="sm"
                onClick={addFaq}
              >
                Add
              </Button>
            </div>
            {(draftPayload.faqs ?? []).length === 0 && (
              <p className="text-sm text-theme-text-tertiary">No FAQs yet.</p>
            )}
            <div className="space-y-3">
              {(draftPayload.faqs ?? []).map((faq, idx) => (
                <div
                  key={`faq-${idx}`}
                  className="border border-theme-border-primary rounded-lg p-4 bg-theme-bg-primary text-theme-text-primary"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-theme-text-secondary">FAQ {idx + 1}</span>
                    <Button variant="danger" size="sm" onClick={() => removeFaq(idx)}>
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Question"
                      value={faq.question}
                      error={errors[`faqs.${idx}.question`]}
                      onChange={(e) => {
                        updateFaq(idx, { question: e.target.value });
                        clearError(`faqs.${idx}.question`);
                      }}
                    />
                    <Textarea
                      label="Answer"
                      value={faq.answer || ''}
                      onChange={(e) => updateFaq(idx, { answer: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-theme-text-primary">References</h4>
              <Button
                variant="secondary"
                size="sm"
                onClick={addReference}
              >
                Add
              </Button>
            </div>
            {(draftPayload.references ?? []).length === 0 && (
              <p className="text-sm text-theme-text-tertiary">No references yet.</p>
            )}
            <div className="space-y-3">
              {(draftPayload.references ?? []).map((ref, idx) => (
                <div
                  key={`ref-${idx}`}
                  className="border border-theme-border-primary rounded-lg p-4 bg-theme-bg-primary text-theme-text-primary"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-theme-text-secondary">Reference {idx + 1}</span>
                    <Button variant="danger" size="sm" onClick={() => removeReference(idx)}>
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Title"
                      value={ref.title}
                      error={errors[`references.${idx}.title`]}
                      onChange={(e) => {
                        updateReference(idx, { title: e.target.value });
                        clearError(`references.${idx}.title`);
                      }}
                    />
                    <Input
                      label="URL"
                      value={ref.url}
                      error={errors[`references.${idx}.url`]}
                      onChange={(e) => {
                        updateReference(idx, { url: e.target.value });
                        clearError(`references.${idx}.url`);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            </div>

            </fieldset>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={closeEditor}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={isEditLoading || createMutation.isPending || updateMutation.isPending}
                disabled={isEditLoading}
              >
                {editingId ? 'Save changes' : 'Create'}
              </Button>
            </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => articleIdToDelete && deleteMutation.mutate(articleIdToDelete)}
        title="Delete article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};

export default BlogIndexPage;
