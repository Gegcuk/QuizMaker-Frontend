import { Routes, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QuizResultSummaryDto } from '@/types';
import {
  renderWithProviders,
  screen,
  waitFor,
  within,
} from '@/test/render';
import QuizResultsSummaryPage from './QuizResultsSummaryPage';

const mocks = vi.hoisted(() => ({
  getQuizResults: vi.fn(),
}));

vi.mock('@/services', async importOriginal => {
  const actual = await importOriginal<typeof import('@/services')>();
  return {
    ...actual,
    getQuizResults: mocks.getQuizResults,
  };
});

const renderPage = () =>
  renderWithProviders(
    <Routes>
      <Route
        path="/quizzes/:quizId/results-summary"
        element={<QuizResultsSummaryPage />}
      />
    </Routes>,
    {
      route: '/quizzes/quiz-1/results-summary',
      withAuthProvider: false,
    },
  );

const resultSummary: QuizResultSummaryDto = {
  quizId: 'quiz-1',
  attemptsCount: 4,
  averageScore: 3,
  bestScore: 4,
  worstScore: 1,
  passRate: 75,
  questionStats: [
    { questionId: 'question-1', timesAsked: 4, timesCorrect: 3, correctRate: 75 },
    { questionId: 'question-2', timesAsked: 4, timesCorrect: 4, correctRate: 100 },
    { questionId: 'question-3', timesAsked: 4, timesCorrect: 2, correctRate: 50 },
    { questionId: 'question-4', timesAsked: 4, timesCorrect: 1, correctRate: 25 },
  ],
};

describe('QuizResultsSummaryPage', () => {
  beforeEach(() => {
    mocks.getQuizResults.mockReset();
  });

  it('converts raw scores once and renders backend percentages directly', async () => {
    mocks.getQuizResults.mockResolvedValue(resultSummary);

    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Quiz Results Summary' }),
    ).toBeInTheDocument();
    expect(mocks.getQuizResults).toHaveBeenCalledWith('quiz-1');

    const summary = screen.getByText('Attempts Count:').parentElement;
    expect(summary).not.toBeNull();
    expect(summary?.parentElement).toHaveTextContent('Average Score: 75.0%');
    expect(summary?.parentElement).toHaveTextContent('Best Score: 100.0%');
    expect(summary?.parentElement).toHaveTextContent('Worst Score: 25.0%');
    expect(summary?.parentElement).toHaveTextContent('Pass Rate: 75.0%');

    const questionRow = screen.getByText('question-1').closest('tr');
    expect(questionRow).not.toBeNull();
    expect(within(questionRow as HTMLTableRowElement).getByText('75.0%')).toBeInTheDocument();
    expect(screen.queryByText('7500.0%')).not.toBeInTheDocument();
  });

  it('renders finite zero percentages when there are no questions or attempts', async () => {
    mocks.getQuizResults.mockResolvedValue({
      ...resultSummary,
      attemptsCount: 0,
      averageScore: 0,
      bestScore: 0,
      worstScore: 0,
      passRate: 0,
      questionStats: [],
    });

    const { container } = renderPage();

    await screen.findByRole('heading', { name: 'Quiz Results Summary' });
    await waitFor(() => expect(container).toHaveTextContent('Average Score: 0.0%'));
    expect(container).toHaveTextContent('Best Score: 0.0%');
    expect(container).toHaveTextContent('Worst Score: 0.0%');
    expect(container).not.toHaveTextContent('NaN');
    expect(container).not.toHaveTextContent('Infinity');
  });
});
