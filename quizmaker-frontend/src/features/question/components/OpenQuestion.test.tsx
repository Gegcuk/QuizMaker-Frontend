import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen } from '@/test/render';
import type { QuestionDto } from '@/types';
import OpenQuestion from './OpenQuestion';

const makeQuestion = (answer = 'Cellular respiration produces ATP.'): QuestionDto => ({
  id: 'open-question',
  type: 'OPEN',
  difficulty: 'HARD',
  questionText: 'Explain cellular respiration.',
  content: { answer },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  quizIds: [],
  tagIds: [],
});

describe('OpenQuestion', () => {
  it('submits free-text answer changes', async () => {
    const onAnswerChange = vi.fn();
    renderWithProviders(
      <OpenQuestion question={makeQuestion()} onAnswerChange={onAnswerChange} />,
      { withAuthProvider: false },
    );

    fireEvent.change(screen.getByLabelText('Your Answer'), {
      target: { value: 'ATP' },
    });

    expect(onAnswerChange).toHaveBeenCalledWith('ATP');
  });

  it('keeps the answer textarea read-only when disabled', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <OpenQuestion
        question={makeQuestion()}
        currentAnswer="Existing answer"
        onAnswerChange={onAnswerChange}
        disabled
      />,
      { withAuthProvider: false },
    );

    const answerInput = screen.getByLabelText('Your Answer');
    await user.type(answerInput, ' should not change');

    expect(answerInput).toBeDisabled();
    expect(onAnswerChange).not.toHaveBeenCalled();
  });

  it('shows sanitized model-answer and analysis content in review mode', () => {
    const { container } = renderWithProviders(
      <OpenQuestion
        question={makeQuestion('<strong>ATP</strong><script>attack()</script>')}
        currentAnswer="It produces ATP."
        showCorrectAnswer
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('ATP').tagName).toBe('STRONG');
    expect(screen.getByText('Answer Analysis')).toBeInTheDocument();
    expect(container.querySelector('script')).not.toBeInTheDocument();
  });
});
