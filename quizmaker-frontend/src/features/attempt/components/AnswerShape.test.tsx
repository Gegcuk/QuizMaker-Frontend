import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import FillGapAnswer from './FillGapAnswer';
import HotspotAnswer from './HotspotAnswer';
import McqAnswer from './McqAnswer';
import { MatchingAnswer } from './MatchingAnswer';
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
  it('emits an option id from single-choice selection', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <McqAnswer
        question={{
          ...baseQuestion,
          type: 'MCQ_SINGLE',
          questionText: 'Choose one option.',
          safeContent: {
            options: [
              { id: 'a', text: 'First option' },
              { id: 'b', text: 'Second option' },
            ],
          },
        }}
        onAnswerChange={onAnswerChange}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByLabelText('Select option B'));

    expect(onAnswerChange).toHaveBeenLastCalledWith('b');
  });

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

  it('emits a predefined region id from hotspot selection and null when cleared', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <HotspotAnswer
        question={{
          ...baseQuestion,
          type: 'HOTSPOT',
          questionText: 'Select the highlighted structure.',
          safeContent: {
            imageUrl: '',
            regions: [
              { id: 1, x: 5, y: 5, width: 30, height: 30 },
              { id: 2, x: 55, y: 55, width: 30, height: 30 },
            ],
          },
        }}
        onAnswerChange={onAnswerChange}
      />,
      { withAuthProvider: false },
    );

    const secondRegion = screen.getByRole('button', { name: 'Select region 2' });
    await user.click(secondRegion);

    expect(secondRegion).toHaveAttribute('aria-pressed', 'true');
    expect(onAnswerChange).toHaveBeenLastCalledWith(2);

    await user.click(screen.getByRole('button', { name: 'Clear Selection' }));

    expect(onAnswerChange).toHaveBeenLastCalledWith(null);
  });

  it('emits matching pairs after selecting one item from each column', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <MatchingAnswer
        question={{
          ...baseQuestion,
          type: 'MATCHING',
          questionText: 'Match each term.',
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
        }}
        currentAnswer={{ matches: [] }}
        onAnswerChange={onAnswerChange}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /mitochondria/i }));
    await user.click(screen.getByRole('button', { name: /produces atp/i }));

    expect(onAnswerChange).toHaveBeenLastCalledWith({
      matches: [{ leftId: 1, rightId: 10 }],
    });
  });
});
