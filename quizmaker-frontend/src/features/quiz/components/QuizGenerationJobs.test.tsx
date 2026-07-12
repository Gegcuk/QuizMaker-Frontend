import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, renderWithProviders, screen } from '@/test/render';
import QuizGenerationJobs from './QuizGenerationJobs';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('QuizGenerationJobs', () => {
  it('loads jobs, opens their details, and retries a failed job', async () => {
    vi.useFakeTimers();
    renderWithProviders(<QuizGenerationJobs quizId="quiz-1" />, { withAuthProvider: false });

    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    expect(screen.getByText('Corrupted Document')).toBeInTheDocument();

    fireEvent.click(screen.getAllByTitle('View Details')[0]);
    expect(screen.getByRole('heading', { name: 'Job Details' })).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Retry Job'));
    expect(screen.getByText('Job queued for retry')).toBeInTheDocument();
  });
});
