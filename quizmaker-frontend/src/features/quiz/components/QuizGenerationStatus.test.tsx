import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderWithProviders, screen, waitFor } from '@/test/render';
import { QuizGenerationStatus } from './QuizGenerationStatus';
import { GenerationJobBlock } from './GenerationJobBlock';
import { GenerationObserverProvider } from '../providers/GenerationObserverProvider';
import { ApplicationError } from '@/utils/applicationError';

vi.mock('@/features/auth', async original => ({ ...await original<typeof import('@/features/auth')>(), useAuth: () => ({ user: { id: 'account-a' }, isLoading: false }) }));
const service = vi.hoisted(() => ({ cancelGenerationJob: vi.fn(), getGenerationStatus: vi.fn(), getGenerationJobs: vi.fn() }));
vi.mock('../services/quiz.service', () => ({ QuizService: class {
  cancelGenerationJob = service.cancelGenerationJob;
  getGenerationStatus = service.getGenerationStatus;
  getGenerationJobs = service.getGenerationJobs;
} }));
const processing = { jobId: 'job-1', status: 'PROCESSING', progressPercentage: 50 };
beforeEach(() => {
  vi.clearAllMocks();
  service.getGenerationJobs.mockResolvedValue({ content: [processing], number: 0, size: 20, totalPages: 1, totalElements: 1, last: true, numberOfElements: 1 });
  service.getGenerationStatus.mockResolvedValue(processing);
  service.cancelGenerationJob.mockResolvedValue({ ...processing, status: 'CANCELLED' });
});
const view = (ui: React.ReactNode) => renderWithProviders(<GenerationObserverProvider>{ui}</GenerationObserverProvider>, { withAuthProvider: false });

describe('shared generation UI', () => {
  it('shows the same server progress for several consumers without independent status reads', async () => {
    view(<><GenerationJobBlock /><QuizGenerationStatus jobId="job-1" /></>);
    await waitFor(() => expect(screen.getAllByText('PROCESSING')).toHaveLength(2));
    expect(screen.getAllByRole('progressbar', { name: 'Generation progress' })).toHaveLength(2);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    expect(service.getGenerationStatus.mock.calls.length).toBeLessThanOrEqual(1);
  });
  it('uses confirmed cancellation and notifies callers only after CANCELLED', async () => {
    const onCancel = vi.fn(); const { user } = view(<QuizGenerationStatus jobId="job-1" onCancel={onCancel} />);
    await screen.findByText('PROCESSING'); await user.click(screen.getByRole('button', { name: 'Cancel Generation' }));
    await screen.findByText('CANCELLED'); expect(service.cancelGenerationJob).toHaveBeenCalledTimes(1); expect(onCancel).toHaveBeenCalledTimes(1);
  });
  it('renders a completed result when cancellation races with completion', async () => {
    service.cancelGenerationJob.mockRejectedValue(new ApplicationError({ category: 'validation', status: 400 }));
    const onComplete = vi.fn(); const onCancel = vi.fn(); const { user, router } = view(<QuizGenerationStatus jobId="job-1" onComplete={onComplete} onCancel={onCancel} />);
    await screen.findByText('PROCESSING'); service.getGenerationStatus.mockResolvedValue({ jobId: 'job-1', status: 'COMPLETED', generatedQuizId: 'quiz-1' });
    await user.click(screen.getByRole('button', { name: 'Cancel Generation' })); await screen.findByText('COMPLETED');
    expect(onCancel).not.toHaveBeenCalled(); expect(onComplete).toHaveBeenCalledWith('quiz-1');
    await user.click(screen.getByRole('button', { name: 'View Generated Quiz' })); expect(router.state.location.pathname).toBe('/quizzes/quiz-1');
  });
  it('renders legacy nullable fields without inventing progress or elapsed time', async () => {
    service.getGenerationJobs.mockResolvedValue({ content: [{ jobId: 'job-1', status: 'PROCESSING', progressPercentage: null, startedAt: null, estimatedTimeRemainingSeconds: null }], number: 0, size: 20, totalPages: 1, totalElements: 1, last: true, numberOfElements: 1 });
    view(<GenerationJobBlock />); await screen.findByText('PROCESSING'); expect(screen.queryByRole('progressbar')).not.toBeInTheDocument(); expect(screen.queryByText(/NaN|null|undefined/)).not.toBeInTheDocument();
  });
  it('preserves the last state during a read error and does not call generation-failure callbacks', async () => {
    vi.useFakeTimers();
    try {
      const onError = vi.fn(); view(<QuizGenerationStatus jobId="job-1" onError={onError} />);
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      service.getGenerationStatus.mockRejectedValue(new ApplicationError({ category: 'server', status: 503 }));
      await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
      expect(screen.getByText('PROCESSING')).toBeInTheDocument(); expect(screen.getByRole('alert')).toHaveTextContent('last confirmed state'); expect(onError).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
  it('does not infer completion from 100 percent progress', async () => {
    service.getGenerationJobs.mockResolvedValue({ content: [{ ...processing, progressPercentage: 100 }], number: 0, size: 20, totalPages: 1, totalElements: 1, last: true, numberOfElements: 1 });
    service.getGenerationStatus.mockResolvedValue({ ...processing, progressPercentage: 100 });
    const onComplete = vi.fn(); view(<><GenerationJobBlock /><QuizGenerationStatus jobId="job-1" onComplete={onComplete} /></>);
    await waitFor(() => expect(screen.getAllByRole('progressbar')[0]).toHaveAttribute('aria-valuenow', '100')); expect(screen.queryByRole('button', { name: 'View Generated Quiz' })).not.toBeInTheDocument(); expect(onComplete).not.toHaveBeenCalled();
  });
});
