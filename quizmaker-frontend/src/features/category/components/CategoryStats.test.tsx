import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { CategoryDto, QuizDto } from '@/types';
import { CategoryStats } from './CategoryStats';

const quizMocks = vi.hoisted(() => ({
  getQuizzes: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  categoryService: {},
  QuizService: class {
    getQuizzes = quizMocks.getQuizzes;
  },
}));

const category: CategoryDto = {
  id: 'category-1',
  name: 'Architecture',
  description: 'System design',
};

const quiz = (overrides: Partial<QuizDto> = {}): QuizDto => ({
  id: 'quiz-1',
  createdAt: '2026-07-15T09:00:00Z',
  updatedAt: '2026-07-15T10:00:00Z',
  creatorId: 'user-1',
  title: 'Architecture Quiz',
  visibility: 'PUBLIC',
  difficulty: 'EASY',
  status: 'PUBLISHED',
  estimatedTime: 20,
  isRepetitionEnabled: true,
  timerEnabled: true,
  timerDuration: 15,
  tagIds: [],
  ...overrides,
});

describe('CategoryStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates summary metrics from quizzes in the selected category', async () => {
    quizMocks.getQuizzes.mockResolvedValue({
      content: [quiz(), quiz({ id: 'quiz-2', difficulty: 'HARD', status: 'DRAFT', visibility: 'PRIVATE' })],
    });

    renderWithProviders(<CategoryStats category={category} />, { withAuthProvider: false });

    expect(await screen.findByText('Category Statistics')).toBeInTheDocument();
    expect(quizMocks.getQuizzes).toHaveBeenCalledWith({ category: 'category-1', size: 1000 });
    expect(screen.getByText('Total Quizzes')).toBeInTheDocument();
    expect(screen.getByText('Difficulty Distribution')).toBeInTheDocument();
    expect(screen.getByText('Timer Enabled')).toBeInTheDocument();
  });

  it('shows the service failure instead of stale statistics', async () => {
    quizMocks.getQuizzes.mockRejectedValue(new Error('Statistics are unavailable.'));

    renderWithProviders(<CategoryStats category={category} />, { withAuthProvider: false });

    expect(await screen.findByText('Statistics are unavailable.')).toBeInTheDocument();
  });
});
