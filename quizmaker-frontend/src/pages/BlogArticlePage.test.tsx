import { afterEach, describe, expect, it, vi } from 'vitest';
import { Link, Route, Routes } from 'react-router-dom';
import { fireEvent, renderWithProviders, screen, setTestAuthTokens, waitFor } from '@/test/render';
import { mockCurrentUserHandler, testUser } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { articleService } from '@/features/blog/services/articleService';
import { mediaService } from '@/features/media';
import type { ArticleDto } from '@/features/blog/types';
import BlogArticlePage from './BlogArticlePage';

const fallbackUrl = 'https://cdn.quizzence.com/library/aec804f3-e4b3-430a-ba3e-109e819b3c56.png';
const fallbackAlt = 'Illustration of a document turning into quiz questions and a study plan';
const article: ArticleDto = {
  id: 'article-123',
  slug: 'retrieval-practice',
  title: 'Retrieval practice for stronger learning',
  description: 'A research-backed study strategy.',
  excerpt: 'Use deliberate recall to make knowledge durable.',
  tags: ['learning science'],
  author: { name: 'Quizzence Team', title: 'Learning science' },
  readingTime: '4 min read',
  publishedAt: '2026-01-01T00:00:00.000Z',
  status: 'PUBLISHED',
  heroImage: {
    assetId: 'hero-123',
    alt: 'A student practising recall',
    caption: 'Daily recall practice',
    rendition: { url: 'https://images.example.test/published/recall.webp', width: 1200, height: 630, mimeType: 'image/webp' },
  },
};

const renderArticle = () => renderWithProviders(
  <>
    <Link to="/blog/other-article/">Other article</Link>
    <Link to="/blog/retrieval-practice/">First article</Link>
    <Routes><Route path="/blog/:slug/" element={<BlogArticlePage />} /></Routes>
  </>,
  { route: '/blog/retrieval-practice/' },
);

const imageMeta = () => document.head.querySelector('meta[property="og:image"]')?.getAttribute('content');

afterEach(() => vi.restoreAllMocks());

