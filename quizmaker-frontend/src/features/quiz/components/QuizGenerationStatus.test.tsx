import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { QuizGenerationStatus } from './QuizGenerationStatus';
import { useGenerationOperation } from '../hooks/useGenerationOperation';
import { generationOperations } from '../services/generationOperations';

vi.mock('@/features/auth', async original => ({ ...await original<typeof import('@/features/auth')>(), useAuth: () => ({ user: { id: 'account-a' }, isLoading: false }) }));
afterEach(() => vi.useRealTimers());

const service = vi.hoisted(() => ({
  cancelGenerationJob: vi.fn(),
  getGenerationStatus: vi.fn(),
}));

vi.mock('@/services', () => ({ api: {} }));
vi.mock('../services/quiz.service', () => ({
  QuizService: class {
    cancelGenerationJob = service.cancelGenerationJob;
    getGenerationStatus = service.getGenerationStatus;
  },
}));

describe('QuizGenerationStatus', () => {
  it('reads the existing job after the polling interval when recovery owns the parent screen', async () => {
    vi.useFakeTimers();
    const start = vi.fn(async () => ({ jobId: 'job-1', status: 'PENDING' as const, message: 'queued', estimatedTimeSeconds: 10 }));
    await generationOperations.start('account-a', 'wizard', 'text', start);
    service.getGenerationStatus.mockResolvedValue({ jobId: 'job-1', status: 'PROCESSING', progressPercentage: 50 });
    function Screen() {
      const recovery = useGenerationOperation('wizard');
      return <QuizGenerationStatus jobId={recovery.operation?.jobId ?? 'job-1'} onComplete={() => {}} onError={() => {}} />;
    }
    renderWithProviders(<Screen />, { withAuthProvider: false });
    for (let second = 0; second < 5; second++) {
      await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    }
    expect(service.getGenerationStatus).toHaveBeenCalledExactlyOnceWith('job-1');
    expect(screen.getByText('PROCESSING')).toBeInTheDocument();
    expect(start).toHaveBeenCalledOnce();
  });

  it('cancels an in-progress generation job and notifies the caller', async () => {
    service.cancelGenerationJob.mockResolvedValue(undefined);
    const onCancel = vi.fn();
    const { user } = renderWithProviders(
      <QuizGenerationStatus jobId="job-1" initialStatus="PROCESSING" onCancel={onCancel} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('PROCESSING')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel Generation' }));

    await waitFor(() => expect(service.cancelGenerationJob).toHaveBeenCalledWith('job-1'));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.getByText('CANCELLED')).toBeInTheDocument();
  });
});
