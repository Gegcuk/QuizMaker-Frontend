import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { AnswerSubmissionDto, AttemptResultDto } from '@/types';
import FeedbackDisplay from './FeedbackDisplay';

const result: AttemptResultDto = {
  attemptId: '11111111-1111-4111-8111-111111111111',
  quizId: '22222222-2222-4222-8222-222222222222',
  userId: '33333333-3333-4333-8333-333333333333',
  startedAt: '2026-07-16T10:00:00Z',
  completedAt: '2026-07-16T10:05:00Z',
  totalScore: 8,
  correctCount: 8,
  totalQuestions: 10,
  answers: [],
};

const answers: AnswerSubmissionDto[] = [
  {
    answerId: 'answer-1',
    questionId: 'question-1',
    isCorrect: true,
    score: 1,
    answeredAt: '2026-07-16T10:01:00Z',
  },
  {
    answerId: 'answer-2',
    questionId: 'question-2',
    isCorrect: false,
    score: 0,
    answeredAt: '2026-07-16T10:02:00Z',
  },
];

describe('FeedbackDisplay', () => {
  it('uses attempt and answer correctness data to generate feedback', () => {
    renderWithProviders(<FeedbackDisplay result={result} answers={answers} />, { withAuthProvider: false });

    expect(screen.getByRole('heading', { name: 'Performance Feedback' })).toBeInTheDocument();
    expect(screen.getByText('80% - VERY GOOD')).toBeInTheDocument();
    expect(screen.getByText('50% success rate')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Performance Insights' }).parentElement).toHaveTextContent(
      'Focus on reviewing 1 incorrect answers',
    );
    expect(screen.getByRole('heading', { name: 'Next Steps' }).parentElement).toHaveTextContent(
      'Consider taking advanced or related quizzes',
    );
  });

  it('keeps answer success rates finite when an attempt has no answers', () => {
    const { container } = renderWithProviders(
      <FeedbackDisplay result={{ ...result, totalQuestions: 0, totalScore: 0, correctCount: 0 }} answers={[]} />,
      { withAuthProvider: false },
    );

    expect(container).not.toHaveTextContent('NaN');
    expect(container).not.toHaveTextContent('Infinity');
  });
});
