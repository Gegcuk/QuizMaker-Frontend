import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { QuizAIGenerationStep } from './QuizAIGenerationStep';

const service = vi.hoisted(() => ({ generateQuizFromText: vi.fn() }));

vi.mock('@/services', () => ({
  api: {},
  QuizService: class {
    generateQuizFromText = service.generateQuizFromText;
  },
}));

describe('QuizAIGenerationStep', () => {
  it('validates and starts text-based question generation', async () => {
    service.generateQuizFromText.mockResolvedValue({ jobId: 'job-1' });
    const { user } = renderWithProviders(
      <QuizAIGenerationStep
        quizId="quiz-1"
        quizTitle="Architecture decisions"
        creationMethod="text"
        onComplete={vi.fn()}
      />,
      { withAuthProvider: false },
    );

    const generate = screen.getByRole('button', { name: 'Generate Questions from Text' });
    expect(generate).toBeDisabled();

    const text = 'Architecture decisions need explicit context, ownership, and accepted trade-offs.';
    await user.type(screen.getByLabelText('Text Content *'), text);
    await user.click(generate);

    await waitFor(() => {
      expect(service.generateQuizFromText).toHaveBeenCalledWith(expect.objectContaining({
        text,
        quizTitle: 'Architecture decisions',
        estimatedTimePerQuestion: 2,
      }));
    });
  });

  it('continues document generation through the document upload step', async () => {
    const onComplete = vi.fn();
    const { user } = renderWithProviders(
      <QuizAIGenerationStep
        quizId="quiz-1"
        quizTitle="Architecture decisions"
        creationMethod="document"
        onComplete={onComplete}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Continue to Document Upload' }));

    expect(onComplete).toHaveBeenCalledOnce();
  });
});
