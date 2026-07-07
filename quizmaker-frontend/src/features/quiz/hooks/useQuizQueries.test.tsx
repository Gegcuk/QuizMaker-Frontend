import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper, createTestQueryClient } from '@/test/render';
import type { QuizDto } from '@/types';
import {
  quizKeys,
  useDeleteQuiz,
  useQuiz,
  useQuizLeaderboard,
  useQuizStats,
  useUpdateQuiz,
} from './useQuizQueries';

const mocks = vi.hoisted(() => ({
  deleteQuiz: vi.fn(),
  getQuizById: vi.fn(),
  getQuizLeaderboard: vi.fn(),
  getQuizResults: vi.fn(),
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  updateQuiz: vi.fn(),
}));

vi.mock('@/services', () => ({
  deleteQuiz: mocks.deleteQuiz,
  getQuizById: mocks.getQuizById,
  getQuizLeaderboard: mocks.getQuizLeaderboard,
  getQuizResults: mocks.getQuizResults,
  updateQuiz: mocks.updateQuiz,
}));

vi.mock('@/utils', () => ({
  getErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : 'Unexpected error',
  logger: mocks.logger,
}));

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

describe('quiz query hooks', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('defines stable hierarchical query keys', () => {
    expect(quizKeys.all).toEqual(['quizzes']);
    expect(quizKeys.list({ status: 'DRAFT' })).toEqual([
      'quizzes',
      'list',
      { filters: { status: 'DRAFT' } },
    ]);
    expect(quizKeys.detail('quiz-1')).toEqual(['quizzes', 'detail', 'quiz-1']);
    expect(quizKeys.stats('quiz-1')).toEqual([
      'quizzes',
      'detail',
      'quiz-1',
      'stats',
    ]);
    expect(quizKeys.leaderboard('quiz-1')).toEqual([
      'quizzes',
      'detail',
      'quiz-1',
      'leaderboard',
    ]);
  });

  it('does not request a quiz until an ID is available', () => {
    const queryClient = createTestQueryClient();
    const wrapper = createQueryWrapper(queryClient);
    const { result } = renderHook(() => useQuiz(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mocks.getQuizById).not.toHaveBeenCalled();
  });

  it('exposes quiz loading, success, and error states', async () => {
    mocks.getQuizById
      .mockResolvedValueOnce(quiz)
      .mockRejectedValueOnce(new Error('Quiz unavailable'));

    const successClient = createTestQueryClient();
    const successHook = renderHook(() => useQuiz('quiz-1'), {
      wrapper: createQueryWrapper(successClient),
    });
    expect(successHook.result.current.isLoading).toBe(true);
    await waitFor(() => expect(successHook.result.current.data).toBe(quiz));
    expect(mocks.getQuizById).toHaveBeenNthCalledWith(1, 'quiz-1');

    const errorClient = createTestQueryClient();
    const errorHook = renderHook(() => useQuiz('quiz-2'), {
      wrapper: createQueryWrapper(errorClient),
    });
    await waitFor(() => expect(errorHook.result.current.isError).toBe(true));
    expect(errorHook.result.current.error).toEqual(new Error('Quiz unavailable'));
  });

  it('loads stats and leaderboard into independent cache keys', async () => {
    const stats = { quizId: 'quiz-1', attemptsCount: 2 };
    const leaderboard = [{ userId: 'user-1', username: 'architect', bestScore: 100 }];
    mocks.getQuizResults.mockResolvedValue(stats);
    mocks.getQuizLeaderboard.mockResolvedValue(leaderboard);
    const queryClient = createTestQueryClient();
    const wrapper = createQueryWrapper(queryClient);
    const statsHook = renderHook(() => useQuizStats('quiz-1'), { wrapper });
    const leaderboardHook = renderHook(() => useQuizLeaderboard('quiz-1'), { wrapper });

    await waitFor(() => expect(statsHook.result.current.data).toBe(stats));
    await waitFor(() => expect(leaderboardHook.result.current.data).toBe(leaderboard));
    expect(queryClient.getQueryData(quizKeys.stats('quiz-1'))).toBe(stats);
    expect(queryClient.getQueryData(quizKeys.leaderboard('quiz-1'))).toBe(leaderboard);
  });

  it('removes deleted detail data and invalidates quiz lists', async () => {
    mocks.deleteQuiz.mockResolvedValue(undefined);
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(quizKeys.detail('quiz-1'), quiz);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteQuiz(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await act(() => result.current.mutateAsync('quiz-1'));

    expect(mocks.deleteQuiz).toHaveBeenCalledWith('quiz-1');
    expect(queryClient.getQueryData(quizKeys.detail('quiz-1'))).toBeUndefined();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: quizKeys.lists() });
  });

  it('updates detail cache and invalidates quiz lists after mutation', async () => {
    const updatedQuiz = { ...quiz, title: 'Updated Architecture Quiz' };
    mocks.updateQuiz.mockResolvedValue(updatedQuiz);
    const queryClient = createTestQueryClient();
    queryClient.setQueryDefaults(quizKeys.details(), { gcTime: Infinity });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateQuiz(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await act(() =>
      result.current.mutateAsync({
        quizId: 'quiz-1',
        data: { title: updatedQuiz.title },
      }),
    );

    expect(mocks.updateQuiz).toHaveBeenCalledWith('quiz-1', {
      title: updatedQuiz.title,
    });
    expect(queryClient.getQueryData(quizKeys.detail('quiz-1'))).toBe(updatedQuiz);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: quizKeys.lists() });
  });

  it('logs normalized mutation failures without changing cached detail data', async () => {
    mocks.updateQuiz.mockRejectedValue(new Error('Update failed'));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(quizKeys.detail('quiz-1'), quiz);
    const { result } = renderHook(() => useUpdateQuiz(), {
      wrapper: createQueryWrapper(queryClient),
    });

    await expect(
      act(() =>
        result.current.mutateAsync({
          quizId: 'quiz-1',
          data: { title: 'Invalid' },
        }),
      ),
    ).rejects.toThrow('Update failed');

    expect(mocks.logger.error).toHaveBeenCalledWith(
      'Failed to update quiz',
      'useUpdateQuiz',
      { quizId: 'quiz-1', error: 'Update failed' },
    );
    expect(queryClient.getQueryData(quizKeys.detail('quiz-1'))).toBe(quiz);
  });
});
