import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import { ManualQuizConfigurationForm } from './ManualQuizConfigurationForm';

describe('ManualQuizConfigurationForm', () => {
  it('keeps creation disabled until a title is supplied', () => {
    renderWithProviders(
      <ManualQuizConfigurationForm
        quizData={{}}
        onDataChange={vi.fn()}
        errors={{}}
        onCreateQuiz={vi.fn()}
        isCreating={false}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('button', { name: 'Create Quiz & Add Questions' })).toBeDisabled();
  });

  it('propagates changes and submits a valid manual quiz draft', async () => {
    const onDataChange = vi.fn();
    const onCreateQuiz = vi.fn();
    const { user } = renderWithProviders(
      <ManualQuizConfigurationForm
        quizData={{ title: 'Architecture fundamentals', difficulty: 'MEDIUM', estimatedTime: 20 }}
        onDataChange={onDataChange}
        errors={{}}
        onCreateQuiz={onCreateQuiz}
        isCreating={false}
      />,
      { withAuthProvider: false },
    );

    await user.clear(screen.getByPlaceholderText('Enter quiz title...'));
    await user.type(screen.getByPlaceholderText('Enter quiz title...'), 'Security fundamentals');
    await user.clear(screen.getByLabelText('Description'));
    await user.type(screen.getByLabelText('Description'), 'Core application security concepts.');
    await user.click(screen.getByRole('button', { name: 'Create Quiz & Add Questions' }));

    expect(onDataChange).toHaveBeenLastCalledWith(expect.objectContaining({
      title: 'Security fundamentals',
      description: 'Core application security concepts.',
    }));
    expect(onCreateQuiz).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Security fundamentals',
      description: 'Core application security concepts.',
    }));
  });
});
