import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { TextGenerationTab } from './TextGenerationTab';

const service = vi.hoisted(() => ({
  generateQuizFromText: vi.fn(),
  estimateFromText: vi.fn().mockReturnValue(null),
}));

vi.mock('@/services', () => ({
  api: {},
  QuizService: class {
    generateQuizFromText = service.generateQuizFromText;
  },
  tokenEstimationService: { estimateFromText: service.estimateFromText },
}));

vi.mock('@/features/ai', () => ({
  GenerationProgress: ({ jobId }: { jobId: string }) => <div>Generation job: {jobId}</div>,
  TokenEstimationDisplay: () => null,
}));

describe('TextGenerationTab', () => {
  it('requires text before generation', () => {
    renderWithProviders(<TextGenerationTab />, { withAuthProvider: false });

    expect(screen.getByRole('button', { name: /Generate Quiz from Text/ })).toBeDisabled();
  });

  it('submits valid text to the generation service and shows progress', async () => {
    service.generateQuizFromText.mockResolvedValue({ jobId: 'job-2' });
    const { user } = renderWithProviders(<TextGenerationTab />, { withAuthProvider: false });
    const text = 'Architecture decisions need owners, context, and explicit trade-offs. '.repeat(6);

    await user.type(
      screen.getByLabelText(/Enter your text content/),
      text,
    );
    await user.type(
      screen.getByPlaceholderText('Enter quiz title (optional - AI will generate if empty)'),
      'Architecture decisions',
    );
    await user.click(screen.getByRole('button', { name: /Generate Quiz from Text/ }));

    await waitFor(() => {
      expect(service.generateQuizFromText).toHaveBeenCalledWith(expect.objectContaining({
        text: text.trim(),
        quizTitle: 'Architecture decisions',
        chunkingStrategy: 'SIZE_BASED',
        maxChunkSize: 100000,
      }));
    });
    expect(screen.getByText('Generation job: job-2')).toBeInTheDocument();
  });
});
