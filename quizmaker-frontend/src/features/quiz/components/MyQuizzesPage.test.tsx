import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuizDto } from '@/types';
import MyQuizzesPage from './MyQuizzesPage';

const services = vi.hoisted(() => ({
  getMyQuizzes: vi.fn(),
  deleteQuiz: vi.fn(),
  getQuizGroups: vi.fn(),
  addQuizzesToGroup: vi.fn(),
  deleteQuizGroup: vi.fn(),
}));

vi.mock('@/features/auth', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
vi.mock('@/services', () => ({
  getMyQuizzes: services.getMyQuizzes,
  deleteQuiz: services.deleteQuiz,
}));
vi.mock('../services', () => ({
  QuizService: class {},
  quizGroupService: {
    getQuizGroups: services.getQuizGroups,
    addQuizzesToGroup: services.addQuizzesToGroup,
    deleteQuizGroup: services.deleteQuizGroup,
  },
}));
vi.mock('../hooks', () => ({ useCreateGroup: () => ({ handleCreateGroup: vi.fn() }) }));
vi.mock('@/hooks', () => ({
  useQuizFiltering: (quizzes: QuizDto[]) => quizzes,
  useQuizPagination: (quizzes: QuizDto[]) => ({
    paginatedQuizzes: quizzes,
    pagination: { currentPage: 1, totalPages: 1, pageSize: 10, totalItems: quizzes.length },
  }),
  useResponsiveViewMode: () => ({ viewMode: 'list', setViewMode: vi.fn(), isMobile: false }),
}));
vi.mock('@/features/attempt', () => ({
  UserAttempts: ({ onAttemptsLoaded }: { onAttemptsLoaded: (hasAttempts: boolean) => void }) => {
    onAttemptsLoaded(false);
    return null;
  },
}));
vi.mock('@/features/seo', () => ({ Seo: () => null }));
vi.mock('./QuizExportModal', () => ({ default: () => null }));
vi.mock('./CreateGroupModal', () => ({ default: () => null }));
vi.mock('./', () => ({
  QuizGrid: ({ quizzes }: { quizzes: QuizDto[] }) => <div>Grid: {quizzes.map((quiz) => quiz.title).join(', ')}</div>,
  QuizList: ({ quizzes }: { quizzes: QuizDto[] }) => <div>List: {quizzes.map((quiz) => quiz.title).join(', ')}</div>,
  QuizPagination: () => null,
  QuizSortDropdown: () => null,
  QuizFilterDropdown: () => null,
}));

const quiz: QuizDto = {
  id: 'quiz-1',
  createdAt: '2026-07-12T09:00:00.000Z',
  updatedAt: '2026-07-12T09:00:00.000Z',
  creatorId: 'user-1',
  title: 'Owned architecture quiz',
  visibility: 'PRIVATE',
  difficulty: 'MEDIUM',
  status: 'DRAFT',
  estimatedTime: 20,
  isRepetitionEnabled: false,
  timerEnabled: false,
  timerDuration: 0,
  tagIds: [],
};

describe('MyQuizzesPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    services.getQuizGroups.mockResolvedValue({ content: [] });
  });

  it('loads and displays quizzes created by the signed-in user', async () => {
    services.getMyQuizzes.mockResolvedValue({ content: [quiz] });
    renderWithProviders(<MyQuizzesPage />, { withAuthProvider: false });

    expect(await screen.findByText('List: Owned architecture quiz')).toBeInTheDocument();
    expect(services.getMyQuizzes).toHaveBeenCalledWith({ size: 1000 });
    expect(screen.getByText('1 quizzes found')).toBeInTheDocument();
  });

  it('shows the first-quiz empty state when no quizzes exist', async () => {
    services.getMyQuizzes.mockResolvedValue({ content: [] });
    renderWithProviders(<MyQuizzesPage />, { withAuthProvider: false });

    expect(await screen.findByRole('heading', { name: 'No quizzes yet' })).toBeInTheDocument();
  });
});
