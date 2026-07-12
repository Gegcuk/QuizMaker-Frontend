import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import HomePage from './HomePage';

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  useAuth: authMocks.useAuth,
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.useAuth.mockReturnValue({ isLoggedIn: false });
  });

  it('renders descriptive, synchronized homepage metadata', async () => {
    renderWithProviders(<HomePage />, { withAuthProvider: false });

    await waitFor(() => {
      expect(document.title).toBe('AI Quiz Generator for Students & Teachers | Quizzence');
    });

    const description = document.head.querySelector('meta[name="description"]');
    expect(description).toHaveAttribute(
      'content',
      'Create AI-powered quizzes from text, PDFs, or links. Practise retrieval, learn with feedback, and revisit key ideas with Quizzence.',
    );
    expect(document.head.querySelector('meta[property="og:title"]')).toHaveAttribute(
      'content',
      document.title,
    );
    expect(document.head.querySelector('meta[name="twitter:description"]')).toHaveAttribute(
      'content',
      description?.getAttribute('content'),
    );
    expect(document.title.length).toBeGreaterThanOrEqual(50);
    expect(document.title.length).toBeLessThanOrEqual(60);
    expect(description?.getAttribute('content')?.length).toBeLessThanOrEqual(160);
  });

  it('injects one valid Organization and WebSite JSON-LD graph', async () => {
    const { rerender } = renderWithProviders(<HomePage />, { withAuthProvider: false });

    await waitFor(() => {
      expect(document.head.querySelectorAll('script[type="application/ld+json"][data-seo="structured-data"]')).toHaveLength(1);
    });

    const script = document.head.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"][data-seo="structured-data"]',
    );
    expect(script?.textContent).toBeTruthy();

    const structuredData = JSON.parse(script?.textContent ?? '{}');
    expect(structuredData).toEqual({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://www.quizzence.com/#organization',
          name: 'Quizzence',
          url: 'https://www.quizzence.com/',
          sameAs: [
            'https://github.com/Gegcuk/',
            'https://www.linkedin.com/in/alekseylazunin/',
          ],
        },
        {
          '@type': 'WebSite',
          '@id': 'https://www.quizzence.com/#website',
          name: 'Quizzence',
          url: 'https://www.quizzence.com/',
          publisher: {
            '@id': 'https://www.quizzence.com/#organization',
          },
        },
      ],
    });

    rerender(<HomePage />);

    await waitFor(() => {
      expect(document.head.querySelectorAll('script[type="application/ld+json"][data-seo="structured-data"]')).toHaveLength(1);
    });
  });

  it('uses an ordered heading hierarchy and provides substantive public-page content', () => {
    renderWithProviders(<HomePage />, { withAuthProvider: false });

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Create AI quizzes that help students learn and remember',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /how quizzence turns study material/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Start with your material' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /questions students ask/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Read the retrieval-practice research' })).toHaveAttribute(
      'href',
      '/blog/retrieval-practice-fastest-way-to-make-learning-stick/',
    );
    expect(screen.getByRole('link', { name: 'Explore all frequently asked questions' })).toHaveAttribute(
      'href',
      '/faq',
    );
  });

  it('keeps guest calls to action available', () => {
    renderWithProviders(<HomePage />, { withAuthProvider: false });

    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });
});
