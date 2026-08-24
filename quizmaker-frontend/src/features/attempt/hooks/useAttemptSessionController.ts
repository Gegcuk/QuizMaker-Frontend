import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import api from '@/api/axiosInstance';
import { QuizService } from '@/features/quiz/services/quiz.service';
import { getErrorMessage } from '@/utils/errorUtils';
import type {
  AnswerSubmissionDto,
  AnswerSubmissionRequest,
  AttemptDetailsDto,
  AttemptMode,
  AttemptStatus,
  AttemptStatsDto,
  BatchAnswerSubmissionRequest,
  QuestionForAttemptDto,
} from '@/types';
import type { QuizDto } from '@/types';
import { AttemptService } from '../services/attempt.service';
import type { AnswerInput } from '../utils/answerResponse';

type AttemptActionKind =
  | 'submit-answer'
  | 'submit-batch'
  | 'complete'
  | 'pause'
  | 'resume'
  | 'refresh';

export interface AttemptAnswerResult {
  isCorrect?: boolean;
  correctAnswer?: AnswerSubmissionDto['correctAnswer'];
  userAnswer: unknown;
  score: number | null;
  explanation?: string | null;
  nextQuestion?: QuestionForAttemptDto | null;
}

export interface AttemptSessionState {
  routeKey: string;
  phase: 'loading' | 'ready' | 'initialization-error';
  initializationError: string | null;
  actionError: string | null;
  activeAction: AttemptActionKind | null;
  quiz: QuizDto | null;
  attemptId: string | null;
  attemptMode: AttemptMode;
  attemptStatus: AttemptStatus;
  currentQuestion: QuestionForAttemptDto | null;
  allQuestions: QuestionForAttemptDto[];
  answers: Record<string, AnswerInput>;
  existingAnswers: Record<string, AnswerInput>;
  answerInput: AnswerInput;
  answerResult: AttemptAnswerResult | null;
  totalQuestions: number;
  questionsAnswered: number;
  currentQuestionNumber: number;
}

export interface AttemptSessionServices {
  attempt: Pick<
    AttemptService,
    | 'getAttempts'
    | 'getAttemptDetails'
    | 'getCurrentQuestion'
    | 'getShuffledQuestions'
    | 'startAttempt'
    | 'getAttemptStats'
    | 'submitAnswer'
    | 'submitBatchAnswers'
    | 'completeAttempt'
    | 'pauseAttempt'
    | 'resumeAttempt'
  >;
  quiz: Pick<QuizService, 'getQuizById'>;
}

interface AttemptSessionSnapshot {
  quiz: QuizDto | null;
  attemptId: string;
  attemptMode: AttemptMode;
  attemptStatus: AttemptStatus;
  currentQuestion: QuestionForAttemptDto | null;
  allQuestions: QuestionForAttemptDto[];
  totalQuestions: number;
  questionsAnswered: number;
  currentQuestionNumber: number;
}

type ReducerAction =
  | { type: 'route-loading'; routeKey: string }
  | { type: 'route-ready'; routeKey: string; snapshot: AttemptSessionSnapshot }
  | { type: 'route-failed'; routeKey: string; message: string }
  | { type: 'action-started'; routeKey: string; action: AttemptActionKind }
  | { type: 'action-failed'; routeKey: string; message: string }
  | { type: 'action-finished'; routeKey: string }
  | { type: 'answer-input-changed'; routeKey: string; value: AnswerInput }
  | { type: 'answer-changed'; routeKey: string; questionId: string; value: AnswerInput }
  | {
      type: 'answer-submitted';
      routeKey: string;
      questionId: string;
      userAnswer: unknown;
      result: AnswerSubmissionDto;
    }
  | { type: 'next-question'; routeKey: string }
  | { type: 'status-changed'; routeKey: string; status: AttemptStatus }
  | { type: 'stats-loaded'; routeKey: string; stats: AttemptStatsDto }
  | { type: 'action-error-cleared'; routeKey: string };

