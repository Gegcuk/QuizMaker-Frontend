import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type {
  AnswerSubmissionDto,
  AttemptDto,
  AttemptStatsDto,
  Page,
  QuestionForAttemptDto,
  StartAttemptResponse,
} from '../types/attempt.types';
import type { QuizDto } from '@/features/quiz/types/quiz.types';
import { AttemptService } from '../services/attempt.service';
import { QuizService } from '@/features/quiz/services/quiz.service';
import AnswerForm from './AnswerForm';
import AttemptBatchAnswers from './AttemptBatchAnswers';
import AttemptContinuation from './AttemptContinuation';
import AttemptShuffledQuestions from './AttemptShuffledQuestions';
import AttemptStart from './AttemptStart';

const quiz: QuizDto = {
  id: 'quiz-1',
  creatorId: 'user-1',
  title: 'Architecture Quiz',
  visibility: 'PRIVATE',
  difficulty: 'MEDIUM',
  status: 'PUBLISHED',
  estimatedTime: 10,
  isRepetitionEnabled: false,
  timerEnabled: false,
  timerDuration: 10,
  tagIds: [],
  createdAt: '2026-06-29T12:00:00Z',
  updatedAt: '2026-06-29T12:00:00Z',
};

const question: QuestionForAttemptDto = {
  id: 'question-1',
  type: 'TRUE_FALSE',
  difficulty: 'MEDIUM',
  questionText: 'The answer can be false.',
  safeContent: {},
};

const answerResult: AnswerSubmissionDto = {
  answerId: 'answer-1',
  questionId: 'question-1',
  isCorrect: true,
  score: 1,
  answeredAt: '2026-06-29T12:01:00Z',
};

const pausedAttempt: AttemptDto = {
  attemptId: 'attempt-1',
  quizId: 'quiz-1',
  userId: 'user-1',
  startedAt: '2026-06-29T12:00:00Z',
  status: 'PAUSED',
  mode: 'ONE_BY_ONE',
};

const attemptStats: AttemptStatsDto = {
  attemptId: 'attempt-1',
  totalTime: 'PT1M',
  averageTimePerQuestion: 'PT1M',
  questionsAnswered: 1,
  correctAnswers: 1,
  accuracyPercentage: 100,
  completionPercentage: 50,
  questionTimings: [],
  startedAt: '2026-06-29T12:00:00Z',
  completedAt: null,
};

