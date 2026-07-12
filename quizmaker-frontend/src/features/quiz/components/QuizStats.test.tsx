import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuizResultSummaryDto } from '@/types';
import QuizStats from './QuizStats';

const stats: QuizResultSummaryDto = {
  quizId: 'quiz-1',
  attemptsCount: 4,
  averageScore: 8,
  bestScore: 4,
  worstScore: 1,
  passRate: 75,
  questionStats: [
    { questionId: 'question-1', timesAsked: 4, timesCorrect: 3, correctRate: 75 },
    { questionId: 'question-2', timesAsked: 4, timesCorrect: 2, correctRate: 50 },
    { questionId: 'question-3', timesAsked: 4, timesCorrect: 4, correctRate: 100 },
    { questionId: 'question-4', timesAsked: 4, timesCorrect: 1, correctRate: 25 },
  ],
};

describe('QuizStats', () => {
  it('converts raw score totals to displayed percentages', () => {
    renderWithProviders(<QuizStats stats={stats} />, { withAuthProvider: false });

    expect(screen.getByRole('heading', { name: 'Quiz Statistics' })).toBeInTheDocument();
    expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('100%').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('25%')).toHaveLength(1);
    expect(screen.getByText('Total Questions')).toBeInTheDocument();
    expect(screen.getByText('Total questions asked')).toBeInTheDocument();
  });

  it('renders finite zero percentages when there are no attempts or questions', () => {
    const { container } = renderWithProviders(
      <QuizStats
        stats={{ ...stats, attemptsCount: 0, averageScore: 0, bestScore: 0, worstScore: 0, passRate: 0, questionStats: [] }}
        useContainer={false}
      />,
      { withAuthProvider: false },
    );

    expect(container).toHaveTextContent('0%');
    expect(container).not.toHaveTextContent('NaN');
    expect(container).not.toHaveTextContent('Infinity');
  });
});
