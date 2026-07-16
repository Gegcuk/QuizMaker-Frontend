import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { AttemptResultDto } from '@/types';
import ScoreDisplay from './ScoreDisplay';

const result = (overrides: Partial<AttemptResultDto> = {}): AttemptResultDto => ({
  attemptId: '11111111-1111-4111-8111-111111111111',
  quizId: '22222222-2222-4222-8222-222222222222',
  userId: '33333333-3333-4333-8333-333333333333',
  startedAt: '2026-07-16T10:00:00Z',
  completedAt: '2026-07-16T10:05:00Z',
  totalScore: 9,
  correctCount: 9,
  totalQuestions: 10,
  answers: [],
  ...overrides,
});

describe('ScoreDisplay', () => {
  it('shows grade, achievement, and detailed metrics for a high score', () => {
    renderWithProviders(<ScoreDisplay result={result()} />, { withAuthProvider: false });

    expect(screen.getByText('Grade: A+')).toBeInTheDocument();
    expect(screen.getByText('🏆 Perfect Score')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Performance Metrics' })).toBeInTheDocument();
    expect(screen.getByText('9/10')).toBeInTheDocument();
  });

  it('keeps all score values finite for an empty attempt', () => {
    const { container } = renderWithProviders(
      <ScoreDisplay result={result({ totalQuestions: 0, totalScore: 0, correctCount: 0 })} />,
      { withAuthProvider: false },
    );

    expect(container).toHaveTextContent('0%');
    expect(container).not.toHaveTextContent('NaN');
    expect(container).not.toHaveTextContent('Infinity');
  });
});
