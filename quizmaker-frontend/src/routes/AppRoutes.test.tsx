import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { articleService } from '@/features/blog/services/articleService';
import type { ArticleDto } from '@/features/blog/types';
import AppRoutes from './AppRoutes';

const publicRoutes = [
  ['/', 'AI Quiz Generator for Students & Teachers | Quizzence'],
  ['/login', 'Log In | Quizzence'],
  ['/register', 'Sign Up | Quizzence'],
  ['/forgot-password', 'Reset Password | Quizzence'],
  ['/reset-password', 'Set New Password | Quizzence'],
  ['/verify-email', 'Verify Email | Quizzence'],
  ['/theme-demo', 'Theme Demo | Quizzence'],
  ['/terms', 'Terms of Service | Quizzence'],
  ['/privacy', 'Privacy Policy | Quizzence'],
  ['/faq', 'FAQ | Quizzence'],
  ['/values', 'Values, Mission, and Vision | Quizzence'],
  ['/roadmap', 'Product Roadmap | Quizzence'],
  ['/blog/retrieval-practice-template', 'Retrieval Practice Article Template that Drives Quiz Starts | Quizzence'],
] as const;

const protectedRoutes = [
  '/quizzes',
  '/quizzes/quiz-123',
  '/quizzes/quiz-123/attempt',
  '/quizzes/quiz-123/attempt/start',
  '/quizzes/quiz-123/results',
  '/my-quizzes',
  '/quizzes/create',
  '/quizzes/quiz-123/edit',
  '/quizzes/quiz-123/results-summary',
  '/quizzes/quiz-123/questions',
  '/quizzes/quiz-123/generation',
  '/tags',
  '/categories',
  '/questions',
  '/bug-reports',
  '/documents',
  '/documents/upload',
  '/documents/document-123',
  '/ai-analysis',
  '/form-test',
  '/profile',
  '/settings',
  '/billing',
  '/billing/success',
  '/billing/cancel',
  '/my-attempts',
] as const;

const article: ArticleDto = {
  id: 'article-123',
  slug: 'route-smoke-test',
  title: 'Route smoke test article',
  description: 'An article response used to verify the public article route.',
  excerpt: 'This response verifies the article route without a network dependency.',
  tags: ['testing'],
  author: { name: 'Quizzence Team', title: 'Learning science' },
  readingTime: '4 min read',
  publishedAt: '2026-01-01T00:00:00.000Z',
  status: 'PUBLISHED',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AppRoutes public routes', () => {
  it.each(publicRoutes)('renders %s inside the app shell', async (route, title) => {
    renderWithProviders(<AppRoutes />, { route });

    await waitFor(() => {
      expect(document.title).toBe(title);
    });
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders the public blog index with mocked API data', async () => {
    vi.spyOn(articleService, 'list').mockResolvedValue({
      items: [],
      total: 0,
      limit: 50,
      offset: 0,
    });

    renderWithProviders(<AppRoutes />, { route: '/blog' });

    expect(await screen.findByText('No articles found.')).toBeInTheDocument();
    expect(document.title).toBe('Learning Science Blog | Quizzence');
  });

  it('renders a public blog article with a representative slug', async () => {
    vi.spyOn(articleService, 'getBySlug').mockResolvedValue(article);

    renderWithProviders(<AppRoutes />, { route: `/blog/${article.slug}` });

    expect(
      await screen.findByRole('heading', { level: 1, name: article.title }),
    ).toBeInTheDocument();
  });

  it('renders the development sitemap fallback without removing the app shell', async () => {
    vi.spyOn(articleService, 'getSitemap').mockResolvedValue([
      {
        url: '/blog/route-smoke-test',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    renderWithProviders(<AppRoutes />, { route: '/sitemap_articles.xml' });

    const sitemap = await screen.findByLabelText('Articles sitemap');
    expect(sitemap).toHaveTextContent('https://www.quizzence.com/blog/route-smoke-test/');
    expect(screen.getAllByRole('navigation')).not.toHaveLength(0);
  });

  it('shows OAuth callback failures without requiring credentials', async () => {
    renderWithProviders(<AppRoutes />, {
      route: '/oauth/callback?error=access_denied&error_description=Sign-in%20cancelled',
    });

    expect(await screen.findByRole('heading', { name: 'Authentication Failed' })).toBeInTheDocument();
  });

  it('renders the not-found page for an unknown route', async () => {
    renderWithProviders(<AppRoutes />, { route: '/does-not-exist' });

    expect(await screen.findByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument();
    expect(document.title).toBe('Page Not Found | Quizzence');
  });
});

describe('AppRoutes protected routes', () => {
  it.each(protectedRoutes)('redirects an unauthenticated visitor from %s to login', async (route) => {
    renderWithProviders(<AppRoutes />, { route });

    expect(await screen.findByRole('heading', { level: 1, name: 'Quizzence' })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.title).toBe('Log In | Quizzence');
    });
  });
});
