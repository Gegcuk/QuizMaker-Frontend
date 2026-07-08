import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuestionDto } from '@/types';
import TrueFalseQuestion from './TrueFalseQuestion';

const makeQuestion = (answer = false): QuestionDto => ({
  id: 'true-false-question',
  type: 'TRUE_FALSE',
  difficulty: 'EASY',
  questionText: 'All cells contain a nucleus.',
  content: { answer },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  quizIds: [],
  tagIds: [],
});

describe('TrueFalseQuestion', () => {
  it('submits boolean answers once from both native inputs and option cards', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <TrueFalseQuestion question={makeQuestion()} onAnswerChange={onAnswerChange} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getAllByRole('radio')[0]);
    expect(onAnswerChange).toHaveBeenCalledTimes(1);
    expect(onAnswerChange).toHaveBeenLastCalledWith(true);

    await user.click(screen.getByText('False'));
    expect(onAnswerChange).toHaveBeenCalledTimes(2);
    expect(onAnswerChange).toHaveBeenLastCalledWith(false);
  });

  it('does not submit changes while disabled', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <TrueFalseQuestion
        question={makeQuestion()}
        onAnswerChange={onAnswerChange}
        disabled
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByText('True'));

    expect(onAnswerChange).not.toHaveBeenCalled();
    expect(screen.getAllByRole('radio')[0]).toBeDisabled();
  });

  it('shows the correct answer in review mode', () => {
    renderWithProviders(
      <TrueFalseQuestion
        question={makeQuestion(false)}
        currentAnswer
        showCorrectAnswer
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Correct Answer:')).toBeInTheDocument();
    expect(screen.getAllByText('False').length).toBeGreaterThan(0);
  });
});
