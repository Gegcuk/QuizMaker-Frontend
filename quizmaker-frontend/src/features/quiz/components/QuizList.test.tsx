import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuizDto } from '@/types';
import QuizList from './QuizList';

vi.mock('../hooks', () => ({
  useQuizMetadata: () => ({
    getTagName: (tagId: string) => tagId,
    getCategoryName: () => 'Architecture',
  }),
  useCreateGroup: () => ({ handleCreateGroup: vi.fn() }),
}));

vi.mock('./QuizGroupMenu', () => ({ default: () => null }));
vi.mock('./CreateGroupModal', () => ({ default: () => null }));

const quiz = (id: string, status: QuizDto['status']): QuizDto => ({
  id,
  createdAt: '2026-07-11T09:00:00.000Z',
  updatedAt: '2026-07-11T09:00:00.000Z',
  creatorId: 'user-1',
  categoryId: 'category-1',
  title: status === 'PUBLISHED' ? 'Published architecture' : 'Draft architecture',
  description: 'A software architecture quiz.',
  visibility: 'PUBLIC',
  difficulty: 'MEDIUM',
  status,
  estimatedTime: 90,
  isRepetitionEnabled: true,
  timerEnabled: false,
  timerDuration: 0,
  tagIds: [],
});

describe('QuizList', () => {
  it('renders loading and empty states', () => {
    const { container, rerender } = renderWithProviders(
      <QuizList quizzes={[]} isLoading />,
      { withAuthProvider: false },
    );

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(5);

    rerender(<QuizList quizzes={[]} />);

    expect(screen.getByRole('heading', { name: 'No quizzes found' })).toBeInTheDocument();
  });

  it('shows quiz metadata and only starts published quizzes', async () => {
    const onStart = vi.fn();
    const onSelectAll = vi.fn();
    const publishedQuiz = quiz('quiz-published', 'PUBLISHED');
    const draftQuiz = quiz('quiz-draft', 'DRAFT');
    const { user } = renderWithProviders(
      <QuizList
        quizzes={[publishedQuiz, draftQuiz]}
        onStart={onStart}
        onSelectAll={onSelectAll}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getAllByText('1h 30m')).toHaveLength(2);
    expect(screen.getAllByText('Architecture')).toHaveLength(2);
    expect(screen.getAllByText('Multiple attempts')).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'View Details' })[0]).toHaveAttribute(
      'href',
      '/quizzes/quiz-published',
    );

    const startButtons = screen.getAllByRole('button', { name: 'Start Quiz' });
    const publishedStartButton = startButtons.find((button) => !button.hasAttribute('disabled'));
    const draftStartButton = startButtons.find((button) => button.hasAttribute('disabled'));

    expect(publishedStartButton).toBeDefined();
    expect(draftStartButton).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: 'Select All (0/2)' }));
    await user.click(publishedStartButton!);

    expect(onSelectAll).toHaveBeenCalledWith(true, expect.anything());
    expect(onStart).toHaveBeenCalledWith('quiz-published');
  });
});