const defaultAttemptService = new AttemptService(api);
const defaultQuizService = new QuizService(api);
const defaultServices: AttemptSessionServices = {
  attempt: defaultAttemptService,
  quiz: defaultQuizService,
};

const inFlightInitializations = new Map<string, Promise<AttemptSessionSnapshot>>();
const serviceIds = new WeakMap<object, number>();
let nextServiceId = 1;

const getServiceId = (service: object) => {
  const existingId = serviceIds.get(service);
  if (existingId) return existingId;
  const serviceId = nextServiceId;
  nextServiceId += 1;
  serviceIds.set(service, serviceId);
  return serviceId;
};

const initialState = (routeKey: string): AttemptSessionState => ({
  routeKey,
  phase: 'loading',
  initializationError: null,
  actionError: null,
  activeAction: null,
  quiz: null,
  attemptId: null,
  attemptMode: 'ONE_BY_ONE',
  attemptStatus: 'IN_PROGRESS',
  currentQuestion: null,
  allQuestions: [],
  answers: {},
  existingAnswers: {},
  answerInput: null,
  answerResult: null,
  totalQuestions: 0,
  questionsAnswered: 0,
  currentQuestionNumber: 1,
});

const reducer = (state: AttemptSessionState, action: ReducerAction): AttemptSessionState => {
  if (action.type === 'route-loading') {
    return initialState(action.routeKey);
  }
  if (action.routeKey !== state.routeKey) {
    return state;
  }

  switch (action.type) {
    case 'route-ready':
      return {
        ...initialState(action.routeKey),
        ...action.snapshot,
        phase: 'ready',
      };
    case 'route-failed':
      return {
        ...state,
        phase: 'initialization-error',
        initializationError: action.message,
      };
    case 'action-started':
      return { ...state, activeAction: action.action, actionError: null };
    case 'action-failed':
      return { ...state, activeAction: null, actionError: action.message };
    case 'action-finished':
      return { ...state, activeAction: null };
    case 'answer-input-changed':
      return { ...state, answerInput: action.value, actionError: null };
    case 'answer-changed':
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.value },
        actionError: null,
      };
    case 'answer-submitted':
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.userAnswer },
        answerResult: {
          isCorrect: action.result.isCorrect,
          correctAnswer: action.result.correctAnswer,
          userAnswer: action.userAnswer,
          score: action.result.score,
          explanation: action.result.explanation ?? null,
          nextQuestion: action.result.nextQuestion,
        },
      };
    case 'next-question':
      if (!state.answerResult?.nextQuestion) return state;
      return {
        ...state,
        currentQuestion: state.answerResult.nextQuestion,
        answerInput: null,
        answerResult: null,
        questionsAnswered: state.questionsAnswered + 1,
        currentQuestionNumber: state.currentQuestionNumber + 1,
        actionError: null,
      };
    case 'status-changed':
      return { ...state, attemptStatus: action.status };
    case 'stats-loaded':
      return {
        ...state,
        questionsAnswered: action.stats.questionsAnswered,
        currentQuestionNumber: state.attemptMode === 'ONE_BY_ONE'
          ? action.stats.questionsAnswered + 1
          : state.currentQuestionNumber,
      };
    case 'action-error-cleared':
      return { ...state, actionError: null };
    default: {
      const exhaustiveAction: never = action;
      return exhaustiveAction;
    }
  }
};

const loadQuestions = async (
  services: AttemptSessionServices,
  quizId: string,
  attemptDetails: Pick<AttemptDetailsDto, 'attemptId' | 'mode'>,
) => {
  if (attemptDetails.mode === 'ALL_AT_ONCE') {
    const allQuestions = await services.attempt.getShuffledQuestions(quizId);
    return {
      currentQuestion: null,
      allQuestions,
      totalQuestions: allQuestions.length,
      currentQuestionNumber: 1,
    };
  }

  const current = await services.attempt.getCurrentQuestion(attemptDetails.attemptId);
  return {
    currentQuestion: current.question,
    allQuestions: [],
    totalQuestions: current.totalQuestions,
    currentQuestionNumber: current.questionNumber,
  };
};

