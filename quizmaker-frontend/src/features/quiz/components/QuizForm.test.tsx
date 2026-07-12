import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import QuizForm from './QuizForm';

const navigation = vi.hoisted(() => vi.fn());
const quizService = vi.hoisted(() => ({ createQuiz: vi.fn(), updateQuizStatus: vi.fn() }));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigation,
    useParams: () => ({}),
  };
});
vi.mock('@/services', () => ({
  createQuiz: quizService.createQuiz,
  updateQuizStatus: quizService.updateQuizStatus,
}));
vi.mock('./', () => ({
  QuizManagementTab: ({
    onDataChange,
  }: {
    onDataChange: (data: { title: string; estimatedTime: number }) => void;
  }) => (
    <>
      <button type="button" onClick={() => onDataChange({ title: 'Architecture quiz', estimatedTime: 30 })}>
        Set valid quiz details
      </button>
      <button type="submit">Create draft</button>
    </>
  ),
}));

describe('QuizForm', () => {
  it('creates a valid draft and navigates to its management tab', async () => {
    quizService.createQuiz.mockResolvedValue({ quizId: 'quiz-1' });
    const { user } = renderWithProviders(<QuizForm />, { withAuthProvider: false });

    await user.click(screen.getByRole('button', { name: 'Set valid quiz details' }));
    await user.click(screen.getByRole('button', { name: 'Create draft' }));

    await waitFor(() => {
      expect(quizService.createQuiz).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Architecture quiz',
        estimatedTime: 30,
      }));
    });
    expect(navigation).toHaveBeenCalledWith('/quizzes/quiz-1?tab=management');
  });
});
