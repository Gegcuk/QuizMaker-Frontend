import React, { StrictMode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  AttemptDto,
  AttemptStatsDto,
  CurrentQuestionDto,
  Page,
  QuizDto,
  StartAttemptResponse,
} from '@/types';
import {
  type AttemptSessionServices,
  useAttemptSessionController,
} from './useAttemptSessionController';

const question = (id: string) => ({
  id,
  type: 'TRUE_FALSE' as const,
  difficulty: 'MEDIUM' as const,
  questionText: `Question ${id}`,
  safeContent: {},
});

const quiz = (id: string): QuizDto => ({
  id,
  createdAt: '2026-08-24T12:00:00Z',
  updatedAt: '2026-08-24T12:00:00Z',
  creatorId: 'user-1',
  title: `Quiz ${id}`,
  visibility: 'PUBLIC',
  difficulty: 'MEDIUM',
  status: 'PUBLISHED',
  estimatedTime: 10,
  isRepetitionEnabled: false,
  timerEnabled: false,
  timerDuration: 10,
  tagIds: [],
});

const emptyAttempts = (): Page<AttemptDto> => ({
  content: [],
  pageable: {
    sort: { sorted: false, unsorted: true },
    pageNumber: 0,
    pageSize: 20,
  },
  totalPages: 0,
  totalElements: 0,
  last: true,
  first: true,
});

const startedAttempt = (quizId: string): StartAttemptResponse => ({
  attemptId: `attempt-${quizId}`,
  quizId,
  mode: 'ONE_BY_ONE',
  totalQuestions: 1,
  timeLimitMinutes: null,
  startedAt: '2026-08-24T12:00:00Z',
});

