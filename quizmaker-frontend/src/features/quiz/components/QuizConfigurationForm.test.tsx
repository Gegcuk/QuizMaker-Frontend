import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { CreateQuizRequest } from '@/types';
import { QuizConfigurationForm } from './QuizConfigurationForm';

const quizData: Partial<CreateQuizRequest> = {
  title: 'Architecture foundations',
  description: 'A starter architecture quiz.',
  visibility: 'PRIVATE',
  difficulty: 'MEDIUM',
  estimatedTime: 30,
  timerEnabled: false,
};

describe('QuizConfigurationForm', () => {
  it('shows manual creation guidance and propagates changed quiz settings', async () => {
    const onDataChange = vi.fn();
    const onCreateQuiz = vi.fn();
    const { user } = renderWithProviders(
      <QuizConfigurationForm
        quizData={quizData}
        onDataChange={onDataChange}
        errors={{}}
        creationMethod="manual"
        onCreateQuiz={onCreateQuiz}
        isCreating={false}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Configure Your Manual Quiz' })).toBeInTheDocument();
    expect(screen.getByText(/add questions manually in the next step/)).toBeInTheDocument();

    const title = screen.getByPlaceholderText('Enter quiz title...');
    await user.clear(title);
    await user.type(title, 'Security foundations');
    await user.click(screen.getByRole('checkbox', { name: 'Enable Timer' }));

    expect(onDataChange).toHaveBeenLastCalledWith(expect.objectContaining({
      title: 'Security foundations',
      timerEnabled: true,
    }));
    expect(screen.getByText('Timer Duration (minutes) *')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create Quiz & Continue' }));
    expect(onCreateQuiz).toHaveBeenCalledOnce();
  });

  it('keeps the creation action disabled while creation is in progress', () => {
    renderWithProviders(
      <QuizConfigurationForm
        quizData={quizData}
        onDataChange={vi.fn()}
        errors={{}}
        creationMethod="text"
        onCreateQuiz={vi.fn()}
        isCreating
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('button', { name: /Creating Quiz/ })).toBeDisabled();
    expect(screen.getByRole('heading', { name: 'Configure Your Text-Based Quiz' })).toBeInTheDocument();
  });
});
