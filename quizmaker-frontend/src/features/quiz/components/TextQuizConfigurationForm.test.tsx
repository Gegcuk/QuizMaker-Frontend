import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { TextQuizConfigurationForm } from './TextQuizConfigurationForm';

const tokenEstimationService = vi.hoisted(() => ({ estimateFromText: vi.fn().mockReturnValue(null) }));

vi.mock('@/services', () => ({ tokenEstimationService }));
vi.mock('@/features/ai', () => ({ TokenEstimationDisplay: () => null }));

describe('TextQuizConfigurationForm', () => {
  it('blocks generation while keeping its missing requirements keyboard reachable', async () => {
    const onCreateQuiz = vi.fn();
    const { user } = renderWithProviders(
      <TextQuizConfigurationForm
        quizData={{}}
        onDataChange={vi.fn()}
        errors={{}}
        onCreateQuiz={onCreateQuiz}
        isCreating={false}
      />,
      { withAuthProvider: false },
    );

    const generateButton = screen.getByRole('button', { name: 'Generate Quiz from Text' });
    expect(generateButton).not.toBeDisabled();
    expect(generateButton).toHaveAttribute('aria-disabled', 'true');
    expect(generateButton).toHaveAccessibleDescription(expect.stringContaining('Quiz title is required'));
    expect(generateButton).toHaveAccessibleDescription(expect.stringContaining('Text content is required'));

    await user.click(generateButton);
    expect(onCreateQuiz).not.toHaveBeenCalled();
  });

  it('submits a filtered text-generation request after valid input', async () => {
    const onDataChange = vi.fn();
    const onCreateQuiz = vi.fn();
    const { user } = renderWithProviders(
      <TextQuizConfigurationForm
        quizData={{}}
        onDataChange={onDataChange}
        errors={{}}
        onCreateQuiz={onCreateQuiz}
        isCreating={false}
      />,
      { withAuthProvider: false },
    );

    const text = 'Architecture decisions need clear ownership and documented trade-offs. '.repeat(6).trim();
    await user.type(screen.getByPlaceholderText('Enter quiz title...'), 'Architecture decisions');
    await user.type(
      screen.getByLabelText('Text Content *'),
      text,
    );
    await user.click(screen.getByRole('button', { name: 'Generate Quiz from Text' }));

    await waitFor(() => {
      expect(onCreateQuiz).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Architecture decisions',
        generationRequest: expect.objectContaining({
          text,
          quizTitle: 'Architecture decisions',
          difficulty: 'MEDIUM',
          chunkingStrategy: 'SIZE_BASED',
          maxChunkSize: 100000,
        }),
      }));
    });
    expect(onDataChange).toHaveBeenCalledOnce();
  });
});
