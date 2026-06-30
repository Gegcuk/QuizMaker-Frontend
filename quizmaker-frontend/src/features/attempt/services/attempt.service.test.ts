import { beforeEach, describe, expect, it } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type {
  AnswerSubmissionDto,
  AnswerSubmissionRequest,
  AttemptDetailsDto,
  AttemptDto,
  AttemptResultDto,
  AttemptReviewDto,
  AttemptStatsDto,
  AttemptSummaryDto,
  BatchAnswerSubmissionRequest,
  CurrentQuestionDto,
  Page,
  QuestionForAttemptDto,
  StartAttemptResponse,
} from '../types/attempt.types';
import { AttemptService } from './attempt.service';

const attempt: AttemptDto = {
  attemptId: 'attempt-1',
  quizId: 'quiz-1',
  userId: 'user-1',
  startedAt: '2026-06-30T12:00:00Z',
  status: 'IN_PROGRESS',
  mode: 'ONE_BY_ONE',
};

const question: QuestionForAttemptDto = {
  id: 'question-1',
  type: 'TRUE_FALSE',
  difficulty: 'MEDIUM',
  questionText: 'Architecture decisions should be documented.',
  safeContent: {},
};

const answer: AnswerSubmissionDto = {
  answerId: 'answer-1',
  questionId: 'question-1',
  isCorrect: true,
  score: 1,
  answeredAt: '2026-06-30T12:01:00Z',
};

const answerRequest: AnswerSubmissionRequest = {
  questionId: 'question-1',
  response: { answer: true },
  includeCorrectness: true,
};

const batchRequest: BatchAnswerSubmissionRequest = {
  answers: [answerRequest],
};

const stats: AttemptStatsDto = {
  attemptId: 'attempt-1',
  totalTime: 'PT1M',
  averageTimePerQuestion: 'PT1M',
  questionsAnswered: 1,
  correctAnswers: 1,
  accuracyPercentage: 100,
  completionPercentage: 100,
  questionTimings: [],
  startedAt: '2026-06-30T12:00:00Z',
  completedAt: '2026-06-30T12:01:00Z',
};

const review: AttemptReviewDto = {
  attemptId: 'attempt-1',
  quizId: 'quiz-1',
  userId: 'user-1',
  startedAt: '2026-06-30T12:00:00Z',
  completedAt: '2026-06-30T12:01:00Z',
  totalScore: 1,
  correctCount: 1,
  totalQuestions: 1,
  answers: [
    {
      questionId: 'question-1',
      type: 'TRUE_FALSE',
      questionText: question.questionText,
      questionSafeContent: {},
      userResponse: { answer: true },
      correctAnswer: { answer: true },
      isCorrect: true,
      score: 1,
      answeredAt: '2026-06-30T12:01:00Z',
    },
  ],
};

const page = <T,>(content: T[]): Page<T> => ({
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

const problemError = (status: number, detail: string) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: {
    status,
    data: {
      type: 'https://quizzence.com/docs/errors/validation-failed',
      title: status === 409 ? 'Conflict' : 'Validation Failed',
      status,
      detail,
    },
  },
});

