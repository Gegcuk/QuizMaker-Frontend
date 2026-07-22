import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import OrderingAnswer from './OrderingAnswer';
import type { QuestionForAttemptDto } from '../types/attempt.types';

const orderingQuestion: QuestionForAttemptDto = {
  id: 'ordering-question',
  type: 'ORDERING',
  difficulty: 'MEDIUM',
  questionText: 'Put the steps in order.',
  safeContent: {
    items: [
      { id: 1, media: { assetId: 'ordering-image', cdnUrl: 'https://cdn.example.test/ordering.png' } },
      { id: 2, text: 'Design the system' },
      { id: 3, text: 'Implement the design' },
    ],
  },
};

describe('OrderingAnswer', () => {
  it('renders a media-only ordering item and keeps the answer ID payload unchanged', () => {
    const onAnswerChange = vi.fn();

    renderWithProviders(
      <OrderingAnswer question={orderingQuestion} onAnswerChange={onAnswerChange} />,
      { withAuthProvider: false },
    );

    expect(screen.getByAltText('Ordering item 1 media')).toHaveAttribute(
      'src',
      'https://cdn.example.test/ordering.png',
    );
    expect(onAnswerChange).toHaveBeenLastCalledWith([1, 2, 3]);
  });
});
