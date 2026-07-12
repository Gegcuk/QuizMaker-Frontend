import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { QuizGenerationStatus } from './QuizGenerationStatus';

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
