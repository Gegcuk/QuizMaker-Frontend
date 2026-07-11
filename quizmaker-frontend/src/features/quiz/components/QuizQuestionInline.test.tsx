import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { QuestionDto } from '@/types';
import QuizQuestionInline from './QuizQuestionInline';

const mocks = vi.hoisted(() => ({
  getQuestionById: vi.fn(),
  getQuestions: vi.fn(),
  removeQuestionFromQuiz: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  QuestionService: vi.fn(function QuestionService() {
    return {
      getQuestionById: mocks.getQuestionById,
      getQuestions: mocks.getQuestions,
    };
  }),
  QuizService: vi.fn(function QuizService() {
    return { removeQuestionFromQuiz: mocks.removeQuestionFromQuiz };
  }),
}));

vi.mock('@/features/question', () => ({
  QuestionForm: ({
    questionId,
    quizId,
    defaultDifficulty,
    onCancel,
    onSuccess,
  }: {
    questionId?: string;
    quizId?: string;
    defaultDifficulty?: string;
    onCancel: () => void;
    onSuccess?: (result?: { questionId?: string }) => void;
  }) => (
    <section aria-label="Question form">
      <p>{`Question form quiz: ${quizId ?? 'none'}`}</p>
      <p>{`Question form difficulty: ${defaultDifficulty ?? 'none'}`}</p>
      <p>{`Question form mode: ${questionId ? `edit ${questionId}` : 'create'}`}</p>
      <button
        type="button"
        onClick={() => onSuccess?.(questionId ? undefined : { questionId: 'question-created' })}
      >
        Save question
      </button>
      <button type="button" onClick={onCancel}>
        Cancel question form
      </button>
    </section>
  ),
}));

const createQuestion = (overrides: Partial<QuestionDto> = {}): QuestionDto => ({
  id: 'question-1',
  type: 'FILL_GAP',
  difficulty: 'MEDIUM',
  questionText: 'The {1} produces {2}.',
  content: { gaps: [] },
  createdAt: '2026-07-11T09:00:00.000Z',
  updatedAt: '2026-07-11T09:00:00.000Z',
  quizIds: ['quiz-1'],
  tagIds: [],
  ...overrides,
});

const renderInline = ({
  quizId = 'quiz-1',
  questionIds = [],
  onChange = vi.fn(),
}: {
  quizId?: string;
  questionIds?: string[];
  onChange?: (ids: string[]) => void;
} = {}) =>
  renderWithProviders(
    <QuizQuestionInline
      quizId={quizId}
      questionIds={questionIds}
      onChange={onChange}
      defaultDifficulty="HARD"
    />,
    { withAuthProvider: false },
  );

describe('QuizQuestionInline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getQuestions.mockResolvedValue({ content: [] });
    mocks.removeQuestionFromQuiz.mockResolvedValue(undefined);
  });

  it('loads all existing quiz questions, synchronizes parent IDs, and formats fill-gap text', async () => {
    const fillGapQuestion = createQuestion();
    const secondQuestion = createQuestion({
      id: 'question-2',
      type: 'TRUE_FALSE',
      questionText: 'The system is available.',
    });
    mocks.getQuestions.mockResolvedValue({ content: [fillGapQuestion, secondQuestion] });
    const onChange = vi.fn();

    renderInline({ onChange });

    expect(await screen.findByText('The ___ produces ___.')).toBeInTheDocument();
    expect(screen.getByText('The system is available.')).toBeInTheDocument();
    expect(mocks.getQuestions).toHaveBeenCalledWith({ quizId: 'quiz-1', page: 0, size: 50 });
    expect(onChange).toHaveBeenCalledWith(['question-1', 'question-2']);
    expect(screen.getByText('FILL GAP')).toBeInTheDocument();
  });

  it('opens the create form with the quiz context and adds a newly created question', async () => {
    const createdQuestion = createQuestion({
      id: 'question-created',
      questionText: 'Created question text.',
    });
    mocks.getQuestionById.mockResolvedValue(createdQuestion);
    const onChange = vi.fn();
    const { user } = renderInline({ onChange });

    await screen.findByText('No questions yet');
    await user.click(screen.getAllByRole('button', { name: 'Add Question' })[0]);

    expect(screen.getByText('Question form quiz: quiz-1')).toBeInTheDocument();
    expect(screen.getByText('Question form difficulty: HARD')).toBeInTheDocument();
    expect(screen.getByText('Question form mode: create')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save question' }));

    await waitFor(() => {
      expect(mocks.getQuestionById).toHaveBeenCalledWith('question-created');
    });
    expect(onChange).toHaveBeenCalledWith(['question-created']);
    expect(await screen.findByText('Question added to quiz.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Question form' })).not.toBeInTheDocument();
  });

  it('loads updated question content after editing', async () => {
    const initialQuestion = createQuestion({ questionText: 'Original question text.' });
    const updatedQuestion = createQuestion({ questionText: 'Updated question text.' });
    mocks.getQuestions.mockResolvedValue({ content: [initialQuestion] });
    mocks.getQuestionById.mockResolvedValue(updatedQuestion);
    const { user } = renderInline();

    await screen.findByText('Original question text.');
    await user.click(screen.getByTitle('Edit question'));

    expect(screen.getByText('Question form mode: edit question-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save question' }));

    expect(await screen.findByText('Updated question text.')).toBeInTheDocument();
    expect(await screen.findByText('Question updated.')).toBeInTheDocument();
  });

  it('removes an existing question after confirmation', async () => {
    const question = createQuestion();
    mocks.getQuestions.mockResolvedValue({ content: [question] });
    const onChange = vi.fn();
    const { user } = renderInline({ questionIds: ['question-1'], onChange });

    await screen.findByText('The ___ produces ___.');
    await user.click(screen.getByTitle('Delete question'));

    expect(screen.getByRole('dialog', { name: 'Remove Question' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(mocks.removeQuestionFromQuiz).toHaveBeenCalledWith('quiz-1', 'question-1');
    });
    expect(onChange).toHaveBeenCalledWith([]);
    expect(await screen.findByText('Question removed from quiz.')).toBeInTheDocument();
    expect(screen.queryByText('The ___ produces ___.')).not.toBeInTheDocument();
  });

  it('shows a loading failure without retaining stale questions', async () => {
    mocks.getQuestions.mockRejectedValue(new Error('Question service is unavailable.'));

    renderInline();

    expect(await screen.findByText('Question service is unavailable.')).toBeInTheDocument();
    expect(screen.getByText('No questions yet')).toBeInTheDocument();
  });
});
