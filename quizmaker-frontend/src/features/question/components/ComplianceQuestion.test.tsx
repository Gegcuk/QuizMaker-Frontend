import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuestionDto } from '@/types';
import ComplianceQuestion from './ComplianceQuestion';

const makeQuestion = (): QuestionDto => ({
  id: 'compliance-question',
  type: 'COMPLIANCE',
  difficulty: 'HARD',
  questionText: 'Evaluate the following actions.',
  content: {
    statements: [
      { id: 1, text: 'Consent is recorded.', compliant: true },
      { id: 2, text: 'Consent is assumed.', compliant: false },
      { id: 3, text: 'Users can unsubscribe.', compliant: true },
    ],
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  quizIds: [],
  tagIds: [],
});

describe('ComplianceQuestion', () => {
  it('submits statement selection once from native checkboxes and cards', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <ComplianceQuestion question={makeQuestion()} onAnswerChange={onAnswerChange} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByLabelText('Select statement 1'));
    expect(onAnswerChange).toHaveBeenCalledTimes(1);
    expect(onAnswerChange).toHaveBeenLastCalledWith([1]);

    await user.click(screen.getByText('Consent is assumed.'));
    expect(onAnswerChange).toHaveBeenCalledTimes(2);
    expect(onAnswerChange).toHaveBeenLastCalledWith([2]);
  });

  it('does not submit selection changes while disabled', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <ComplianceQuestion
        question={makeQuestion()}
        currentAnswer={[1]}
        onAnswerChange={onAnswerChange}
        disabled
      />,
      { withAuthProvider: false },
    );

    const selectedInput = screen.getByLabelText('Select statement 1');
    await user.click(selectedInput);

    expect(selectedInput).toBeDisabled();
    expect(onAnswerChange).not.toHaveBeenCalled();
  });

  it('shows sanitized compliant statements and review analysis', () => {
    const { container } = renderWithProviders(
      <ComplianceQuestion
        question={{
          ...makeQuestion(),
          content: {
            statements: [
              { id: 1, text: '<strong>Consent</strong><script>attack()</script>', compliant: true },
              { id: 2, text: 'Consent is assumed.', compliant: false },
            ],
          },
        }}
        currentAnswer={[1, 2]}
        showCorrectAnswer
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Compliance Analysis')).toBeInTheDocument();
    expect(screen.getByText('Correctly identified compliant statements:')).toBeInTheDocument();
    expect(screen.getAllByText('Consent')[0].tagName).toBe('STRONG');
    expect(container.querySelector('script')).not.toBeInTheDocument();
  });
});
