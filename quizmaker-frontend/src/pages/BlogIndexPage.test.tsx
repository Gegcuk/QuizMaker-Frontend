import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import { articleService } from '@/features/blog/services/articleService';
import type { ArticleDto } from '@/features/blog/types';
import BlogIndexPage from './BlogIndexPage';

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
};

const articleList = {
  items: [article],
  total: 1,
  limit: 50,
  offset: 0,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BlogIndexPage', () => {
  it('shows a loading indicator while the public article list is pending', () => {
    vi.spyOn(articleService, 'list').mockReturnValue(new Promise(() => {}));

    renderWithProviders(<BlogIndexPage />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('renders published articles returned by the public list endpoint', async () => {
    vi.spyOn(articleService, 'list').mockResolvedValue(articleList);

    renderWithProviders(<BlogIndexPage />);

    expect(
      await screen.findByRole('heading', { level: 2, name: article.title }),
    ).toBeInTheDocument();
  });

  it('renders the existing empty state when no published articles are returned', async () => {
    vi.spyOn(articleService, 'list').mockResolvedValue({
      items: [],
      total: 0,
      limit: 50,
      offset: 0,
    });

    renderWithProviders(<BlogIndexPage />);

    expect(await screen.findByText('No articles found.')).toBeInTheDocument();
  });

  it('shows a recoverable error and retries the public article list', async () => {
    const list = vi.spyOn(articleService, 'list')
      .mockRejectedValueOnce(new Error('Articles are temporarily unavailable.'))
      .mockResolvedValueOnce(articleList);
    const { user } = renderWithProviders(<BlogIndexPage />);

    expect(await screen.findByText('Unable to load articles')).toBeInTheDocument();
    expect(screen.getByText('Articles are temporarily unavailable.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('heading', { level: 2, name: article.title }),
    ).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });
});
