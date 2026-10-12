import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createTestQueryClient, renderWithProviders, screen, waitFor } from '@/test/render';
import { QuizGenerationStatus } from './QuizGenerationStatus';
import { GenerationJobBlock } from './GenerationJobBlock';
import { GenerationObserverProvider } from '../providers/GenerationObserverProvider';
import { ApplicationError } from '@/utils/applicationError';
import { generationStatusKey, ownedQuizzesKey } from '../services/generationObserver';
import type { QuizGenerationStatus as GenerationStatusDto } from '@/types';

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
const view = (ui: React.ReactNode, queryClient = createTestQueryClient()) => renderWithProviders(<GenerationObserverProvider>{ui}</GenerationObserverProvider>, { withAuthProvider: false, queryClient });

describe('shared generation UI', () => {
  it('shows the same server progress for several consumers without independent status reads', async () => {
    view(<><GenerationJobBlock /><QuizGenerationStatus jobId="job-1" /></>);
    await waitFor(() => expect(screen.getAllByText('Generating your quiz')).toHaveLength(2));
    expect(screen.getAllByRole('progressbar', { name: 'Generation progress' })).toHaveLength(2);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    expect(service.getGenerationStatus.mock.calls.length).toBeLessThanOrEqual(1);
  });
  it('uses confirmed cancellation and notifies callers only after CANCELLED', async () => {
    const onCancel = vi.fn(); const { user } = view(<QuizGenerationStatus jobId="job-1" onCancel={onCancel} />);
    await screen.findByText('Generating your quiz'); await user.click(screen.getByRole('button', { name: 'Cancel Generation' }));
    await screen.findByText('Generation cancelled'); expect(service.cancelGenerationJob).toHaveBeenCalledTimes(1); expect(onCancel).toHaveBeenCalledTimes(1);
  });
  it('renders a completed result when cancellation races with completion', async () => {
    service.cancelGenerationJob.mockRejectedValue(new ApplicationError({ category: 'validation', status: 400 }));
    const onComplete = vi.fn(); const onCancel = vi.fn(); const { user, router } = view(<QuizGenerationStatus jobId="job-1" onComplete={onComplete} onCancel={onCancel} />);
    await screen.findByText('Generating your quiz'); service.getGenerationStatus.mockResolvedValue({ jobId: 'job-1', status: 'COMPLETED', generatedQuizId: 'quiz-1' });
    await user.click(screen.getByRole('button', { name: 'Cancel Generation' })); await screen.findByText('Quiz ready');
    expect(onCancel).not.toHaveBeenCalled(); expect(onComplete).toHaveBeenCalledWith('quiz-1');
    await user.click(screen.getByRole('button', { name: 'View Generated Quiz' })); expect(router.state.location.pathname).toBe('/quizzes/quiz-1');
  });
  it('renders legacy nullable fields without inventing progress or elapsed time', async () => {
    service.getGenerationJobs.mockResolvedValue({ content: [{ jobId: 'job-1', status: 'PROCESSING', progressPercentage: null, startedAt: null, estimatedTimeRemainingSeconds: null }], number: 0, size: 20, totalPages: 1, totalElements: 1, last: true, numberOfElements: 1 });
    view(<GenerationJobBlock />); await screen.findByText('Generating your quiz'); expect(screen.queryByRole('progressbar')).not.toBeInTheDocument(); expect(screen.queryByText(/NaN|null|undefined/)).not.toBeInTheDocument();
  });
  it('preserves the last state during a read error and does not call generation-failure callbacks', async () => {
    vi.useFakeTimers();
    try {
      const onError = vi.fn(); view(<QuizGenerationStatus jobId="job-1" onError={onError} />);
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      service.getGenerationStatus.mockRejectedValue(new ApplicationError({ category: 'server', status: 503 }));
      await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
      expect(screen.getByText('Generating your quiz')).toBeInTheDocument(); expect(screen.getByRole('alert')).toHaveTextContent('last confirmed state'); expect(onError).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
  it('does not infer completion from 100 percent progress', async () => {
    service.getGenerationJobs.mockResolvedValue({ content: [{ ...processing, progressPercentage: 100 }], number: 0, size: 20, totalPages: 1, totalElements: 1, last: true, numberOfElements: 1 });
    service.getGenerationStatus.mockResolvedValue({ ...processing, progressPercentage: 100 });
    const onComplete = vi.fn(); view(<><GenerationJobBlock /><QuizGenerationStatus jobId="job-1" onComplete={onComplete} /></>);
    await waitFor(() => expect(screen.getAllByRole('progressbar')[0]).toHaveAttribute('aria-valuenow', '100')); expect(screen.queryByRole('button', { name: 'View Generated Quiz' })).not.toBeInTheDocument(); expect(onComplete).not.toHaveBeenCalled();
  });
  it('identifies an old server-reported active job without inferring completion from its processing message', async () => {
    const job = { ...processing, progressPercentage: 0, startedAt: '2025-11-24T19:05:06', totalChunks: 1, processedChunks: 1, currentChunk: 'Generation completed successfully' };
    service.getGenerationJobs.mockResolvedValue({ content: [job], number: 0, size: 20, totalPages: 1, totalElements: 1, last: true, numberOfElements: 1 });
    view(<GenerationJobBlock />);
    expect(await screen.findByText('Generating your quiz')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Generation progress' })).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText(/Started:/).querySelector('time')).toHaveAttribute('datetime', '2025-11-24T19:05:06');
    expect(screen.getByText('Chunks processed: 1/1')).toBeInTheDocument();
    expect(screen.queryByText('PROCESSING')).not.toBeInTheDocument();
    expect(screen.queryByText(/You can leave this page/)).not.toBeInTheDocument();
    expect(screen.queryByText('Quiz ready')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel Generation' })).toBeEnabled();
  });
  it('omits invalid dates and unavailable chunk counts', async () => {
    const job = { ...processing, startedAt: 'invalid-date', totalChunks: null, processedChunks: null };
    service.getGenerationJobs.mockResolvedValue({ content: [job], number: 0, size: 20, totalPages: 1, totalElements: 1, last: true, numberOfElements: 1 });
    view(<GenerationJobBlock />);
    await screen.findByText('Generating your quiz');
    expect(screen.queryByText(/Started:|Chunks processed:|Invalid Date/)).not.toBeInTheDocument();
  });
  it('shows only the exact confirmed result title from the current account and reacts when the list is refreshed', async () => {
    const client = createTestQueryClient();
    // Keep list data for this cache-only consumer; the shared test helper uses
    // zero retention, unlike the application's query provider.
    client.setQueryDefaults(['owned-quizzes'], { gcTime: Infinity });
    client.setQueryData(ownedQuizzesKey('account-b'), { content: [{ id: 'quiz-1', title: 'Other account title' }] });
    service.getGenerationJobs.mockResolvedValue({ content: [], number: 0, size: 20, totalPages: 0, totalElements: 0, last: true, numberOfElements: 0 });
    service.getGenerationStatus.mockResolvedValue({ jobId: 'job-1', status: 'COMPLETED', generatedQuizId: 'quiz-1' });
    view(<QuizGenerationStatus jobId="job-1" />, client);
    await screen.findByText('Quiz ready');
    expect(screen.queryByText('Other account title')).not.toBeInTheDocument();
    act(() => { client.setQueryData(ownedQuizzesKey('account-a'), { content: [{ id: 'quiz-unrelated', title: 'Unrelated result' }, { id: 'quiz-1', title: 'Confirmed quiz title' }] }); });
    expect(await screen.findByText('Confirmed quiz title')).toBeInTheDocument();
    expect(screen.queryByText('Unrelated result')).not.toBeInTheDocument();
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
  });
  it('keeps an outstanding shared status read alive when navigation removes its last visible consumer', async () => {
    vi.useFakeTimers();
    try {
      const client = createTestQueryClient();
      const root = view(<GenerationJobBlock />, client);
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      let completeRead: (job: GenerationStatusDto) => void = () => { throw new Error('Status request did not start'); };
      service.getGenerationStatus.mockImplementationOnce(() => new Promise(resolve => { completeRead = resolve; }));
      await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
      const signal = service.getGenerationStatus.mock.calls[0]?.[1];
      expect(signal).toBeInstanceOf(AbortSignal);
      root.rerender(<GenerationObserverProvider><p>Another page</p></GenerationObserverProvider>);
      expect(signal?.aborted).toBe(false);
      await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
      expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
      await act(async () => {
        completeRead({ jobId: 'job-1', status: 'COMPLETED', generatedQuizId: 'quiz-1' });
        await vi.advanceTimersByTimeAsync(60_000);
      });
      expect(client.getQueryData(generationStatusKey('account-a', 'job-1'))).toMatchObject({ status: 'COMPLETED', generatedQuizId: 'quiz-1' });
      expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
      root.rerender(<GenerationObserverProvider><GenerationJobBlock /></GenerationObserverProvider>);
      expect(screen.getByText('Quiz ready')).toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });
});
