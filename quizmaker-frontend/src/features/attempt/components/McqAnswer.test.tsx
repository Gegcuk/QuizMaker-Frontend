import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import McqAnswer from './McqAnswer';
import type { QuestionForAttemptDto } from '../types/attempt.types';

const multiChoiceQuestion: QuestionForAttemptDto = {
  id: 'mcq-multi-question',
  type: 'MCQ_MULTI',
  difficulty: 'MEDIUM',
  questionText: 'Select the correct answers.',
  safeContent: {
    options: [
      { id: 'a', text: 'First option' },
      { id: 'b', text: 'Second option' },
    ],
  },
};

describe('McqAnswer', () => {
  it('checks the native multi-choice checkbox without forcing a white background', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <McqAnswer
        question={multiChoiceQuestion}
        onAnswerChange={onAnswerChange}
      />,
      { withAuthProvider: false },
    );

    const firstInput = screen.getByLabelText('Select option A');
    const secondInput = screen.getByLabelText('Select option B');

    expect(firstInput).not.toBeChecked();
    expect(firstInput).not.toHaveClass('bg-theme-bg-primary');
    expect(secondInput).not.toHaveClass('bg-theme-bg-primary');

    await user.click(firstInput);

    expect(firstInput).toBeChecked();
    expect(onAnswerChange).toHaveBeenLastCalledWith(['a']);
  });
});
