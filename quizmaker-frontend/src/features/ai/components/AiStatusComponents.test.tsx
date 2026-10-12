import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
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

  it('delegates generation progress and callbacks to the shared session component', () => {
    const onGenerationCancelled = vi.fn();
    renderWithProviders(<GenerationProgress jobId="job-1" onGenerationCancelled={onGenerationCancelled} />, { withAuthProvider: false });
    expect(screen.getByRole('heading', { name: 'Generating Your Quiz' })).toBeInTheDocument();
    expect(serviceMocks.getGenerationStatus).not.toHaveBeenCalled();
    expect(onGenerationCancelled).not.toHaveBeenCalled();
  });
});
