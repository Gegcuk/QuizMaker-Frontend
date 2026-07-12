import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuizDto } from '@/types';
import QuizGrid from './QuizGrid';

vi.mock('./', () => ({
  QuizCard: ({
    quiz,
    isSelected,
    onSelect,
  }: {
    quiz: QuizDto;
    isSelected?: boolean;
    onSelect?: (quizId: string, selected: boolean) => void;
  }) => (
    <button type="button" onClick={() => onSelect?.(quiz.id, !isSelected)}>
      {quiz.title}: {isSelected ? 'selected' : 'unselected'}
    </button>
  ),
}));

const quiz = (id: string, title: string): QuizDto => ({
  id,
  createdAt: '2026-07-11T09:00:00.000Z',
  updatedAt: '2026-07-11T09:00:00.000Z',
  creatorId: 'user-1',
  title,
  visibility: 'PRIVATE',
  difficulty: 'MEDIUM',
  status: 'DRAFT',
  estimatedTime: 15,
  isRepetitionEnabled: false,
  timerEnabled: false,
  timerDuration: 0,
  tagIds: [],
});

describe('QuizGrid', () => {
  it('renders loading and empty states', () => {
    const { container, rerender } = renderWithProviders(
      <QuizGrid quizzes={[]} isLoading />,
      { withAuthProvider: false },
    );

    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(8);

    rerender(<QuizGrid quizzes={[]} />);

    expect(screen.getByRole('heading', { name: 'No quizzes found' })).toBeInTheDocument();
  });

  it('forwards selection state and selection actions to quiz cards', async () => {
    const onSelect = vi.fn();
    const onSelectAll = vi.fn();
    const { user } = renderWithProviders(
      <QuizGrid
        quizzes={[quiz('quiz-1', 'Architecture'), quiz('quiz-2', 'Security')]}
        selectedQuizzes={['quiz-1']}
        onSelect={onSelect}
        onSelectAll={onSelectAll}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('button', { name: 'Architecture: selected' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Security: unselected' })).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Select All (1/2)' }));
    await user.click(screen.getByRole('button', { name: 'Security: unselected' }));

    expect(onSelectAll).toHaveBeenCalledWith(true, expect.anything());
    expect(onSelect).toHaveBeenCalledWith('quiz-2', true);
  });
});
