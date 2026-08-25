import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import { ManualQuizConfigurationForm } from './ManualQuizConfigurationForm';

describe('ManualQuizConfigurationForm', () => {
  it('blocks creation while keeping missing title guidance keyboard reachable', async () => {
    const onCreateQuiz = vi.fn();
    const { user } = renderWithProviders(
      <ManualQuizConfigurationForm
        quizData={{}}
        onDataChange={vi.fn()}
        errors={{}}
        onCreateQuiz={onCreateQuiz}
        isCreating={false}
      />,
      { withAuthProvider: false },
    );

    const createButton = screen.getByRole('button', { name: 'Create Quiz & Add Questions' });
    expect(createButton).not.toBeDisabled();
    expect(createButton).toHaveAttribute('aria-disabled', 'true');
    expect(createButton).toHaveAccessibleDescription(expect.stringContaining('Quiz title is required'));

    await user.click(createButton);
    expect(onCreateQuiz).not.toHaveBeenCalled();
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
