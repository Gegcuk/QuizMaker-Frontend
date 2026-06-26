import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import FillGapAnswer from './FillGapAnswer';
import OpenAnswer from './OpenAnswer';
import OrderingAnswer from './OrderingAnswer';
import TrueFalseAnswer from './TrueFalseAnswer';
import type { QuestionForAttemptDto } from '../types/attempt.types';

const baseQuestion = {
  id: 'question-id',
  difficulty: 'MEDIUM',
  hint: null,
} satisfies Pick<QuestionForAttemptDto, 'id' | 'difficulty' | 'hint'>;

describe('attempt answer shape emissions', () => {
  it('emits a boolean from true/false selection', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <TrueFalseAnswer
        question={{
          ...baseQuestion,
          type: 'TRUE_FALSE',
          questionText: 'The sky is blue.',
          safeContent: {},
        }}
        onAnswerChange={onAnswerChange}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /false/i }));

    expect(onAnswerChange).toHaveBeenLastCalledWith(false);
  });

  it('emits text answers and clears open answers back to an empty string', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <OpenAnswer
        question={{
          ...baseQuestion,
          type: 'OPEN',
          questionText: 'Explain the decision.',
          safeContent: {},
        }}
        onAnswerChange={onAnswerChange}
        minLength={3}
        maxLength={50}
      />,
      { withAuthProvider: false },
    );

    await user.type(screen.getByPlaceholderText('Type your answer here...'), 'Clear rationale');

    expect(onAnswerChange).toHaveBeenLastCalledWith('Clear rationale');

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(onAnswerChange).toHaveBeenLastCalledWith('');
  });

  it('emits gap-id keyed records for manually typed fill-gap answers', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <FillGapAnswer
        question={{
          ...baseQuestion,
          type: 'FILL_GAP',
          questionText: 'Fill the gaps.',
          safeContent: {
            text: 'The {1} produces {2}.',
            gaps: [
              { id: 1, answer: 'mitochondria' },
              { id: 2, answer: 'ATP' },
            ],
          },
        }}
        onAnswerChange={onAnswerChange}
      />,
      { withAuthProvider: false },
    );

    const [firstGap, secondGap] = screen.getAllByRole('textbox');

    await user.type(firstGap, 'mitochondria');
    expect(onAnswerChange).toHaveBeenLastCalledWith({ 1: 'mitochondria' });

    await user.type(secondGap, 'ATP');
    expect(onAnswerChange).toHaveBeenLastCalledWith({ 1: 'mitochondria', 2: 'ATP' });
  });

  it('emits gap-id keyed records when fill-gap options are selected in order', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <FillGapAnswer
        question={{
          ...baseQuestion,
          type: 'FILL_GAP',
          questionText: 'Fill the gaps.',
          safeContent: {
            text: 'The {1} produces {2}.',
            gaps: [
              { id: 1, answer: 'mitochondria' },
              { id: 2, answer: 'ATP' },
            ],
            options: ['mitochondria', 'ATP', 'chlorophyll'],
          },
        }}
        onAnswerChange={onAnswerChange}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'mitochondria' }));
    expect(onAnswerChange).toHaveBeenLastCalledWith({ 1: 'mitochondria' });

    await user.click(screen.getByRole('button', { name: 'ATP' }));
    expect(onAnswerChange).toHaveBeenLastCalledWith({ 1: 'mitochondria', 2: 'ATP' });
  });

  it('emits item id arrays when ordering answers are initialized and moved', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <OrderingAnswer
        question={{
          ...baseQuestion,
          type: 'ORDERING',
          questionText: 'Arrange the lifecycle.',
          safeContent: {
            items: [
              { id: 1, text: 'Design' },
              { id: 2, text: 'Build' },
              { id: 3, text: 'Release' },
            ],
          },
        }}
        onAnswerChange={onAnswerChange}
      />,
      { withAuthProvider: false },
    );

    await waitFor(() => {
      expect(onAnswerChange).toHaveBeenCalledWith([1, 2, 3]);
    });

    await user.click(screen.getAllByTitle('Move down')[0]);

    expect(onAnswerChange).toHaveBeenLastCalledWith([2, 1, 3]);
  });
});
