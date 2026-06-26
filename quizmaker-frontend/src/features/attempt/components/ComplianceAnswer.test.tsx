import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import ComplianceAnswer from './ComplianceAnswer';
import type { QuestionForAttemptDto } from '../types/attempt.types';

const complianceQuestion: QuestionForAttemptDto = {
  id: 'compliance-question',
  type: 'COMPLIANCE',
  difficulty: 'MEDIUM',
  questionText: 'Evaluate which leadership-related actions comply.',
  safeContent: {
    statements: [
      { id: 1, text: 'An architect facilitates team collaboration.' },
      { id: 2, text: 'An architect avoids addressing team conflicts.' },
    ],
  },
};

describe('ComplianceAnswer', () => {
  it('checks selected statement inputs without forcing the checkbox background white', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <ComplianceAnswer
        question={complianceQuestion}
        currentAnswer={[1]}
        onAnswerChange={onAnswerChange}
      />,
      { withAuthProvider: false },
    );

    const selectedInput = screen.getByRole('checkbox', {
      name: /an architect facilitates team collaboration/i,
    });
    const unselectedInput = screen.getByRole('checkbox', {
      name: /an architect avoids addressing team conflicts/i,
    });

    expect(selectedInput).toBeChecked();
    expect(selectedInput).not.toHaveClass('bg-theme-bg-primary');
    expect(unselectedInput).not.toBeChecked();
    expect(unselectedInput).not.toHaveClass('bg-theme-bg-primary');

    await user.click(unselectedInput);

    expect(onAnswerChange).toHaveBeenLastCalledWith([1, 2]);
  });
});
