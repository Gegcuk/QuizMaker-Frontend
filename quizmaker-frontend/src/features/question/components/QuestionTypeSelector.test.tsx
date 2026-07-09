import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import QuestionTypeSelector from './QuestionTypeSelector';

const supportedQuestionTypes = [
  ['Single Choice', 'MCQ_SINGLE'],
  ['Multiple Choice', 'MCQ_MULTI'],
  ['True/False', 'TRUE_FALSE'],
  ['Open Ended', 'OPEN'],
  ['Fill in the Blank', 'FILL_GAP'],
  ['Compliance', 'COMPLIANCE'],
  ['Ordering', 'ORDERING'],
  ['Hotspot', 'HOTSPOT'],
  ['Matching', 'MATCHING'],
] as const;

describe('QuestionTypeSelector', () => {
  it('offers every question type supported by the backend schema', () => {
    renderWithProviders(
      <QuestionTypeSelector onTypeChange={vi.fn()} />,
      { withAuthProvider: false },
    );

    supportedQuestionTypes.forEach(([label]) => {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
    });
  });

  it('reports the selected type and reflects the controlled selected state', async () => {
    const onTypeChange = vi.fn();
    const { rerender, user } = renderWithProviders(
      <QuestionTypeSelector onTypeChange={onTypeChange} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /Hotspot/ }));
    expect(onTypeChange).toHaveBeenCalledWith('HOTSPOT');

    rerender(
      <QuestionTypeSelector selectedType="HOTSPOT" onTypeChange={onTypeChange} />,
    );

    expect(screen.getByRole('button', { name: /Hotspot/ })).toHaveClass(
      'border-theme-interactive-primary',
    );
  });
});
