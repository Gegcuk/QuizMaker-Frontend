import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import GenerationProgress from './GenerationProgress';
import { TokenEstimationDisplay } from './TokenEstimationDisplay';

const serviceMocks = vi.hoisted(() => ({
  cancelGenerationJob: vi.fn(),
  getGeneratedQuiz: vi.fn(),
  getGenerationStatus: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  QuizService: class {
    cancelGenerationJob = serviceMocks.cancelGenerationJob;
    getGeneratedQuiz = serviceMocks.getGeneratedQuiz;
    getGenerationStatus = serviceMocks.getGenerationStatus;
  },
}));

describe('AI status components', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders token estimation fallbacks and detailed calculated values', () => {
    const { rerender } = renderWithProviders(<TokenEstimationDisplay estimation={null} />, { withAuthProvider: false });
    expect(screen.getByText(/Enter content/)).toBeInTheDocument();

    rerender(
      <TokenEstimationDisplay
        showBreakdown
        estimation={{ inputTokens: 1200, completionTokens: 800, estimatedLlmTokens: 2400, estimatedBillingTokens: 1500 }}
      />,
    );
    expect(screen.getByText('1.5K')).toBeInTheDocument();
    expect(screen.getByText('1.2K')).toBeInTheDocument();
    expect(screen.getByText('2.4K')).toBeInTheDocument();
  });

  it('shows processing progress and allows cancellation', async () => {
    serviceMocks.getGenerationStatus.mockResolvedValue({
      status: 'PROCESSING', processedChunks: 2, totalChunks: 4, progressPercentage: 50,
      estimatedTimeRemainingSeconds: 60, elapsedTimeSeconds: 30,
    });
    serviceMocks.cancelGenerationJob.mockResolvedValue(undefined);
    const onGenerationCancelled = vi.fn();
    const { user } = renderWithProviders(
      <GenerationProgress jobId="job-1" onGenerationCancelled={onGenerationCancelled} />,
      { withAuthProvider: false },
    );
    expect(await screen.findByText('Processing chunk 2 of 4')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel Generation' }));
    await waitFor(() => expect(serviceMocks.cancelGenerationJob).toHaveBeenCalledWith('job-1'));
    expect(onGenerationCancelled).toHaveBeenCalledOnce();
  });

  it('retrieves completed quizzes and exposes polling failures to callers', async () => {
    serviceMocks.getGenerationStatus.mockResolvedValueOnce({ status: 'COMPLETED' });
    serviceMocks.getGeneratedQuiz.mockResolvedValue({ id: 'quiz-1' });
    const onGenerationComplete = vi.fn();
    const { unmount } = renderWithProviders(
      <GenerationProgress jobId="job-1" onGenerationComplete={onGenerationComplete} />,
      { withAuthProvider: false },
    );
    await waitFor(() => expect(onGenerationComplete).toHaveBeenCalledWith('quiz-1'));
    unmount();

    serviceMocks.getGenerationStatus.mockRejectedValueOnce(new Error('Status unavailable.'));
    const onGenerationError = vi.fn();
    renderWithProviders(<GenerationProgress jobId="job-2" onGenerationError={onGenerationError} />, { withAuthProvider: false });
    await waitFor(() => expect(onGenerationError).toHaveBeenCalledWith('Status unavailable.'));
  });
});