describe('AttemptService', () => {
  let axios: AxiosMock;
  let service: AttemptService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new AttemptService(axios.instance);
  });

  it('starts an attempt with the selected mode', async () => {
    const response: StartAttemptResponse = {
      attemptId: 'attempt-1',
      quizId: 'quiz-1',
      mode: 'ONE_BY_ONE',
      totalQuestions: 1,
      timeLimitMinutes: null,
      startedAt: attempt.startedAt,
    };
    axios.post.mockResolvedValue({ data: response });

    await expect(service.startAttempt('quiz-1', { mode: 'ONE_BY_ONE' })).resolves.toBe(
      response,
    );
    expect(axios.post).toHaveBeenCalledWith('/v1/attempts/quizzes/quiz-1', {
      mode: 'ONE_BY_ONE',
    });
  });

  it('lists attempts and summaries with deployed filters and pagination', async () => {
    const summary: AttemptSummaryDto = {
      ...attempt,
      completedAt: null,
      totalScore: null,
      quiz: {
        id: 'quiz-1',
        title: 'Architecture Quiz',
        questionCount: 1,
        categoryId: 'category-1',
        isPublic: false,
      },
      stats,
    };
    axios.get
      .mockResolvedValueOnce({ data: page([attempt]) })
      .mockResolvedValueOnce({ data: page([summary]) });

    await service.getAttempts({
      page: 1,
      size: 10,
      sort: 'startedAt,desc',
      quizId: 'quiz-1',
      userId: 'user-1',
    });
    await service.getAttemptsSummary({
      page: 0,
      size: 20,
      sort: ['startedAt,desc'],
      quizId: 'quiz-1',
      userId: 'user-1',
      status: 'IN_PROGRESS',
    });

    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/attempts', {
      params: {
        page: 1,
        size: 10,
        sort: 'startedAt,desc',
        quizId: 'quiz-1',
        userId: 'user-1',
      },
    });
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/attempts/summary', {
      params: {
        page: 0,
        size: 20,
        sort: ['startedAt,desc'],
        quizId: 'quiz-1',
        userId: 'user-1',
        status: 'IN_PROGRESS',
      },
    });
  });

  it('retrieves attempt details and the current question', async () => {
    const details: AttemptDetailsDto = {
      ...attempt,
      completedAt: null,
      answers: [answer],
    };
    const currentQuestion: CurrentQuestionDto = {
      question,
      questionNumber: 1,
      totalQuestions: 1,
      attemptStatus: 'IN_PROGRESS',
    };
    axios.get
      .mockResolvedValueOnce({ data: details })
      .mockResolvedValueOnce({ data: currentQuestion });

    await expect(service.getAttemptDetails('attempt-1')).resolves.toBe(details);
    await expect(service.getCurrentQuestion('attempt-1')).resolves.toBe(currentQuestion);

    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/attempts/attempt-1');
    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      '/v1/attempts/attempt-1/current-question',
    );
  });

  it('submits single and batch answer payloads unchanged', async () => {
    axios.post
      .mockResolvedValueOnce({ data: answer })
      .mockResolvedValueOnce({ data: [answer] });

    await expect(service.submitAnswer('attempt-1', answerRequest)).resolves.toBe(answer);
    await expect(service.submitBatchAnswers('attempt-1', batchRequest)).resolves.toEqual([
      answer,
    ]);

    expect(axios.post).toHaveBeenNthCalledWith(
      1,
      '/v1/attempts/attempt-1/answers',
      answerRequest,
    );
    expect(axios.post).toHaveBeenNthCalledWith(
      2,
      '/v1/attempts/attempt-1/answers/batch',
      batchRequest,
    );
  });

  it('completes an attempt and retrieves stats, review, and answer key', async () => {
    const result: AttemptResultDto = {
      attemptId: 'attempt-1',
      quizId: 'quiz-1',
      userId: 'user-1',
      startedAt: attempt.startedAt,
      completedAt: '2026-06-30T12:01:00Z',
      totalScore: 1,
      correctCount: 1,
      totalQuestions: 1,
      answers: [answer],
    };
    const reviewOptions = {
      includeUserAnswers: true,
      includeCorrectAnswers: true,
      includeQuestionContext: false,
    };
    axios.post.mockResolvedValue({ data: result });
    axios.get
      .mockResolvedValueOnce({ data: stats })
      .mockResolvedValueOnce({ data: review })
      .mockResolvedValueOnce({ data: review });

    await expect(service.completeAttempt('attempt-1')).resolves.toBe(result);
    await expect(service.getAttemptStats('attempt-1')).resolves.toBe(stats);
    await expect(service.getAttemptReview('attempt-1', reviewOptions)).resolves.toBe(review);
    await expect(service.getAttemptAnswerKey('attempt-1')).resolves.toBe(review);

    expect(axios.post).toHaveBeenCalledWith('/v1/attempts/attempt-1/complete');
    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/attempts/attempt-1/stats');
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/attempts/attempt-1/review', {
      params: reviewOptions,
    });
    expect(axios.get).toHaveBeenNthCalledWith(3, '/v1/attempts/attempt-1/answer-key');
  });

  it('pauses, resumes, and deletes an attempt using deployed lifecycle routes', async () => {
    axios.post
      .mockResolvedValueOnce({ data: { ...attempt, status: 'PAUSED' } })
      .mockResolvedValueOnce({ data: attempt });
    axios.delete.mockResolvedValue({ data: undefined });

    await service.pauseAttempt('attempt-1');
    await service.resumeAttempt('attempt-1');
    await service.deleteAttempt('attempt-1');

    expect(axios.post).toHaveBeenNthCalledWith(1, '/v1/attempts/attempt-1/pause');
    expect(axios.post).toHaveBeenNthCalledWith(2, '/v1/attempts/attempt-1/resume');
    expect(axios.delete).toHaveBeenCalledWith('/v1/attempts/attempt-1');
  });

  it('retrieves shuffled safe questions for a quiz', async () => {
    axios.get.mockResolvedValue({ data: [question] });

    await expect(service.getShuffledQuestions('quiz-1')).resolves.toEqual([question]);
    expect(axios.get).toHaveBeenCalledWith(
      '/v1/attempts/quizzes/quiz-1/questions/shuffled',
    );
  });

  it('preserves live ProblemDetail detail text for validation and conflict failures', async () => {
    axios.post
      .mockRejectedValueOnce(problemError(400, 'Answer payload does not match the schema.'))
      .mockRejectedValueOnce(problemError(409, 'Attempt has already been completed.'));

    await expect(service.submitAnswer('attempt-1', answerRequest)).rejects.toThrow(
      'Validation error: Answer payload does not match the schema.',
    );
    await expect(service.completeAttempt('attempt-1')).rejects.toThrow(
      'Conflict: Attempt has already been completed.',
    );
  });

  it.each([
    [401, 'Authentication required'],
    [403, 'Insufficient permissions'],
    [404, 'Attempt not found'],
    [500, 'Server error occurred'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.get.mockRejectedValue(problemError(status, 'Backend detail'));

    await expect(service.getAttemptDetails('attempt-1')).rejects.toThrow(expectedMessage);
  });

  it('preserves network failure context', async () => {
    axios.get.mockRejectedValue(new Error('Network unavailable'));

    await expect(service.getAttemptStats('attempt-1')).rejects.toThrow(
      'Network unavailable',
    );
  });
});