const attemptsPage = (content: AttemptDto[]): Page<AttemptDto> => ({
  content,
  pageable: {
    sort: { sorted: false, unsorted: true, empty: true },
    pageNumber: 0,
    pageSize: 20,
    offset: 0,
    paged: true,
    unpaged: false,
  },
  totalPages: 1,
  totalElements: content.length,
  last: true,
  size: 20,
  number: 0,
  sort: { sorted: false, unsorted: true, empty: true },
  numberOfElements: content.length,
  first: true,
  empty: content.length === 0,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('answer submission flows', () => {
  it('maps AnswerForm values through the shared backend response contract', async () => {
    const submitAnswer = vi
      .spyOn(AttemptService.prototype, 'submitAnswer')
      .mockResolvedValue(answerResult);
    const onSubmit = vi.fn();
    const hotspotQuestion: QuestionForAttemptDto = {
      ...question,
      type: 'HOTSPOT',
      safeContent: { regions: [{ id: 7, label: 'Target' }] },
    };
    const { user } = renderWithProviders(
      <AnswerForm
        question={hotspotQuestion}
        attemptId="attempt-1"
        currentAnswer={7}
        onAnswerChange={vi.fn()}
        onSubmit={onSubmit}
        onError={vi.fn()}
      />,
      { withAuthProvider: false },
    );

    await user.click(await screen.findByRole('button', { name: 'Submit Answer' }));

    await waitFor(() => {
      expect(submitAnswer).toHaveBeenCalledWith('attempt-1', {
        questionId: 'question-1',
        response: { selectedRegionId: 7 },
      });
    });
    expect(onSubmit).toHaveBeenCalledWith(answerResult);
  });

  it('allows documented partial batch submission and preserves falsy answers', async () => {
    const submitBatchAnswers = vi
      .spyOn(AttemptService.prototype, 'submitBatchAnswers')
      .mockResolvedValue([answerResult]);
    const onSubmissionComplete = vi.fn();
    const { user } = renderWithProviders(
      <AttemptBatchAnswers
        attemptId="attempt-1"
        answers={{ 'question-1': false }}
        totalQuestions={2}
        onSubmissionComplete={onSubmissionComplete}
        onSubmissionError={vi.fn()}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText(/you can still submit/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Submit All Answers' }));

    await waitFor(() => {
      expect(submitBatchAnswers).toHaveBeenCalledWith('attempt-1', {
        answers: [{ questionId: 'question-1', response: false }],
      });
    });
    await waitFor(() => expect(onSubmissionComplete).toHaveBeenCalledWith([answerResult]), {
      timeout: 1000,
    });
  });
});

describe('attempt setup and continuation flows', () => {
  it('loads shuffled questions and marks a false answer as answered', async () => {
    vi.spyOn(AttemptService.prototype, 'getShuffledQuestions').mockResolvedValue([
      question,
      { ...question, id: 'question-2', questionText: 'Second question.' },
    ]);
    const onQuestionsLoaded = vi.fn();
    const onQuestionChange = vi.fn();
    const { user } = renderWithProviders(
      <AttemptShuffledQuestions
        quizId="quiz-1"
        attemptId="attempt-1"
        onQuestionsLoaded={onQuestionsLoaded}
        onQuestionChange={onQuestionChange}
        currentQuestionIndex={1}
        answers={{ 'question-1': false }}
        onAnswerChange={vi.fn()}
      />,
      { withAuthProvider: false },
    );

    const firstQuestionButton = await screen.findByTitle(/Question 1:/);
    expect(firstQuestionButton).toHaveClass('bg-theme-bg-success');
    expect(screen.getByText('1 of 2 answered')).toBeInTheDocument();

    await user.click(firstQuestionButton);
    expect(onQuestionsLoaded).toHaveBeenCalledOnce();
    expect(onQuestionChange).toHaveBeenCalledWith(0);
  });

  it('starts the selected mode and reports the created attempt', async () => {
    vi.spyOn(QuizService.prototype, 'getQuizById').mockResolvedValue(quiz);
    const startResponse: StartAttemptResponse = {
      attemptId: 'attempt-1',
      quizId: 'quiz-1',
      mode: 'ONE_BY_ONE',
      totalQuestions: 2,
      timeLimitMinutes: null,
      startedAt: '2026-06-29T12:00:00Z',
    };
    const startAttempt = vi
      .spyOn(AttemptService.prototype, 'startAttempt')
      .mockResolvedValue(startResponse);
    const onAttemptStarted = vi.fn();
    const { user } = renderWithProviders(
      <AttemptStart
        quizId="quiz-1"
        quizTitle="Architecture Quiz"
        onAttemptStarted={onAttemptStarted}
      />,
      { withAuthProvider: false },
    );

    await user.click(await screen.findByRole('button', { name: 'Start One by One Attempt' }));

    await waitFor(() => expect(startAttempt).toHaveBeenCalledWith('quiz-1', {
      mode: 'ONE_BY_ONE',
    }));
    expect(onAttemptStarted).toHaveBeenCalledWith('attempt-1');
  });

  it('filters completed attempts and resumes a paused attempt', async () => {
    const completedAttempt: AttemptDto = {
      ...pausedAttempt,
      attemptId: 'attempt-completed',
      status: 'COMPLETED',
    };
    vi.spyOn(AttemptService.prototype, 'getAttempts').mockResolvedValue(
      attemptsPage([pausedAttempt, completedAttempt]),
    );
    vi.spyOn(AttemptService.prototype, 'getAttemptStats').mockResolvedValue(attemptStats);
    vi.spyOn(QuizService.prototype, 'getQuizById').mockResolvedValue(quiz);
    const resumeAttempt = vi
      .spyOn(AttemptService.prototype, 'resumeAttempt')
      .mockResolvedValue({ ...pausedAttempt, status: 'IN_PROGRESS' });
    const onAttemptResumed = vi.fn();
    const { user } = renderWithProviders(
      <AttemptContinuation
        quizId="quiz-1"
        onAttemptResumed={onAttemptResumed}
      />,
      { withAuthProvider: false },
    );

    const resumeButtons = await screen.findAllByRole('button', { name: 'Resume' });
    expect(screen.queryByText('attempt-completed')).not.toBeInTheDocument();
    await user.click(resumeButtons[0]);

    await waitFor(() => expect(resumeAttempt).toHaveBeenCalledWith('attempt-1'));
    expect(onAttemptResumed).toHaveBeenCalledWith('attempt-1');
  });
});
