import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { CategoryDto, QuizDto } from '@/types';
import { CategoryAnalytics } from './CategoryAnalytics';

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

const quiz: QuizDto = {
  id: 'quiz-1',
  createdAt: '2026-07-16T09:00:00Z',
  updatedAt: '2026-07-16T10:00:00Z',
  creatorId: 'user-1',
  title: 'Architecture Quiz',
  visibility: 'PUBLIC',
  difficulty: 'MEDIUM',
  status: 'PUBLISHED',
  estimatedTime: 20,
  isRepetitionEnabled: true,
  timerEnabled: true,
  timerDuration: 15,
  tagIds: [],
};

describe('CategoryAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders category quiz analytics from the documented quiz collection response', async () => {
    quizMocks.getQuizzes.mockResolvedValue({ content: [quiz] });

    renderWithProviders(<CategoryAnalytics category={category} />, { withAuthProvider: false });

    expect(await screen.findByText('Category Analytics')).toBeInTheDocument();
    expect(quizMocks.getQuizzes).toHaveBeenCalledWith({ category: 'category-1', size: 1000 });
    expect(screen.getByText('Quiz Creation Trend')).toBeInTheDocument();
    expect(screen.getByText('Feature Usage')).toBeInTheDocument();
    expect(screen.getByText('Architecture Quiz')).toBeInTheDocument();
  });

  it('reports analytics loading failures', async () => {
    quizMocks.getQuizzes.mockRejectedValue(new Error('Analytics are unavailable.'));

    renderWithProviders(<CategoryAnalytics category={category} />, { withAuthProvider: false });

    expect(await screen.findByText('Analytics are unavailable.')).toBeInTheDocument();
  });
});
