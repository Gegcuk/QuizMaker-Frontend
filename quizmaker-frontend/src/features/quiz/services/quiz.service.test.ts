import { beforeEach, describe, expect, it } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type {
  LeaderboardEntryDto,
  Paginated,
  QuizDto,
  QuizGenerationResponse,
  QuizGenerationStatus,
  AttemptDto,
  AttemptStatsDto,
  CreateShareLinkResponse,
  ImportSummaryDto,
  JobStatistics,
  QuizResultSummaryDto,
} from '@/types';
import { QuizService } from './quiz.service';

const quiz: QuizDto = {
  id: 'quiz-1',
  createdAt: '2026-07-07T12:00:00Z',
  updatedAt: '2026-07-07T12:00:00Z',
  creatorId: 'user-1',
  title: 'Architecture Quiz',
  visibility: 'PRIVATE',
  difficulty: 'MEDIUM',
  status: 'DRAFT',
  estimatedTime: 10,
  isRepetitionEnabled: false,
  timerEnabled: false,
  timerDuration: 10,
  tagIds: [],
};

const page: Paginated<QuizDto> = {
  content: [quiz],
  totalElements: 1,
  totalPages: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
  numberOfElements: 1,
  empty: false,
};

const generationResponse: QuizGenerationResponse = {
  jobId: 'job-1',
  status: 'PENDING',
  message: 'Generation queued',
  estimatedTimeSeconds: 60,
};

const generationStatus: QuizGenerationStatus = {
  jobId: 'job-1',
  status: 'PROCESSING',
  totalChunks: 2,
  processedChunks: 1,
  progressPercentage: 50,
  currentChunk: 'Chunk 1/2',
  estimatedCompletion: '2026-07-07T12:02:00Z',
  errorMessage: null,
  totalQuestionsGenerated: 3,
  elapsedTimeSeconds: 30,
  estimatedTimeRemainingSeconds: 30,
  generatedQuizId: null,
  startedAt: '2026-07-07T12:01:00Z',
  completedAt: null,
};

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

