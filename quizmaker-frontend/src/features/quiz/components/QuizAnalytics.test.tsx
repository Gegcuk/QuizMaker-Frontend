import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuizResultSummaryDto } from '@/types';
import QuizAnalytics from './QuizAnalytics';

const featureFlag = vi.hoisted(() => ({ advancedAnalytics: false }));

vi.mock('@/utils', async () => {
  const actual = await vi.importActual<typeof import('@/utils')>('@/utils');
  return {
    ...actual,
    useFeatureFlag: () => featureFlag.advancedAnalytics,
  };
});

const stats: QuizResultSummaryDto = {
  quizId: 'quiz-1',
  attemptsCount: 20,
  averageScore: 74,
  bestScore: 98,
  worstScore: 32,
  passRate: 75,
  questionStats: [
    { questionId: 'question-1', timesAsked: 10, timesCorrect: 8, correctRate: 80 },
  ],
};

afterEach(() => {
  featureFlag.advancedAnalytics = false;
});

describe('QuizAnalytics', () => {
  it('shows the feature-flag notice when advanced analytics is unavailable', () => {
    renderWithProviders(<QuizAnalytics stats={stats} />, { withAuthProvider: false });

    expect(screen.getByText('Advanced analytics features are currently disabled.')).toBeInTheDocument();
  });

  it('renders chart data and switches to question performance when enabled', async () => {
    featureFlag.advancedAnalytics = true;
    const { user } = renderWithProviders(<QuizAnalytics stats={stats} />, {
      withAuthProvider: false,
    });

    expect(screen.getByRole('heading', { name: 'Score Distribution' })).toBeInTheDocument();
    expect(screen.getByText('20 total attempts')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Question Performance' }));

    expect(screen.getByRole('heading', { name: 'Question Performance' })).toBeInTheDocument();
    expect(screen.getByText('8/10 correct')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });
});
