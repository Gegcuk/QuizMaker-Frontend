import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, waitFor } from '@/test/render';
import { MatchingAnswer } from './MatchingAnswer';
import type { QuestionForAttemptDto } from '../types/attempt.types';

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
});
