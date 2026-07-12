import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuizDto } from '@/types';
import QuizCard from './QuizCard';

vi.mock('../hooks', () => ({
  useQuizMetadata: () => ({
    getTagName: (tagId: string) => tagId === 'tag-architecture' ? 'architecture' : tagId,
    getCategoryName: () => 'Architecture',
  }),
  useCreateGroup: () => ({ handleCreateGroup: vi.fn() }),
}));

vi.mock('./QuizGroupMenu', () => ({ default: () => null }));
vi.mock('./CreateGroupModal', () => ({ default: () => null }));

const quiz = (status: QuizDto['status'] = 'PUBLISHED'): QuizDto => ({
  id: 'quiz-1',
  createdAt: '2026-07-11T09:00:00.000Z',
  updatedAt: '2026-07-11T09:00:00.000Z',
  creatorId: 'user-1',
  title: 'Architecture Leadership',
  visibility: 'PUBLIC',
  difficulty: 'MEDIUM',
  status,
  estimatedTime: 15,
  isRepetitionEnabled: false,
  timerEnabled: false,
  timerDuration: 0,
  tagIds: ['tag-architecture'],
  questionCount: 3,
});

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('QuizCard', () => {
  it('displays quiz details and forwards start and delete actions', async () => {
    const onStart = vi.fn();
    const onDelete = vi.fn();
    const { user } = renderWithProviders(
      <QuizCard quiz={quiz()} onStart={onStart} onDelete={onDelete} />,
      { withAuthProvider: false },
    );

    expect(screen.getAllByText('Architecture Leadership')).toHaveLength(2);
    expect(screen.getAllByText('#architecture')).toHaveLength(1);
    expect(screen.getAllByText('15 min')).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'View Details' })[0]).toHaveAttribute('href', '/quizzes/quiz-1');

    await user.click(screen.getAllByRole('button', { name: 'Start Quiz' })[0]);
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    expect(onStart).toHaveBeenCalledWith('quiz-1');
    expect(onDelete).toHaveBeenCalledWith('quiz-1');
  });

  it('disables starting a draft quiz in every responsive layout', () => {
    renderWithProviders(<QuizCard quiz={quiz('DRAFT')} onStart={vi.fn()} />, {
      withAuthProvider: false,
    });

    const startButtons = screen.getAllByRole('button', { name: 'Start Quiz' });

    expect(startButtons).toHaveLength(2);
    startButtons.forEach((button) => expect(button).toBeDisabled());
  });
});