const loadExistingAttempt = async (
  services: AttemptSessionServices,
  quizId: string,
  attemptId: string,
) => {
  const details = await services.attempt.getAttemptDetails(attemptId);
  if (details.quizId !== quizId) {
    throw new Error('This attempt does not belong to the requested quiz.');
  }
  const questions = await loadQuestions(services, quizId, details);
  return {
    attemptId,
    attemptMode: details.mode,
    attemptStatus: details.status,
    questionsAnswered: details.answers.length,
    ...questions,
  };
};

const initializeSession = async ({
  quizId,
  requestedAttemptId,
  requestedMode,
  services,
}: {
  quizId: string;
  requestedAttemptId: string | null;
  requestedMode: AttemptMode;
  services: AttemptSessionServices;
}): Promise<AttemptSessionSnapshot> => {
  const quizPromise = services.quiz.getQuizById(quizId).catch(() => null);
  let attemptSnapshot: Omit<AttemptSessionSnapshot, 'quiz'>;

  if (requestedAttemptId) {
    attemptSnapshot = await loadExistingAttempt(services, quizId, requestedAttemptId);
  } else {
    const attempts = await services.attempt.getAttempts({ quizId });
    const existingAttempt = attempts.content.find(
      (attempt) => attempt.status === 'PAUSED' || attempt.status === 'IN_PROGRESS',
    );

    if (existingAttempt) {
      attemptSnapshot = await loadExistingAttempt(
        services,
        quizId,
        existingAttempt.attemptId,
      );
    } else {
      const started = await services.attempt.startAttempt(quizId, { mode: requestedMode });
      const questions = await loadQuestions(services, quizId, {
        attemptId: started.attemptId,
        mode: started.mode,
      });
      attemptSnapshot = {
        attemptId: started.attemptId,
        attemptMode: started.mode,
        attemptStatus: 'IN_PROGRESS',
        questionsAnswered: 0,
        ...questions,
      };
    }
  }

  return { ...attemptSnapshot, quiz: await quizPromise };
};

const getSharedInitialization = (
  key: string,
  load: () => Promise<AttemptSessionSnapshot>,
) => {
  const existing = inFlightInitializations.get(key);
  if (existing) return existing;

  const request = load();
  inFlightInitializations.set(key, request);
  const removeRequest = () => {
    if (inFlightInitializations.get(key) === request) {
      inFlightInitializations.delete(key);
    }
  };
  request.then(removeRequest, removeRequest);
  return request;
};

const normalizeMode = (mode: string | null): AttemptMode => {
  if (mode === 'ALL_AT_ONCE' || mode === 'TIMED') return mode;
  return 'ONE_BY_ONE';
};

