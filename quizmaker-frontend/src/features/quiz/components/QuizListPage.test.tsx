import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { QuizDto } from '@/types';
import QuizListPage from './QuizListPage';

const quizService = vi.hoisted(() => ({ getAllQuizzes: vi.fn(), deleteQuiz: vi.fn() }));

vi.mock('@/services', () => ({
  getAllQuizzes: quizService.getAllQuizzes,
  deleteQuiz: quizService.deleteQuiz,
}));
vi.mock('@/hooks', () => ({
  useQuizFiltering: (quizzes: QuizDto[]) => quizzes,
  useQuizPagination: (quizzes: QuizDto[]) => ({
    paginatedQuizzes: quizzes,
    pagination: { currentPage: 1, totalPages: 1, pageSize: 10, totalItems: quizzes.length },
  }),
  useResponsiveViewMode: () => ({ viewMode: 'list', setViewMode: vi.fn(), isMobile: false }),
}));
vi.mock('./', () => ({
  QuizGrid: ({ quizzes }: { quizzes: QuizDto[] }) => <div>Grid: {quizzes.map((quiz) => quiz.title).join(', ')}</div>,
  QuizList: ({ quizzes, onDelete }: { quizzes: QuizDto[]; onDelete?: (quizId: string) => void }) => (
    <div>
      {quizzes.map((quiz) => (
        <div key={quiz.id}>
          <span>{quiz.title}</span>
          <button type="button" onClick={() => onDelete?.(quiz.id)}>Delete {quiz.title}</button>
        </div>
      ))}
    </div>
  ),
  QuizPagination: () => null,
  QuizSortDropdown: () => null,
  QuizFilterDropdown: () => null,
}));

const quiz: QuizDto = {
  id: 'quiz-1',
  createdAt: '2026-07-12T09:00:00.000Z',
  updatedAt: '2026-07-12T09:00:00.000Z',
  creatorId: 'user-1',
  title: 'Public architecture quiz',
  visibility: 'PUBLIC',
  difficulty: 'MEDIUM',
  status: 'PUBLISHED',
  estimatedTime: 15,
  isRepetitionEnabled: false,
  timerEnabled: false,
  timerDuration: 0,
  tagIds: [],
};

describe('QuizListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quizService.getAllQuizzes.mockResolvedValue({ content: [quiz] });
    quizService.deleteQuiz.mockResolvedValue(undefined);
  });

  it('loads public quizzes and removes a quiz after confirmation', async () => {
    const { user } = renderWithProviders(<QuizListPage />, { withAuthProvider: false });

    expect(await screen.findByText('Public architecture quiz')).toBeInTheDocument();
    expect(quizService.getAllQuizzes).toHaveBeenCalledWith({ scope: 'public', size: 1000 });

    await user.click(screen.getByRole('button', { name: 'Delete Public architecture quiz' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete Quiz' });
    await user.click(screen.getByRole('button', { name: 'Delete Quiz' }));

    await waitFor(() => expect(quizService.deleteQuiz).toHaveBeenCalledWith('quiz-1'));
    expect(dialog).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No quizzes found' })).toBeInTheDocument();
  });
});