const currentQuestion = (quizId: string): CurrentQuestionDto => ({
  question: question(`question-${quizId}`),
  questionNumber: 1,
  totalQuestions: 1,
  attemptStatus: 'IN_PROGRESS',
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

const createServices = (): AttemptSessionServices => ({
  attempt: {
    getAttempts: vi.fn().mockResolvedValue(emptyAttempts()),
    getAttemptDetails: vi.fn(),
    getCurrentQuestion: vi.fn((attemptId: string) =>
      Promise.resolve(currentQuestion(attemptId.replace('attempt-', '')))),
    getShuffledQuestions: vi.fn().mockResolvedValue([]),
    startAttempt: vi.fn((quizId: string) => Promise.resolve(startedAttempt(quizId))),
    getAttemptStats: vi.fn(),
    submitAnswer: vi.fn(),
    submitBatchAnswers: vi.fn(),
    completeAttempt: vi.fn(),
    pauseAttempt: vi.fn(),
    resumeAttempt: vi.fn(),
  },
  quiz: {
    getQuizById: vi.fn((quizId: string) => Promise.resolve(quiz(quizId))),
  },
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAttemptSessionController', () => {
  it('deduplicates in-flight initialization across a StrictMode remount', async () => {
    const services = createServices();
    const start = deferred<StartAttemptResponse>();
    vi.mocked(services.attempt.startAttempt).mockReturnValue(start.promise);

    const { result } = renderHook(
      () => useAttemptSessionController({
        quizId: 'quiz-1',
        requestedAttemptId: null,
        requestedMode: 'ONE_BY_ONE',
        services,
      }),
      { wrapper: StrictMode },
    );

    await waitFor(() => expect(services.attempt.startAttempt).toHaveBeenCalledOnce());
    await act(async () => start.resolve(startedAttempt('quiz-1')));
    await waitFor(() => expect(result.current.state.phase).toBe('ready'));
    expect(services.attempt.getAttempts).toHaveBeenCalledOnce();
  });

  it('ignores an older route result when quiz navigation resolves out of order', async () => {
    const services = createServices();
    const quizA = deferred<QuizDto>();
    const quizB = deferred<QuizDto>();
    vi.mocked(services.quiz.getQuizById).mockImplementation((quizId: string) =>
      quizId === 'quiz-a' ? quizA.promise : quizB.promise);

    const { result, rerender } = renderHook(
      ({ quizId }) => useAttemptSessionController({
        quizId,
        requestedAttemptId: null,
        requestedMode: 'ONE_BY_ONE',
        services,
      }),
      { initialProps: { quizId: 'quiz-a' } },
    );

    rerender({ quizId: 'quiz-b' });
    await act(async () => quizB.resolve(quiz('quiz-b')));
    await waitFor(() => expect(result.current.state.quiz?.id).toBe('quiz-b'));
    await act(async () => quizA.resolve(quiz('quiz-a')));
    expect(result.current.state.quiz?.id).toBe('quiz-b');
    expect(result.current.state.currentQuestion?.id).toBe('question-quiz-b');
  });

  it('ignores an answer result that finishes after navigation to another quiz', async () => {
    const services = createServices();
    const submission = deferred<{
      answerId: string;
      questionId: string;
      isCorrect: boolean;
      score: number;
      answeredAt: string;
    }>();
    vi.mocked(services.attempt.submitAnswer).mockReturnValue(submission.promise);
    const { result, rerender } = renderHook(
      ({ quizId }) => useAttemptSessionController({
        quizId,
        requestedAttemptId: null,
        requestedMode: null,
        services,
      }),
      { initialProps: { quizId: 'quiz-a' } },
    );
    await waitFor(() => expect(result.current.state.quiz?.id).toBe('quiz-a'));

    let oldSubmission: Promise<unknown>;
    act(() => {
      oldSubmission = result.current.actions.submitAnswer({
        questionId: 'question-quiz-a',
        response: { answer: true },
      }, { answer: true });
    });
    await waitFor(() => expect(services.attempt.submitAnswer).toHaveBeenCalledOnce());

    rerender({ quizId: 'quiz-b' });
    await waitFor(() => expect(result.current.state.quiz?.id).toBe('quiz-b'));
    await act(async () => submission.resolve({
      answerId: 'answer-quiz-a',
      questionId: 'question-quiz-a',
      isCorrect: true,
      score: 1,
      answeredAt: '2026-08-24T12:01:00Z',
    }));
    await oldSubmission!;

    expect(result.current.state.currentQuestion?.id).toBe('question-quiz-b');
    expect(result.current.state.answerResult).toBeNull();
    expect(result.current.state.actionError).toBeNull();
  });

  it('does not commit initialization after unmount', async () => {
    const services = createServices();
    const quizRequest = deferred<QuizDto>();
    vi.mocked(services.quiz.getQuizById).mockReturnValue(quizRequest.promise);
    const { result, unmount } = renderHook(() => useAttemptSessionController({
      quizId: 'quiz-unmounted',
      requestedAttemptId: null,
      requestedMode: null,
      services,
    }));

    unmount();
    await act(async () => quizRequest.resolve(quiz('quiz-unmounted')));
    expect(result.current.state.phase).toBe('loading');
  });

  it('does not start a replacement when an explicit resume fails', async () => {
    const services = createServices();
    vi.mocked(services.attempt.getAttemptDetails).mockRejectedValue(new Error('Resume unavailable'));
    const { result } = renderHook(() => useAttemptSessionController({
      quizId: 'quiz-1',
      requestedAttemptId: 'attempt-existing',
      requestedMode: null,
      services,
    }));

    await waitFor(() => expect(result.current.state.phase).toBe('initialization-error'));
    expect(result.current.state.initializationError).toMatch(/Resume unavailable/);
    expect(services.attempt.startAttempt).not.toHaveBeenCalled();
  });

  it('keeps the loaded question after a failed submission and allows retry', async () => {
    const services = createServices();
    vi.mocked(services.attempt.submitAnswer)
      .mockRejectedValueOnce(new Error('Submission unavailable'))
      .mockResolvedValueOnce({
        answerId: 'answer-1',
        questionId: 'question-quiz-1',
        isCorrect: true,
        score: 1,
        answeredAt: '2026-08-24T12:01:00Z',
      });
    const { result } = renderHook(() => useAttemptSessionController({
      quizId: 'quiz-1',
      requestedAttemptId: null,
      requestedMode: null,
      services,
    }));
    await waitFor(() => expect(result.current.state.phase).toBe('ready'));

    await act(async () => {
      await expect(result.current.actions.submitAnswer({
        questionId: 'question-quiz-1',
        response: { answer: true },
      }, { answer: true })).rejects.toThrow('Submission unavailable');
    });
    expect(result.current.state.currentQuestion?.id).toBe('question-quiz-1');
    expect(result.current.state.actionError).toBe('Submission unavailable');

    await act(() => result.current.actions.submitAnswer({
      questionId: 'question-quiz-1',
      response: { answer: true },
    }, { answer: true }));
    expect(result.current.state.answerResult?.isCorrect).toBe(true);
    expect(services.attempt.submitAnswer).toHaveBeenCalledTimes(2);
  });

  it('commits only one submission when manual and expiry actions meet', async () => {
    const services = createServices();
    const submission = deferred<{
      answerId: string;
      questionId: string;
      score: number;
      answeredAt: string;
    }>();
    vi.mocked(services.attempt.submitAnswer).mockReturnValue(submission.promise);
    const { result } = renderHook(() => useAttemptSessionController({
      quizId: 'quiz-1',
      requestedAttemptId: null,
      requestedMode: 'TIMED',
      services,
    }));
    await waitFor(() => expect(result.current.state.phase).toBe('ready'));
    const request = {
      questionId: 'question-quiz-1',
      response: { answer: true },
    };

    let manual: Promise<unknown>;
    let expiry: Promise<unknown>;
    act(() => {
      manual = result.current.actions.submitAnswer(request, request.response);
      expiry = result.current.actions.submitAnswer(request, request.response);
    });
    await waitFor(() => expect(services.attempt.submitAnswer).toHaveBeenCalledOnce());
    await act(async () => submission.resolve({
      answerId: 'answer-1',
      questionId: request.questionId,
      score: 1,
      answeredAt: '2026-08-24T12:01:00Z',
    }));
    await Promise.all([manual!, expiry!]);
    expect(result.current.state.answerResult?.userAnswer).toEqual(request.response);
  });

  it('keeps the session ready when completion fails so the action can be retried', async () => {
    const services = createServices();
    vi.mocked(services.attempt.completeAttempt)
      .mockRejectedValueOnce(new Error('Completion unavailable'))
      .mockResolvedValueOnce({
        attemptId: 'attempt-quiz-1',
        quizId: 'quiz-1',
        userId: 'user-1',
        startedAt: '2026-08-24T12:00:00Z',
        completedAt: '2026-08-24T12:02:00Z',
        totalScore: 1,
        correctCount: 1,
        totalQuestions: 1,
        answers: [],
      });
    const { result } = renderHook(() => useAttemptSessionController({
      quizId: 'quiz-1',
      requestedAttemptId: null,
      requestedMode: null,
      services,
    }));
    await waitFor(() => expect(result.current.state.phase).toBe('ready'));

    await act(async () => {
      await expect(result.current.actions.completeAttempt()).rejects.toThrow('Completion unavailable');
    });
    expect(result.current.state.phase).toBe('ready');
    expect(result.current.state.currentQuestion?.id).toBe('question-quiz-1');
    expect(result.current.state.actionError).toBe('Completion unavailable');

    await act(() => result.current.actions.completeAttempt());
    expect(services.attempt.completeAttempt).toHaveBeenCalledTimes(2);
  });

  it('keeps action failures scoped for pause and refresh operations', async () => {
    const services = createServices();
    vi.mocked(services.attempt.pauseAttempt).mockRejectedValue(new Error('Pause unavailable'));
    const stats: AttemptStatsDto = {
      attemptId: 'attempt-quiz-1',
      totalTime: 'PT1M',
      averageTimePerQuestion: 'PT1M',
      questionsAnswered: 1,
      correctAnswers: 1,
      accuracyPercentage: 100,
      completionPercentage: 100,
      questionTimings: [],
      startedAt: '2026-08-24T12:00:00Z',
      completedAt: null,
    };
    vi.mocked(services.attempt.getAttemptStats).mockResolvedValue(stats);
    const { result } = renderHook(() => useAttemptSessionController({
      quizId: 'quiz-1',
      requestedAttemptId: null,
      requestedMode: null,
      services,
    }));
    await waitFor(() => expect(result.current.state.phase).toBe('ready'));

    await act(async () => {
      await expect(result.current.actions.pauseAttempt()).rejects.toThrow('Pause unavailable');
    });
    expect(result.current.state.phase).toBe('ready');
    expect(result.current.state.actionError).toBe('Pause unavailable');
    await act(() => result.current.actions.refreshStats());
    expect(result.current.state.questionsAnswered).toBe(1);
  });
});