export const useAttemptSessionController = ({
  quizId,
  requestedAttemptId,
  requestedMode,
  services = defaultServices,
}: {
  quizId: string | undefined;
  requestedAttemptId: string | null;
  requestedMode: string | null;
  services?: AttemptSessionServices;
}) => {
  const mode = normalizeMode(requestedMode);
  const routeKey = `${quizId ?? 'missing'}:${requestedAttemptId ?? 'new'}:${mode}`;
  const initializationKey = [
    getServiceId(services.attempt as object),
    getServiceId(services.quiz as object),
    routeKey,
  ].join(':');
  const [retryCount, setRetryCount] = useState(0);
  const [state, dispatch] = useReducer(reducer, routeKey, initialState);
  const routeKeyRef = useRef(routeKey);
  const generationRef = useRef(0);
  const actionPromiseRef = useRef<Promise<unknown> | null>(null);
  routeKeyRef.current = routeKey;

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    actionPromiseRef.current = null;
    dispatch({ type: 'route-loading', routeKey });

    if (!quizId) {
      dispatch({ type: 'route-failed', routeKey, message: 'Quiz not found.' });
      return undefined;
    }

    let active = true;
    getSharedInitialization(initializationKey, () => initializeSession({
      quizId,
      requestedAttemptId,
      requestedMode: mode,
      services,
    }))
      .then((snapshot) => {
        if (active && generationRef.current === generation && routeKeyRef.current === routeKey) {
          dispatch({ type: 'route-ready', routeKey, snapshot });
        }
      })
      .catch((error: unknown) => {
        if (active && generationRef.current === generation && routeKeyRef.current === routeKey) {
          dispatch({
            type: 'route-failed',
            routeKey,
            message: `Failed to load this attempt. ${getErrorMessage(error)}`,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [initializationKey, mode, quizId, requestedAttemptId, retryCount, routeKey, services]);

  const runAction = useCallback(async <T,>(
    action: AttemptActionKind,
    operation: () => Promise<T>,
  ): Promise<T | undefined> => {
    if (actionPromiseRef.current) return undefined;

    const actionRouteKey = routeKeyRef.current;
    const generation = generationRef.current;
    dispatch({ type: 'action-started', routeKey: actionRouteKey, action });

    const request = Promise.resolve().then(operation);
    actionPromiseRef.current = request;
    try {
      const result = await request;
      if (routeKeyRef.current !== actionRouteKey || generationRef.current !== generation) {
        return undefined;
      }
      dispatch({ type: 'action-finished', routeKey: actionRouteKey });
      return result;
    } catch (error: unknown) {
      if (routeKeyRef.current === actionRouteKey && generationRef.current === generation) {
        dispatch({
          type: 'action-failed',
          routeKey: actionRouteKey,
          message: getErrorMessage(error),
        });
        throw error;
      }
      return undefined;
    } finally {
      if (actionPromiseRef.current === request) {
        actionPromiseRef.current = null;
      }
    }
  }, []);

  const actions = useMemo(() => ({
    retryInitialization: () => setRetryCount((count) => count + 1),
    clearActionError: () => dispatch({ type: 'action-error-cleared', routeKey }),
    setAnswerInput: (value: AnswerInput) => dispatch({
      type: 'answer-input-changed',
      routeKey,
      value,
    }),
    setAnswer: (questionId: string, value: AnswerInput) => dispatch({
      type: 'answer-changed',
      routeKey,
      questionId,
      value,
    }),
    submitAnswer: async (request: AnswerSubmissionRequest, userAnswer: unknown) => {
      if (!state.attemptId) return undefined;
      const result = await runAction(
        'submit-answer',
        () => services.attempt.submitAnswer(state.attemptId!, request),
      );
      if (result) {
        dispatch({
          type: 'answer-submitted',
          routeKey,
          questionId: request.questionId,
          userAnswer,
          result,
        });
      }
      return result;
    },
    submitBatchAnswers: (request: BatchAnswerSubmissionRequest) => {
      if (!state.attemptId) return Promise.resolve(undefined);
      return runAction(
        'submit-batch',
        () => services.attempt.submitBatchAnswers(state.attemptId!, request),
      );
    },
    completeAttempt: () => {
      if (!state.attemptId) return Promise.resolve(undefined);
      return runAction('complete', () => services.attempt.completeAttempt(state.attemptId!));
    },
    pauseAttempt: async () => {
      if (!state.attemptId) return undefined;
      const attempt = await runAction('pause', () => services.attempt.pauseAttempt(state.attemptId!));
      if (attempt) {
        dispatch({ type: 'status-changed', routeKey, status: attempt.status });
      }
      return attempt;
    },
    resumeAttempt: async () => {
      if (!state.attemptId) return undefined;
      const attempt = await runAction('resume', () => services.attempt.resumeAttempt(state.attemptId!));
      if (attempt) {
        dispatch({ type: 'status-changed', routeKey, status: attempt.status });
      }
      return attempt;
    },
    refreshStats: async () => {
      if (!state.attemptId) return undefined;
      const stats = await runAction('refresh', () => services.attempt.getAttemptStats(state.attemptId!));
      if (stats) {
        dispatch({ type: 'stats-loaded', routeKey, stats });
      }
      return stats;
    },
    goToNextQuestion: () => dispatch({ type: 'next-question', routeKey }),
  }), [routeKey, runAction, services, state.attemptId]);

  return { state, actions };
};
