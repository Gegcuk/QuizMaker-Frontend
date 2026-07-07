import { beforeEach, describe, expect, it } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type {
  LeaderboardEntryDto,
  QuizResultSummaryDto,
} from '@/types';
import { ResultService } from './result.service';

const results: QuizResultSummaryDto = {
  quizId: 'quiz-1',
  attemptsCount: 3,
  averageScore: 7.5,
  bestScore: 10,
  worstScore: 5,
  passRate: 66.7,
  questionStats: [
    {
      questionId: 'question-1',
      timesAsked: 3,
      timesCorrect: 2,
      correctRate: 66.7,
    },
  ],
};

const leaderboard: LeaderboardEntryDto[] = [
  { userId: 'user-1', username: 'architect', bestScore: 10 },
];

const problemError = (status: number, detail: string) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: {
    status,
    data: {
      type: 'https://quizzence.com/docs/errors/validation-failed',
      title: status === 429 ? 'Too Many Requests' : 'Request Failed',
      status,
      detail,
    },
  },
});

describe('ResultService', () => {
  let axios: AxiosMock;
  let service: ResultService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new ResultService(axios.instance);
  });

  it('retrieves the deployed aggregate result contract', async () => {
    axios.get.mockResolvedValue({ data: results });

    await expect(service.getQuizResults('quiz-1')).resolves.toBe(results);
    expect(axios.get).toHaveBeenCalledWith('/v1/quizzes/quiz-1/results');
  });

  it('retrieves leaderboard entries with the deployed default limit', async () => {
    axios.get.mockResolvedValue({ data: leaderboard });

    await expect(service.getQuizLeaderboard('quiz-1')).resolves.toBe(leaderboard);
    expect(axios.get).toHaveBeenCalledWith('/v1/quizzes/quiz-1/leaderboard', {
      params: { top: 10 },
    });
  });

  it('supports an explicit leaderboard limit', async () => {
    axios.get.mockResolvedValue({ data: leaderboard });

    await expect(service.getQuizLeaderboard('quiz-1', 25)).resolves.toBe(leaderboard);
    expect(axios.get).toHaveBeenCalledWith('/v1/quizzes/quiz-1/leaderboard', {
      params: { top: 25 },
    });
  });

  it('preserves live ProblemDetail detail for validation failures', async () => {
    axios.get.mockRejectedValue(problemError(400, 'Top must be greater than zero.'));

    await expect(service.getQuizLeaderboard('quiz-1', 0)).rejects.toThrow(
      'Validation error: Top must be greater than zero.',
    );
  });

  it.each([
    [401, 'Authentication required'],
    [403, 'Insufficient permissions to view quiz results'],
    [404, 'Quiz results not found'],
    [429, 'Too many requests. Please try again later.'],
    [500, 'Server error occurred while loading quiz results'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.get.mockRejectedValue(problemError(status, 'Backend detail'));

    await expect(service.getQuizResults('quiz-1')).rejects.toThrow(expectedMessage);
  });

  it('preserves HTTP status metadata for callers', async () => {
    axios.get.mockRejectedValue(problemError(403, 'Forbidden'));

    await expect(service.getQuizResults('quiz-1')).rejects.toMatchObject({
      status: 403,
    });
  });

  it('preserves network failure context', async () => {
    axios.get.mockRejectedValue(new Error('Network unavailable'));

    await expect(service.getQuizResults('quiz-1')).rejects.toThrow(
      'Network unavailable',
    );
  });
});
