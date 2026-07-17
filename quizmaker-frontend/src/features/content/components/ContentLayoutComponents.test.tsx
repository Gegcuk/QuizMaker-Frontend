import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { ArticleData } from '@/features/blog/types';
import ArticleLayout from '@/features/blog/components/ArticleLayout';
import { TimelineView } from '@/features/roadmap/components/TimelineView';

const article: ArticleData = {
  slug: 'retrieval-practice', title: 'Retrieval Practice', description: 'Learn by recalling.',
  heroKicker: 'Learning science', author: { name: 'Ada Lovelace', title: 'Founder' },
  publishedAt: '2026-01-10T00:00:00Z', readingTime: '4 min read', tags: ['learning'],
  stats: [{ label: 'Retention', value: '13%', detail: 'Delayed-test improvement.', link: 'https://example.com/source' }],
  keyPoints: ['Recall strengthens memory.'],
  sections: [{ id: 'practice', title: 'Put it into practice', content: <p>Try a quiz today.</p> }],
  faqs: [{ question: 'Does it work?', answer: 'Yes, when used consistently.' }],
  checklist: ['Review the evidence.'],
  references: [{ title: 'Research source', url: 'https://example.com/research', sourceType: 'Study' }],
};

describe('content layout components', () => {
  it('renders article metadata, references, and toggles FAQ answers', async () => {
    const { user } = renderWithProviders(<ArticleLayout article={article} />, { withAuthProvider: false });
    expect(screen.getByRole('heading', { name: 'Retrieval Practice' })).toBeInTheDocument();
    expect(screen.getByText('13%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Research source' })).toHaveAttribute('href', 'https://example.com/research');
    expect(screen.queryByText('Yes, when used consistently.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Does it work/ }));
    expect(screen.getByText('Yes, when used consistently.')).toBeInTheDocument();
  });

  it('renders roadmap milestones and their feature status metadata', () => {
    renderWithProviders(<TimelineView />, { withAuthProvider: false });
    expect(screen.getByText('Import Quizzes')).toBeInTheDocument();
    expect(screen.getByText('Image-Based Questions')).toBeInTheDocument();
    expect(screen.getAllByText('high').length).toBeGreaterThan(0);
  });
});
