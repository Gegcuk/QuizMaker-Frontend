import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import QuizCreationWizard from './QuizCreationWizard';

const quizService = vi.hoisted(() => ({ createQuiz: vi.fn() }));

vi.mock('@/services', () => ({ api: {}, createQuiz: quizService.createQuiz }));
vi.mock('../services/quiz.service', () => ({ QuizService: class {} }));
vi.mock('./QuizCreationMethodSelector', () => ({
  QuizCreationMethodSelector: ({ onMethodSelect }: { onMethodSelect: (method: 'manual') => void }) => (
    <button type="button" onClick={() => onMethodSelect('manual')}>Choose manual</button>
  ),
}));
vi.mock('./ManualQuizConfigurationForm', () => ({
  ManualQuizConfigurationForm: ({ onCreateQuiz }: { onCreateQuiz: (data: { title: string; estimatedTime: number }) => void }) => (
    <button type="button" onClick={() => onCreateQuiz({ title: 'Architecture quiz', estimatedTime: 30 })}>
      Create manual quiz
    </button>
  ),
}));
vi.mock('./TextQuizConfigurationForm', () => ({ TextQuizConfigurationForm: () => <div>Text configuration</div> }));
vi.mock('./DocumentQuizConfigurationForm', () => ({ DocumentQuizConfigurationForm: () => <div>Document configuration</div> }));
vi.mock('./QuizQuestionManager', () => ({
  QuizQuestionManager: ({ onComplete }: { onComplete: () => void }) => (
    <button type="button" onClick={onComplete}>Complete questions</button>
  ),
}));
vi.mock('./QuizAIGenerationStep', () => ({ QuizAIGenerationStep: () => <div>AI generation</div> }));
vi.mock('./QuizGenerationStatus', () => ({ QuizGenerationStatus: () => <div>Generation status</div> }));

describe('QuizCreationWizard', () => {
  it('creates a manual quiz and progresses through question completion', async () => {
    quizService.createQuiz.mockResolvedValue({ quizId: 'quiz-1' });
    const { user } = renderWithProviders(<QuizCreationWizard />, { withAuthProvider: false });

    expect(screen.getByText('Choose Creation Method')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Choose manual' }));
    await user.click(screen.getByRole('button', { name: 'Create manual quiz' }));

    await waitFor(() => {
      expect(quizService.createQuiz).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Architecture quiz',
        estimatedTime: 30,
      }));
    });
    expect(screen.getByRole('button', { name: 'Complete questions' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Complete questions' }));

    expect(screen.getByText('Quiz Created Successfully!')).toBeInTheDocument();
    expect(screen.getByText(/Your quiz "Architecture quiz" has been created/)).toBeInTheDocument();
  });
});