describe('public article hero images', () => {
  it('renders the documented URL with intrinsic dimensions, article alt and caption', async () => {
    vi.spyOn(articleService, 'getBySlug').mockResolvedValue(article);
    renderArticle();

    const image = await screen.findByRole('img', { name: 'A student practising recall' });
    expect(image).toHaveAttribute('src', 'https://images.example.test/published/recall.webp');
    expect(image).toHaveAttribute('width', '1200');
    expect(image).toHaveAttribute('height', '630');
    expect(screen.getByText('Daily recall practice')).toBeInTheDocument();
    expect(imageMeta()).toBe('https://images.example.test/published/recall.webp');
    expect(screen.queryByRole('button', { name: 'Edit Article' })).not.toBeInTheDocument();
  });

  it('renders historical images without inventing unknown dimensions', async () => {
    vi.spyOn(articleService, 'getBySlug').mockResolvedValue({
      ...article,
      heroImage: {
        assetId: 'historical-image', alt: 'Historical illustration',
        rendition: { url: 'https://images.example.test/old.png', width: null, height: null, mimeType: 'image/png' },
      },
    });
    renderArticle();
    const image = await screen.findByRole('img', { name: 'Historical illustration' });
    expect(image).not.toHaveAttribute('width');
    expect(image).not.toHaveAttribute('height');
    expect(image).toHaveAttribute('src', 'https://images.example.test/old.png');
  });

  it.each([
    ['no hero', undefined],
    ['null hero', null],
    ['unavailable or deleted media', { assetId: 'deleted', alt: 'Deleted diagram', caption: 'Old caption', rendition: null }],
    ['legacy response without a rendition', { assetId: 'legacy', alt: 'Old diagram' }],
  ] as const)('uses the approved fallback for %s without guessing an asset URL', async (_scenario, heroImage) => {
    vi.spyOn(articleService, 'getBySlug').mockResolvedValue({ ...article, heroImage });
    renderArticle();
    const image = await screen.findByRole('img', { name: fallbackAlt });
    expect(image).toHaveAttribute('src', fallbackUrl);
    expect(image).toHaveAttribute('width', '1792');
    expect(image).toHaveAttribute('height', '592');
    expect(screen.queryByText('Old caption')).not.toBeInTheDocument();
    expect(imageMeta()).toBe(fallbackUrl);
  });

  it('replaces a failed hero with the fallback and removes the failed image caption and metadata', async () => {
    vi.spyOn(articleService, 'getBySlug').mockResolvedValue(article);
    renderArticle();
    fireEvent.error(await screen.findByRole('img', { name: 'A student practising recall' }));
    expect(screen.getByRole('img', { name: fallbackAlt })).toHaveAttribute('src', fallbackUrl);
    expect(screen.queryByText('Daily recall practice')).not.toBeInTheDocument();
    expect(imageMeta()).toBe(fallbackUrl);
    expect(document.head.querySelector('meta[property="og:image:width"]')).toHaveAttribute('content', '1792');

    fireEvent.error(screen.getByRole('img', { name: fallbackAlt }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: article.title })).toBeInTheDocument();
    expect(imageMeta()).toBeUndefined();
    expect(document.head.querySelector('meta[name="twitter:image"]')).not.toBeInTheDocument();
    const schemas = [...document.head.querySelectorAll('script[data-seo="structured-data"]')]
      .map(script => JSON.parse(script.textContent || '{}'));
    expect(schemas.find(schema => schema['@type'] === 'Article')).not.toHaveProperty('image');
  });

  it('keeps an independently authored social image when the hero fails', async () => {
    vi.spyOn(articleService, 'getBySlug').mockResolvedValue({ ...article, ogImage: 'https://images.example.test/social.png' });
    renderArticle();
    fireEvent.error(await screen.findByRole('img', { name: 'A student practising recall' }));
    expect(imageMeta()).toBe('https://images.example.test/social.png');
    expect(document.head.querySelector('meta[property="og:image:width"]')).not.toBeInTheDocument();
  });

  it('does not carry a previous article image or failure into another article or a return visit', async () => {
    vi.spyOn(articleService, 'getBySlug').mockImplementation(async slug => slug === article.slug
      ? article
      : { ...article, slug, title: 'Another article', heroImage: null });
    const { user } = renderArticle();
    fireEvent.error(await screen.findByRole('img', { name: 'A student practising recall' }));
    fireEvent.error(screen.getByRole('img', { name: fallbackAlt }));
    await user.click(screen.getByRole('link', { name: 'Other article' }));
    expect(await screen.findByRole('img', { name: fallbackAlt })).toHaveAttribute('src', fallbackUrl);
    expect(imageMeta()).toBe(fallbackUrl);
    await user.click(screen.getByRole('link', { name: 'First article' }));
    expect(await screen.findByRole('img', { name: 'A student practising recall' })).toHaveAttribute('width', '1200');
  });

  it('preserves loading and article request error states without showing a misleading fallback', async () => {
    vi.spyOn(articleService, 'getBySlug').mockRejectedValue(new Error('Article unavailable'));
    renderArticle();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent("An unexpected error occurred. Please refresh the page and try again.");
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(imageMeta()).toBeUndefined();
  });

  it('preserves the admin article request and edit action without a separate authenticated media search', async () => {
    setTestAuthTokens();
    server.use(mockCurrentUserHandler({ ...testUser, roles: ['ROLE_ADMIN'] }));
    vi.spyOn(articleService, 'getBySlug').mockResolvedValue(article);
    const adminRead = vi.spyOn(articleService, 'getAdminBySlug').mockResolvedValue(article);
    const mediaSearch = vi.spyOn(mediaService, 'searchAssets');
    renderArticle();
    expect(await screen.findByRole('button', { name: 'Edit Article' })).toBeInTheDocument();
    await waitFor(() => expect(adminRead).toHaveBeenCalledWith('retrieval-practice', true));
    expect(screen.getByRole('img', { name: 'A student practising recall' })).toHaveAttribute('src', 'https://images.example.test/published/recall.webp');
    expect(mediaSearch).not.toHaveBeenCalled();
  });
});
