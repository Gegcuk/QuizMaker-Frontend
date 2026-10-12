import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import { GenerationObserverProvider } from '../providers/GenerationObserverProvider';
import { QuizGenerationStatus } from './QuizGenerationStatus';
import QuizCard from './QuizCard';
import QuizList from './QuizList';
import type { QuizDto } from '@/types';

vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { id: 'account-a' }, isLoading: false }) }));
vi.mock('../hooks', () => ({ useQuizMetadata: () => ({ getTagName: () => '', getCategoryName: () => '' }), useCreateGroup: () => ({ handleCreateGroup: vi.fn() }) }));
vi.mock('./QuizGroupMenu', () => ({ default: () => null }));
vi.mock('./CreateGroupModal', () => ({ default: () => null }));
vi.mock('../services/quiz.service', () => ({ QuizService: class {
  getGenerationJobs = async () => ({ content: [], number: 0, size: 20, totalPages: 0, totalElements: 0, last: true, numberOfElements: 0 });
  getGenerationStatus = async () => ({ jobId: 'job-1', status: 'COMPLETED', generatedQuizId: 'quiz-1' });
} }));
const quiz: QuizDto = { id: 'quiz-1', creatorId: 'account-a', title: 'Observed AI result', visibility: 'PRIVATE', status: 'DRAFT', difficulty: 'MEDIUM', createdAt: '2026-10-12T12:00:00Z', updatedAt: '2026-10-12T12:00:00Z', estimatedTime: 5, isRepetitionEnabled: false, timerEnabled: false, timerDuration: 0, tagIds: [] };
beforeEach(() => vi.clearAllMocks());

describe('current-account in-memory new marker', () => {
  it.each(['card-hover', 'card-focus', 'card-click', 'list-focus'] as const)('acknowledges an observed completion on %s but never just by rendering', async trigger => {
    const { user } = renderWithProviders(<GenerationObserverProvider><QuizGenerationStatus jobId="job-1" />{trigger === 'list-focus' ? <QuizList quizzes={[quiz]} /> : <QuizCard quiz={quiz} />}</GenerationObserverProvider>, { withAuthProvider: false });
    const marker = await screen.findByText('New', { exact: true }); expect(marker).toBeInTheDocument();
    if (trigger === 'card-hover') await user.hover(marker);
    else if (trigger === 'card-click') await user.click(marker);
    else await user.tab();
    // Continue tabbing past the observation actions into existing card controls.
    if (trigger.includes('focus')) {
      for (let step = 0; step < 10 && screen.queryByText('New', { exact: true }); step++) await user.tab();
    }
    expect(screen.queryByText('New', { exact: true })).not.toBeInTheDocument();
  });
  it('does not mark historical/manual/imported quizzes without an observed AI completion', async () => {
    renderWithProviders(<GenerationObserverProvider><QuizCard quiz={quiz} /></GenerationObserverProvider>, { withAuthProvider: false });
    expect(screen.queryByText('New', { exact: true })).not.toBeInTheDocument();
  });
});
