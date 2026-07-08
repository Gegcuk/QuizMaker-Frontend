import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen } from '@/test/render';
import type { QuestionDto } from '@/types';
import FillGapQuestion from './FillGapQuestion';

const makeQuestion = (): QuestionDto => ({
  id: 'fill-gap-question',
  type: 'FILL_GAP',
  difficulty: 'MEDIUM',
  questionText: 'Complete the sentence.',
  content: {
    text: 'Cellular respiration occurs in the {1} and produces {2}.',
    gaps: [
      { id: 1, answer: 'mitochondria' },
      { id: 2, answer: 'ATP' },
    ],
    options: ['mitochondria', 'ATP', 'chloroplast', 'ribosome', 'nucleus', 'oxygen', 'glucose', 'NADH'],
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  quizIds: [],
  tagIds: [],
});

describe('FillGapQuestion', () => {
  it('renders sentence gaps and submits answers by gap id', () => {
    const onAnswerChange = vi.fn();
    renderWithProviders(
      <FillGapQuestion question={makeQuestion()} onAnswerChange={onAnswerChange} />,
      { withAuthProvider: false },
    );

    const inputs = screen.getAllByRole('textbox');

    fireEvent.change(inputs[0], { target: { value: 'mitochondria' } });
    fireEvent.change(inputs[1], { target: { value: 'ATP' } });

    expect(onAnswerChange).toHaveBeenNthCalledWith(1, { 1: 'mitochondria' });
    expect(onAnswerChange).toHaveBeenNthCalledWith(2, { 1: 'mitochondria', 2: 'ATP' });
    expect(screen.getByText('2 of 2 gaps filled')).toBeInTheDocument();
  });

  it('syncs displayed answers when the parent currentAnswer changes', () => {
    const { rerender } = renderWithProviders(
      <FillGapQuestion
        question={makeQuestion()}
        currentAnswer={{ 1: 'mitochondria' }}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getAllByRole('textbox')[0]).toHaveValue('mitochondria');

    rerender(
      <FillGapQuestion
        question={makeQuestion()}
        currentAnswer={{ 1: 'chloroplast', 2: 'ATP' }}
      />,
    );

    expect(screen.getAllByRole('textbox')[0]).toHaveValue('chloroplast');
    expect(screen.getAllByRole('textbox')[1]).toHaveValue('ATP');
  });

  it('shows correct answers and review counts after submission', () => {
    renderWithProviders(
      <FillGapQuestion
        question={makeQuestion()}
        currentAnswer={{ 1: 'chloroplast', 2: 'ATP' }}
        showCorrectAnswer
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Correct Answers')).toBeInTheDocument();
    expect(screen.getByText('Your Answers')).toBeInTheDocument();
    expect(screen.getByText('You got 1 out of 2 gaps correct.')).toBeInTheDocument();
  });
});
