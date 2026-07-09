import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuestionDto } from '@/types';
import QuestionBank from './QuestionBank';

const questionServiceMocks = vi.hoisted(() => ({
  getQuestions: vi.fn(),
}));

vi.mock('@/services', () => ({
  QuestionService: vi.fn(function QuestionService() {
    return questionServiceMocks;
  }),
  api: {},
}));

const makeQuestion = (overrides: Partial<QuestionDto>): QuestionDto => ({
  id: 'question-1',
  type: 'MCQ_SINGLE',
  difficulty: 'EASY',
  questionText: 'What is the capital of France?',
  content: { options: [] },
  hint: null,
  explanation: null,
  attachmentUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  quizIds: [],
  tagIds: [],
  ...overrides,
});

const questions = [
  makeQuestion({ id: 'question-1' }),
  makeQuestion({
    id: 'question-2',
    type: 'TRUE_FALSE',
    difficulty: 'HARD',
    questionText: 'The Earth is the third planet from the Sun.',
    quizIds: ['quiz-1'],
  }),
];

describe('QuestionBank', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    questionServiceMocks.getQuestions.mockResolvedValue({
      content: questions,
      totalPages: 1,
    });
  });

  it('filters loaded questions by search text and excludes questions already in the quiz', async () => {
    const { user } = renderWithProviders(<QuestionBank quizId="quiz-1" />, {
      withAuthProvider: false,
    });

    await screen.findByText('What is the capital of France?');

    expect(screen.queryByText('The Earth is the third planet from the Sun.')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Search'), 'capital');

    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    expect(questionServiceMocks.getQuestions).toHaveBeenCalled();
  });

  it('notifies consumers when a question is selected', async () => {
    const onQuestionSelect = vi.fn();
    const onSelectionChange = vi.fn();
    const { user } = renderWithProviders(
      <QuestionBank
        onQuestionSelect={onQuestionSelect}
        onSelectionChange={onSelectionChange}
      />,
      { withAuthProvider: false },
    );

    await user.click(await screen.findByText('What is the capital of France?'));

    expect(onQuestionSelect).toHaveBeenCalledWith(questions[0]);
    expect(onSelectionChange).toHaveBeenCalledWith(['question-1']);
  });

  it('shows the service error when questions cannot be loaded', async () => {
    questionServiceMocks.getQuestions.mockRejectedValueOnce({
      response: { data: { message: 'Question library is unavailable.' } },
    });

    renderWithProviders(<QuestionBank />, { withAuthProvider: false });

    expect(await screen.findByText('Question library is unavailable.')).toBeInTheDocument();
  });
});
