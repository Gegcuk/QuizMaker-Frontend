import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { QuizQuestionManager } from './QuizQuestionManager';

const mocks = vi.hoisted(() => ({
  getQuestions: vi.fn(),
  updateQuizStatus: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  QuestionService: vi.fn(function QuestionService() {
    return { getQuestions: mocks.getQuestions };
  }),
  updateQuizStatus: mocks.updateQuizStatus,
}));

vi.mock('./QuizQuestionInline', () => ({
  default: ({
    questionIds,
    onChange,
  }: {
    questionIds: string[];
    onChange: (ids: string[]) => void;
  }) => (
    <section aria-label="Question editor">
      <p>{`Question editor has ${questionIds.length} questions`}</p>
      <button type="button" onClick={() => onChange([...questionIds, 'question-2'])}>
        Add question
      </button>
      <button type="button" onClick={() => onChange([])}>
        Clear questions
      </button>
    </section>
  ),
}));

vi.mock('./QuizPreview', () => ({
  default: ({ quizData }: { quizData: { title: string } }) => (
    <div>{`Previewing ${quizData.title}`}</div>
  ),
}));

const renderManager = (onComplete = vi.fn()) =>
  renderWithProviders(
    <QuizQuestionManager
      quizId="quiz-1"
      quizTitle="Architecture Leadership"
      defaultDifficulty="MEDIUM"
      onComplete={onComplete}
    />,
    { withAuthProvider: false },
  );

describe('QuizQuestionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getQuestions.mockResolvedValue({ content: [{ id: 'question-1' }] });
    mocks.updateQuizStatus.mockResolvedValue(undefined);
  });

  it('loads existing question IDs and keeps the question count synchronized', async () => {
    const { user } = renderManager();

    expect(await screen.findByText('Question editor has 1 questions')).toBeInTheDocument();
    expect(mocks.getQuestions).toHaveBeenCalledWith({ quizId: 'quiz-1' });
    expect(screen.getByRole('button', { name: 'Questions (1)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add question' }));

    expect(screen.getByText('Question editor has 2 questions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Questions (2)' })).toBeInTheDocument();
  });

  it('switches between question editing and the quiz preview', async () => {
    const { user } = renderManager();

    await screen.findByText('Question editor has 1 questions');
    await user.click(screen.getByRole('button', { name: 'Preview' }));

    expect(screen.getByText('Previewing Architecture Leadership')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to Questions' }));

    expect(screen.getByText('Question editor has 1 questions')).toBeInTheDocument();
  });

  it('saves a draft without publishing the quiz', async () => {
    const onComplete = vi.fn();
    const { user } = renderManager(onComplete);

    await screen.findByText('Question editor has 1 questions');
    await user.click(screen.getByRole('button', { name: 'Save Draft' }));

    expect(mocks.updateQuizStatus).not.toHaveBeenCalled();
    expect(
      await screen.findByText('Quiz saved as draft. You can continue editing later.'),
    ).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('requires a question before publishing and publishes the selected questions', async () => {
    const onComplete = vi.fn();
    const { user } = renderManager(onComplete);

    await screen.findByText('Question editor has 1 questions');
    await user.click(screen.getByRole('button', { name: 'Clear questions' }));

    expect(screen.getByRole('button', { name: 'Complete Quiz Creation' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Add question' }));
    await user.click(screen.getByRole('button', { name: 'Complete Quiz Creation' }));

    await waitFor(() => {
      expect(mocks.updateQuizStatus).toHaveBeenCalledWith('quiz-1', { status: 'PUBLISHED' });
    });
    expect(
      await screen.findByText(
        'Quiz "Architecture Leadership" created and published successfully with 1 questions!',
      ),
    ).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('keeps the manager open and reports a publishing failure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.updateQuizStatus.mockRejectedValue({
      response: { data: { message: 'Publishing is unavailable.' } },
    });
    const onComplete = vi.fn();
    const { user } = renderManager(onComplete);

    await screen.findByText('Question editor has 1 questions');
    await user.click(screen.getByRole('button', { name: 'Complete Quiz Creation' }));

    expect(await screen.findByText('Publishing is unavailable.')).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
