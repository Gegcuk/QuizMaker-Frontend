import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { AttemptResultDto } from '@/types';
import AttemptResult from './AttemptResult';

const result: AttemptResultDto = {
  attemptId: '11111111-1111-4111-8111-111111111111',
  quizId: '22222222-2222-4222-8222-222222222222',
  userId: '33333333-3333-4333-8333-333333333333',
  startedAt: '2026-07-16T10:00:00Z',
  completedAt: '2026-07-16T10:05:30Z',
  totalScore: 10,
  correctCount: 10,
  totalQuestions: 10,
  answers: [],
};

describe('AttemptResult', () => {
  it('renders a completed perfect attempt and runs every supplied action', async () => {
    const onReview = vi.fn();
    const onRetake = vi.fn();
    const onShare = vi.fn();
    const { user } = renderWithProviders(
      <AttemptResult
        result={result}
        quizTitle="Architecture Fundamentals"
        onReview={onReview}
        onRetake={onRetake}
        onShare={onShare}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Quiz Complete!' })).toBeInTheDocument();
    expect(screen.getByText('Architecture Fundamentals')).toBeInTheDocument();
    expect(screen.getAllByText('100%')).toHaveLength(4);
    expect(screen.getByText('Perfect Score Achievement!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /review answers/i }));
    await user.click(screen.getByRole('button', { name: /retake quiz/i }));
    await user.click(screen.getByRole('button', { name: /share results/i }));

    expect(onReview).toHaveBeenCalledOnce();
    expect(onRetake).toHaveBeenCalledOnce();
    expect(onShare).toHaveBeenCalledOnce();
  });
});
