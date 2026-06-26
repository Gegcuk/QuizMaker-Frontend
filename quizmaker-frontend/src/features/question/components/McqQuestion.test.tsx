import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import McqQuestion from './McqQuestion';
import type { QuestionDto } from '@/types';

const multiChoiceQuestion: QuestionDto = {
  id: 'mcq-question',
  type: 'MCQ_MULTI',
  difficulty: 'MEDIUM',
  questionText: 'Select all correct answers.',
  content: {
    options: [
      { id: 'a', text: 'Correct option', correct: true },
      { id: 'b', text: 'Incorrect selected option', correct: false },
      { id: 'c', text: 'Unselected option', correct: false },
    ],
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  quizIds: [],
  tagIds: [],
};

describe('McqQuestion', () => {
  it('keeps feedback-state multi-choice checkboxes native and checked when selected', () => {
    renderWithProviders(
      <McqQuestion
        question={multiChoiceQuestion}
        currentAnswer={['b']}
        onAnswerChange={vi.fn()}
        showCorrectAnswer
        isMultiSelect
      />,
      { withAuthProvider: false },
    );

    const selectedIncorrectInput = screen.getByLabelText('Select option B');
    const correctUnselectedInput = screen.getByLabelText('Select option A');
    const normalUnselectedInput = screen.getByLabelText('Select option C');

    expect(selectedIncorrectInput).toBeChecked();
    expect(selectedIncorrectInput).toHaveClass('text-theme-interactive-danger');
    expect(selectedIncorrectInput).not.toHaveClass('bg-theme-bg-primary');

    expect(correctUnselectedInput).not.toBeChecked();
    expect(correctUnselectedInput).not.toHaveClass('bg-theme-bg-primary');
    expect(normalUnselectedInput).not.toBeChecked();
    expect(normalUnselectedInput).not.toHaveClass('bg-theme-bg-primary');
  });
});
