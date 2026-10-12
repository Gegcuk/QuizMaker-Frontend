import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import QuizGenerationJobs from './QuizGenerationJobs';
import { GenerationObserverProvider } from '../providers/GenerationObserverProvider';
vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { id: 'account-a' }, isLoading: false }) }));
vi.mock('../services/quiz.service', () => ({ QuizService: class {
  getGenerationJobs = vi.fn(async () => ({ content: [], number: 0, size: 20, totalPages: 0, totalElements: 0, last: true, numberOfElements: 0 }));
} }));

describe('legacy generation jobs component', () => {
  it('shows the real owned-job empty state without demo jobs or simulated retry', async () => {
    renderWithProviders(<GenerationObserverProvider><QuizGenerationJobs quizId="quiz-1" /></GenerationObserverProvider>, { withAuthProvider: false });
    expect(await screen.findByText('No active generation found')).toBeInTheDocument();
    expect(screen.queryByText('Introduction to React')).not.toBeInTheDocument(); expect(screen.queryByRole('button', { name: /Retry Job/ })).not.toBeInTheDocument();
  });
});