describe('QuizService', () => {
  let axios: AxiosMock;
  let service: QuizService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new QuizService(axios.instance);
  });

  it('creates a quiz and preserves the generated ID response', async () => {
    const request = { title: 'Architecture Quiz' };
    const response = { quizId: 'quiz-1' };
    axios.post.mockResolvedValue({ data: response });

    await expect(service.createQuiz(request)).resolves.toBe(response);
    expect(axios.post).toHaveBeenCalledWith('/v1/quizzes', request);
  });

  it('lists quizzes with live array filters and own-quiz scope', async () => {
    const filters = {
      page: 1,
      size: 10,
      sort: ['createdAt,desc'],
      category: ['Architecture'],
      tag: ['DDD'],
      authorName: 'architect',
      search: 'boundaries',
      difficulty: 'MEDIUM' as const,
    };
    axios.get.mockResolvedValue({ data: page });

    await expect(service.getQuizzes(filters)).resolves.toBe(page);
    await expect(service.getMyQuizzes(filters)).resolves.toBe(page);

    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/quizzes', { params: filters });
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/quizzes', {
      params: { ...filters, scope: 'me' },
    });
  });

  it('uses only deployed pagination parameters for public quizzes', async () => {
    const params = { page: 0, size: 12, sort: ['createdAt,desc'] };
    axios.get.mockResolvedValue({ data: page });

    await expect(service.getPublicQuizzes(params)).resolves.toBe(page);
    expect(axios.get).toHaveBeenCalledWith('/v1/quizzes/public', { params });
  });

  it('retrieves, updates, and deletes an individual quiz', async () => {
    const update = { title: 'Updated Architecture Quiz' };
    axios.get.mockResolvedValue({ data: quiz });
    axios.patch.mockResolvedValue({ data: { ...quiz, ...update } });
    axios.delete.mockResolvedValue({ data: undefined });

    await expect(service.getQuizById('quiz-1')).resolves.toBe(quiz);
    await service.updateQuiz('quiz-1', update);
    await expect(service.deleteQuiz('quiz-1')).resolves.toBeUndefined();

    expect(axios.get).toHaveBeenCalledWith('/v1/quizzes/quiz-1');
    expect(axios.patch).toHaveBeenCalledWith('/v1/quizzes/quiz-1', update);
    expect(axios.delete).toHaveBeenCalledWith('/v1/quizzes/quiz-1');
  });

  it('adds and removes questions with the deployed HTTP methods', async () => {
    axios.post.mockResolvedValue({ data: undefined });
    axios.delete.mockResolvedValue({ data: undefined });

    await service.addQuestionToQuiz('quiz-1', 'question-1');
    await service.removeQuestionFromQuiz('quiz-1', 'question-1');

    expect(axios.post).toHaveBeenCalledWith('/v1/quizzes/quiz-1/questions/question-1');
    expect(axios.put).not.toHaveBeenCalled();
    expect(axios.delete).toHaveBeenCalledWith('/v1/quizzes/quiz-1/questions/question-1');
  });

  it('submits document and text generation payloads unchanged', async () => {
    const documentRequest = {
      documentId: 'document-1',
      questionsPerType: { MCQ_SINGLE: 3 },
      quizScope: 'ENTIRE_DOCUMENT' as const,
    };
    const textRequest = {
      text: 'Architecture is about tradeoffs.',
      questionsPerType: { TRUE_FALSE: 2 },
      chunkingStrategy: 'AUTO' as const,
    };
    axios.post.mockResolvedValue({ data: generationResponse });

    await service.generateQuizFromDocument(documentRequest);
    await service.generateQuizFromText(textRequest);

    expect(axios.post).toHaveBeenNthCalledWith(
      1,
      '/v1/quizzes/generate-from-document',
      documentRequest,
    );
    expect(axios.post).toHaveBeenNthCalledWith(
      2,
      '/v1/quizzes/generate-from-text',
      textRequest,
    );
  });

  it('sends generation upload options as live query parameters with a multipart file body', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['content']), 'architecture.txt');
    formData.append('title', 'Architecture Notes');
    formData.append('quizTitle', 'Architecture Quiz');
    formData.append('questionsPerType', JSON.stringify({ MCQ_SINGLE: 3 }));
    formData.append('difficulty', 'MEDIUM');
    formData.append('chunkIndices', JSON.stringify([0, 2]));
    formData.append('tagIds', JSON.stringify(['tag-1', 'tag-2']));
    axios.post.mockResolvedValue({ data: generationResponse });

    await expect(service.generateQuizFromUpload(formData)).resolves.toBe(generationResponse);

    const [url, uploadData, config] = axios.post.mock.calls[0];
    expect(url).toBe('/v1/quizzes/generate-from-upload');
    expect(uploadData).toBeInstanceOf(FormData);
    expect(Array.from((uploadData as FormData).keys())).toEqual(['file']);
    expect(config).toEqual({
      params: {
        quizTitle: 'Architecture Quiz',
        questionsPerType: '{"MCQ_SINGLE":3}',
        difficulty: 'MEDIUM',
        chunkIndices: ['0', '2'],
        tagIds: ['tag-1', 'tag-2'],
      },
      _isFileUpload: true,
    });
  });

  it('retrieves and cancels generation jobs with the status response contract', async () => {
    axios.get
      .mockResolvedValueOnce({ data: generationStatus })
      .mockResolvedValueOnce({ data: quiz });
    axios.delete.mockResolvedValue({
      data: { ...generationStatus, status: 'CANCELLED' },
    });

    await expect(service.getGenerationStatus('job-1')).resolves.toBe(generationStatus);
    await expect(service.getGeneratedQuiz('job-1')).resolves.toBe(quiz);
    await expect(service.cancelGenerationJob('job-1')).resolves.toMatchObject({
      status: 'CANCELLED',
    });

    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/quizzes/generation-status/job-1');
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/quizzes/generated-quiz/job-1');
    expect(axios.delete).toHaveBeenCalledWith('/v1/quizzes/generation-status/job-1');
  });

  it('retrieves result summaries and leaderboard entries', async () => {
    const results: QuizResultSummaryDto = {
      quizId: 'quiz-1',
      attemptsCount: 2,
      averageScore: 75,
      bestScore: 100,
      worstScore: 50,
      passRate: 50,
      questionStats: [],
    };
    const leaderboard: LeaderboardEntryDto[] = [
      { userId: 'user-1', username: 'architect', bestScore: 100 },
    ];
    axios.get
      .mockResolvedValueOnce({ data: results })
      .mockResolvedValueOnce({ data: leaderboard });

    await expect(service.getQuizResults('quiz-1')).resolves.toBe(results);
    await expect(service.getQuizLeaderboard('quiz-1', 5)).resolves.toBe(leaderboard);

    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/quizzes/quiz-1/results');
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/quizzes/quiz-1/leaderboard', {
      params: { top: 5 },
    });
  });

  it('updates visibility and status and exports binary content', async () => {
    const exported = new Blob(['quiz']);
    axios.patch.mockResolvedValue({ data: quiz });
    axios.get.mockResolvedValue({ data: exported });

    await service.updateQuizVisibility('quiz-1', { visibility: 'PUBLIC' });
    await service.updateQuizStatus('quiz-1', { status: 'PUBLISHED' });
    await expect(
      service.exportQuizzes({ format: 'JSON_EDITABLE', quizIds: ['quiz-1'] }),
    ).resolves.toBe(exported);

    expect(axios.patch).toHaveBeenNthCalledWith(1, '/v1/quizzes/quiz-1/visibility', {
      visibility: 'PUBLIC',
    });
    expect(axios.patch).toHaveBeenNthCalledWith(2, '/v1/quizzes/quiz-1/status', {
      status: 'PUBLISHED',
    });
    expect(axios.get).toHaveBeenCalledWith('/v1/quizzes/export', {
      params: { format: 'JSON_EDITABLE', quizIds: ['quiz-1'] },
      responseType: 'blob',
    });
  });

  it('uses the dedicated archive, restore, and moderation-review lifecycle routes', async () => {
    axios.patch
      .mockResolvedValueOnce({ data: { ...quiz, status: 'ARCHIVED' } })
      .mockResolvedValueOnce({ data: quiz });
    axios.post.mockResolvedValue({ data: undefined });

    await expect(service.archiveQuiz('quiz-1')).resolves.toMatchObject({ status: 'ARCHIVED' });
    await expect(service.unarchiveQuiz('quiz-1')).resolves.toBe(quiz);
    await expect(service.submitQuizForReview('quiz-1')).resolves.toBeUndefined();

    expect(axios.patch).toHaveBeenNthCalledWith(1, '/v1/quizzes/quiz-1/archive');
    expect(axios.patch).toHaveBeenNthCalledWith(2, '/v1/quizzes/quiz-1/unarchive');
    expect(axios.post).toHaveBeenCalledWith('/v1/quizzes/quiz-1/submit-for-review');
  });

  it('changes quiz taxonomy through the documented no-content endpoints', async () => {
    axios.post.mockResolvedValue({ data: undefined });
    axios.patch.mockResolvedValue({ data: undefined });
    axios.delete.mockResolvedValue({ data: undefined });

    await service.addTagToQuiz('quiz-1', 'tag-1');
    await service.removeTagFromQuiz('quiz-1', 'tag-1');
    await service.changeQuizCategory('quiz-1', 'category-1');

    expect(axios.post).toHaveBeenCalledWith('/v1/quizzes/quiz-1/tags/tag-1');
    expect(axios.delete).toHaveBeenCalledWith('/v1/quizzes/quiz-1/tags/tag-1');
    expect(axios.patch).toHaveBeenCalledWith('/v1/quizzes/quiz-1/category/category-1');
  });

  it('creates and revokes share links without putting the quiz ID in the body', async () => {
    const shareLink: CreateShareLinkResponse = {
      token: 'raw-token',
      link: {
        id: 'link-1',
        quizId: 'quiz-1',
        createdBy: 'user-1',
        scope: 'QUIZ_ATTEMPT_START',
        oneTime: true,
        createdAt: '2026-07-15T10:00:00Z',
      },
    };
    axios.post.mockResolvedValue({ data: shareLink });
    axios.delete.mockResolvedValue({ data: undefined });

    await expect(
      service.createShareLink('quiz-1', {
        scope: 'QUIZ_ATTEMPT_START',
        oneTime: true,
      }),
    ).resolves.toBe(shareLink);
    await service.revokeShareLink('link-1');

    expect(axios.post).toHaveBeenCalledWith('/v1/quizzes/quiz-1/share-link', {
      scope: 'QUIZ_ATTEMPT_START',
      oneTime: true,
    });
    expect(axios.delete).toHaveBeenCalledWith('/v1/quizzes/shared/link-1');
  });

  it('retrieves owner attempt data and documented generation statistics', async () => {
    const attempts: AttemptDto[] = [{
      attemptId: 'attempt-1',
      quizId: 'quiz-1',
      userId: 'user-2',
      startedAt: '2026-07-15T10:00:00Z',
      status: 'COMPLETED',
      mode: 'ONE_BY_ONE',
    }];
    const attemptStats: AttemptStatsDto = {
      attemptId: 'attempt-1',
      totalTime: 'PT5M',
      averageTimePerQuestion: 'PT1M',
      questionsAnswered: 5,
      correctAnswers: 4,
      accuracyPercentage: 80,
      completionPercentage: 100,
      questionTimings: [],
      startedAt: '2026-07-15T10:00:00Z',
      completedAt: '2026-07-15T10:05:00Z',
    };
    const jobStatistics: JobStatistics = {
      totalJobs: 3,
      completedJobs: 2,
      failedJobs: 1,
      activeJobs: 0,
      averageGenerationTimeSeconds: 42,
    };
    axios.get
      .mockResolvedValueOnce({ data: attempts })
      .mockResolvedValueOnce({ data: attemptStats })
      .mockResolvedValueOnce({ data: jobStatistics });

    await expect(service.getQuizAttempts('quiz-1')).resolves.toBe(attempts);
    await expect(service.getQuizAttemptStats('quiz-1', 'attempt-1')).resolves.toBe(attemptStats);
    await expect(service.getGenerationJobStatistics()).resolves.toBe(jobStatistics);

    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/quizzes/quiz-1/attempts');
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/quizzes/quiz-1/attempts/attempt-1/stats');
    expect(axios.get).toHaveBeenNthCalledWith(3, '/v1/quizzes/generation-jobs/statistics');
  });

  it('runs documented generation maintenance operations', async () => {
    axios.post
      .mockResolvedValueOnce({ data: 'Job cancelled' })
      .mockResolvedValueOnce({ data: 'Cleaned up 2 stale jobs' });

    await expect(service.forceCancelGenerationJob('job-1')).resolves.toBe('Job cancelled');
    await expect(service.cleanupStaleGenerationJobs()).resolves.toBe('Cleaned up 2 stale jobs');

    expect(axios.post).toHaveBeenNthCalledWith(1, '/v1/quizzes/generation-jobs/job-1/force-cancel');
    expect(axios.post).toHaveBeenNthCalledWith(2, '/v1/quizzes/generation-jobs/cleanup-stale');
  });

  it('serializes quiz imports as multipart data and returns the import summary', async () => {
    const file = new File(['{"title":"Architecture Quiz"}'], 'quiz.json', {
      type: 'application/json',
    });
    const summary: ImportSummaryDto = {
      total: 1,
      created: 1,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };
    axios.post.mockResolvedValue({ data: summary });

    await expect(
      service.importQuizzes({
        file,
        format: 'JSON_EDITABLE',
        strategy: 'UPSERT_BY_ID',
        dryRun: true,
        autoCreateTags: false,
        autoCreateCategory: true,
      }),
    ).resolves.toBe(summary);

    const [url, formData, config] = axios.post.mock.calls[0];
    expect(url).toBe('/v1/quizzes/import');
    expect(formData).toBeInstanceOf(FormData);
    expect(Array.from((formData as FormData).entries())).toEqual([
      ['file', file],
      ['format', 'JSON_EDITABLE'],
      ['strategy', 'UPSERT_BY_ID'],
      ['dryRun', 'true'],
      ['autoCreateTags', 'false'],
      ['autoCreateCategory', 'true'],
    ]);
    expect(config).toEqual({ _isFileUpload: true });
  });

  it('normalizes authorization failures for lifecycle mutations', async () => {
    axios.patch.mockRejectedValue(problemError(403, 'You do not own this quiz.'));

    await expect(service.archiveQuiz('quiz-1')).rejects.toThrow('Insufficient permissions');
  });

  it('preserves validation and conflict ProblemDetail text', async () => {
    axios.post
      .mockRejectedValueOnce(problemError(400, 'Quiz title must contain at least 3 characters.'))
      .mockRejectedValueOnce(problemError(409, 'Generation job is already complete.'));

    await expect(service.createQuiz({ title: 'A' })).rejects.toThrow(
      'Validation error: Quiz title must contain at least 3 characters.',
    );
    await expect(
      service.generateQuizFromText({ text: 'text', questionsPerType: { MCQ_SINGLE: 1 } }),
    ).rejects.toThrow('Conflict: Generation job is already complete.');
  });

  it('marks insufficient-balance conflicts for the creation flow', async () => {
    axios.post.mockRejectedValue(
      problemError(409, 'Insufficient token balance for generation.'),
    );

    await expect(
      service.generateQuizFromDocument({
        documentId: 'document-1',
        questionsPerType: { MCQ_SINGLE: 1 },
      }),
    ).rejects.toMatchObject({
      code: 'INSUFFICIENT_BALANCE',
      isBalanceError: true,
      userMessage: 'Insufficient token balance for generation.',
    });
  });

  it.each([
    [401, 'Authentication required'],
    [403, 'Insufficient permissions'],
    [404, 'Quiz not found'],
    [429, 'Too many requests'],
    [500, 'Server error occurred'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.get.mockRejectedValue(problemError(status, 'Backend detail'));

    await expect(service.getQuizById('quiz-1')).rejects.toThrow(expectedMessage);
  });

  it('preserves network failure context', async () => {
    axios.get.mockRejectedValue(new Error('Network unavailable'));

    await expect(service.getQuizById('quiz-1')).rejects.toThrow('Network unavailable');
  });
});
