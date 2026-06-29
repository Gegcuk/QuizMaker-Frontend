import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { MatchingAnswer } from './MatchingAnswer';
import type { QuestionForAttemptDto } from '../types/attempt.types';

type MatchingValue = {
  matches: Array<{ leftId: number; rightId: number }>;
};

const matchingQuestion: QuestionForAttemptDto = {
  id: 'matching-question',
  type: 'MATCHING',
  difficulty: 'MEDIUM',
  questionText: 'Match each term with its definition.',
  safeContent: {
    left: [
      { id: 1, text: 'Mitochondria' },
      { id: 2, text: 'Ribosome' },
    ],
    right: [
      { id: 10, text: 'Produces ATP' },
      { id: 20, text: 'Builds proteins' },
    ],
  },
};

describe('MatchingAnswer responsive feedback lines', () => {
  it('keeps correct-answer connection lines hidden on small screens and visible from md up', async () => {
    const { container } = renderWithProviders(
      <MatchingAnswer
        question={matchingQuestion}
        currentAnswer={{ matches: [{ leftId: 1, rightId: 20 }] }}
        onAnswerChange={vi.fn()}
        showFeedback
        isCorrect={false}
        correctAnswer={{
          pairs: [
            { leftId: 1, rightId: 10 },
            { leftId: 2, rightId: 20 },
          ],
        }}
      />,
      { withAuthProvider: false },
    );

    await waitFor(() => {
      expect(container.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
    });

    const lineLayer = container.querySelector('svg[aria-hidden="true"]');

    expect(lineLayer).toHaveClass('hidden');
    expect(lineLayer).toHaveClass('md:block');
    expect(lineLayer).toHaveClass('pointer-events-none');
  });

  it('allows a chosen pair to be removed from its right-column option', async () => {
    const onAnswerChange = vi.fn();

    const ControlledMatchingAnswer = () => {
      const [answer, setAnswer] = useState<MatchingValue>({ matches: [] });

      const handleAnswerChange = (nextAnswer: MatchingValue) => {
        setAnswer(nextAnswer);
        onAnswerChange(nextAnswer);
      };

      return (
        <MatchingAnswer
          question={matchingQuestion}
          currentAnswer={answer}
          onAnswerChange={handleAnswerChange}
        />
      );
    };

    const { user } = renderWithProviders(<ControlledMatchingAnswer />, {
      withAuthProvider: false,
    });

    await user.click(screen.getByRole('button', { name: /mitochondria/i }));
    await user.click(screen.getByRole('button', { name: /produces atp/i }));

    expect(onAnswerChange).toHaveBeenLastCalledWith({
      matches: [{ leftId: 1, rightId: 10 }],
    });

    await user.click(screen.getByRole('button', { name: /produces atp/i }));

    expect(onAnswerChange).toHaveBeenLastCalledWith({ matches: [] });
    expect(screen.getByText('0 of 2 matches completed')).toBeInTheDocument();
  });
});
