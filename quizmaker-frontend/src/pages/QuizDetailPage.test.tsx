import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderWithProviders, screen, waitFor } from '@/test/render';
import { Route, Routes } from 'react-router-dom';
import type { QuizDto, UpdateQuizRequest } from '@/types';
import QuizDetailPage from './QuizDetailPage';

const mocks = vi.hoisted(() => ({ update: vi.fn(), status: vi.fn(), refetch: vi.fn(), quiz: null as QuizDto | null }));
vi.mock('@/services', () => ({
  api: {}, archiveQuiz: vi.fn(), unarchiveQuiz: vi.fn(),
  updateQuiz: mocks.update, updateQuizStatus: mocks.status,
  QuestionService: class { getQuestions = async () => ({ content: [] }); },
}));
vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { id: 'author' } }) }));
vi.mock('@/features/quiz/hooks/useQuizQueries', () => ({
  useQuiz: () => ({ data: mocks.quiz, refetch: mocks.refetch }),
  useQuizStats: () => ({}), useQuizLeaderboard: () => ({}),
  useDeleteQuiz: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/features/quiz/components/QuizDetailHeader', () => ({ default: () => <h1>Quiz details</h1> }));
vi.mock('@/features/quiz/components/QuizStats', () => ({ default: () => <p>Statistics</p> }));
vi.mock('@/features/quiz/components/QuizExport', () => ({ default: () => <p>Export quiz</p> }));
vi.mock('@/features/quiz/components/QuizPublishModal', () => ({ default: () => null }));
vi.mock('@/features/quiz/components/QuizQuestionInline', () => ({ default: () => <p>Quiz questions</p> }));
vi.mock('@/features/quiz/components/QuizManagementTab', () => ({
  default: ({ quizData, onDataChange }: { quizData: Partial<UpdateQuizRequest>; onDataChange: (value: Partial<UpdateQuizRequest>) => void }) => (
    <label>Quiz title<input value={quizData.title ?? ''} onChange={(event) => onDataChange({ title: event.target.value })} /></label>
  ),
}));
const fixture: QuizDto = {
  id: 'quiz-123', creatorId: 'author', title: 'Original quiz', visibility: 'PRIVATE',
  difficulty: 'MEDIUM', status: 'DRAFT', estimatedTime: 30, timerDuration: 30,
  timerEnabled: false, isRepetitionEnabled: false, tagIds: [],
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};
const renderQuiz = (route = '/quizzes/quiz-123?tab=management') => renderWithProviders(
  <Routes>
    <Route path="/quizzes/:quizId" element={<QuizDetailPage />} />
    <Route path="/other" element={<p>Other page</p>} />
  </Routes>, { route, withAuthProvider: false },
);
const unloadBlocked = () => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.quiz = { ...fixture };
  mocks.update.mockResolvedValue({});
  mocks.status.mockResolvedValue({});
});

describe('quiz URL tabs and settings protection', () => {
  it('renders a direct Questions tab, follows tab history and direct query changes, and rejects unknown tabs', async () => {
    const { user, router } = renderQuiz('/quizzes/quiz-123?tab=questions&keep=value');
    expect(await screen.findByText('Quiz questions')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Questions' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: 'Export' }));
    expect(router.state.location.search).toBe('?tab=export&keep=value');
    await act(async () => { await router.navigate(-1); });
    expect(screen.getByRole('tab', { name: 'Questions' })).toHaveAttribute('aria-selected', 'true');
    await act(async () => { await router.navigate(1); });
    expect(screen.getByText('Export quiz')).toBeInTheDocument();
    await act(async () => { await router.navigate('/quizzes/quiz-123?tab=management'); });
    expect(await screen.findByLabelText('Quiz title')).toHaveValue('Original quiz');
    await act(async () => { await router.navigate('/quizzes/quiz-123?tab=unknown'); });
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
  });

  it('preserves settings across tab changes and background responses, and guards leaving the page', async () => {
    const { user, router, rerender } = renderQuiz();
    const input = await screen.findByLabelText('Quiz title');
    expect(unloadBlocked()).toBe(false);
    await user.clear(input);
    await user.type(input, 'My unsaved title');
    await user.click(screen.getByRole('tab', { name: 'Questions' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    mocks.quiz = { ...fixture, title: 'Background server response' };
    rerender(<Routes><Route path="/quizzes/:quizId" element={<QuizDetailPage />} /></Routes>);
    await user.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(screen.getByLabelText('Quiz title')).toHaveValue('My unsaved title');
    await act(async () => { await router.navigate('/other'); });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Stay' }));
    expect(screen.getByLabelText('Quiz title')).toHaveValue('My unsaved title');
  });

  it('retains protection after failed save and clears it only after the complete save succeeds', async () => {
    const { user, router } = renderQuiz();
    await user.type(await screen.findByLabelText('Quiz title'), ' edited');
    mocks.status.mockRejectedValueOnce(new Error('Status update failed'));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled());
    expect(unloadBlocked()).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled());
    expect(unloadBlocked()).toBe(false);
    await act(async () => { await router.navigate('/other'); });
    expect(await screen.findByText('Other page')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('retains changes typed while an earlier save is in progress', async () => {
    let finishSave: (() => void) | undefined;
    mocks.update.mockImplementationOnce(() => new Promise<void>((resolve) => { finishSave = resolve; }));
    const { user } = renderQuiz();
    const input = await screen.findByLabelText('Quiz title');
    await user.type(input, ' submitted');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    await user.type(input, ' later input');
    await act(async () => { finishSave?.(); });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled());
    expect(input).toHaveValue('Original quiz submitted later input');
    expect(unloadBlocked()).toBe(true);
  });
});
