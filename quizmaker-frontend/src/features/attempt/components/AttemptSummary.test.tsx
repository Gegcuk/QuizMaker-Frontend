import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearTestAuthTokens,
  renderWithProviders,
  screen,
  setTestAuthTokens,
  waitFor,
} from '@/test/render';
import api from '@/api/axiosInstance';
import type { UserDto } from '@/features/auth/types/auth.types';
import type { QuizDto } from '@/features/quiz/types/quiz.types';
import { QuizService } from '@/features/quiz/services/quiz.service';
import type {
  AnswerSubmissionDto,
  AttemptDetailsDto,
  AttemptDto,
  AttemptStatsDto,
  CurrentQuestionDto,
  Page,
  QuestionForAttemptDto,
  QuestionTimingStatsDto,
} from '../types/attempt.types';
import { AttemptService } from '../services/attempt.service';
import AnswerReview from './AnswerReview';
import AttemptCard, { type AttemptWithDetails } from './AttemptCard';
import AttemptDetails from './AttemptDetails';
import AttemptStats from './AttemptStats';
import QuestionTiming from './QuestionTiming';
import UserAttempts from './UserAttempts';

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
  questionText: 'Architecture decisions should be documented.',
  safeContent: {},
  hint: 'Consider long-term maintenance.',
};

const answers: AnswerSubmissionDto[] = [
  {
    answerId: 'answer-1',
    questionId: 'question-1',
    isCorrect: true,
    score: 1,
    answeredAt: '2026-06-29T12:01:00Z',
  },
  {
    answerId: 'answer-2',
    questionId: 'question-2',
    isCorrect: false,
    score: 0,
    answeredAt: '2026-06-29T12:02:30Z',
  },
];

const timing: QuestionTimingStatsDto = {
  questionId: 'question-1',
  questionType: 'TRUE_FALSE',
  difficulty: 'MEDIUM',
  timeSpent: 'PT1M30S',
  isCorrect: true,
  questionStartedAt: '2026-06-29T12:00:00Z',
  answeredAt: '2026-06-29T12:01:30Z',
};

const stats: AttemptStatsDto = {
  attemptId: 'attempt-1',
  totalTime: 'PT2M30S',
  averageTimePerQuestion: 'PT1M15S',
  questionsAnswered: 2,
  correctAnswers: 1,
  accuracyPercentage: 50,
  completionPercentage: 100,
  questionTimings: [timing],
  startedAt: '2026-06-29T12:00:00Z',
  completedAt: '2026-06-29T12:02:30Z',
};

const attempt: AttemptDto = {
  attemptId: 'attempt-1',
  quizId: 'quiz-1',
  userId: 'user-1',
  startedAt: '2026-06-29T12:00:00Z',
  status: 'PAUSED',
  mode: 'ONE_BY_ONE',
};

const pageWith = (content: AttemptDto[]): Page<AttemptDto> => ({
  content,
  pageable: {
    sort: { sorted: false, unsorted: true, empty: true },
    pageNumber: 0,
    pageSize: 50,
    offset: 0,
    paged: true,
    unpaged: false,
  },
  totalPages: 1,
  totalElements: content.length,
  last: true,
  size: 50,
  number: 0,
  sort: { sorted: false, unsorted: true, empty: true },
  numberOfElements: content.length,
  first: true,
  empty: content.length === 0,
});

afterEach(() => {
  clearTestAuthTokens();
  vi.restoreAllMocks();
});

describe('attempt summary components', () => {
  it('renders AttemptCard details, clamps progress, and dispatches actions', async () => {
    const onResume = vi.fn();
    const onDelete = vi.fn();
    const cardAttempt: AttemptWithDetails = {
      ...attempt,
      quiz,
      stats: { ...stats, completionPercentage: 125 },
      currentQuestion: {
        question,
        questionNumber: 2,
        totalQuestions: 4,
        attemptStatus: 'PAUSED',
      },
    };
    const { container, user } = renderWithProviders(
      <AttemptCard attempt={cardAttempt} onResume={onResume} onDelete={onDelete} />,
      { withAuthProvider: false },
    );

    expect(screen.getAllByText('Architecture Quiz')).not.toHaveLength(0);
    expect(container.querySelector('[style="width: 125%;"]')).not.toBeInTheDocument();
    expect(container.querySelectorAll('[style="width: 100%;"]')).toHaveLength(2);

    await user.click(screen.getAllByRole('button', { name: 'Resume' })[0]);
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(onResume).toHaveBeenCalledWith(cardAttempt);
    expect(onDelete).toHaveBeenCalledWith(cardAttempt);
  });

  it('calculates AttemptDetails performance and elapsed time', () => {
    const details: AttemptDetailsDto = {
      ...attempt,
      completedAt: '2026-06-29T12:02:30Z',
      status: 'COMPLETED',
      answers,
    };

    renderWithProviders(<AttemptDetails details={details} />, {
      withAuthProvider: false,
    });

    expect(screen.getByRole('heading', { name: 'Attempt Details' })).toBeInTheDocument();
    expect(screen.getAllByText('2m 30s')).not.toHaveLength(0);
    expect(screen.getAllByText('50%')).not.toHaveLength(0);
    expect(screen.getByText('Performance by Time of Day')).toBeInTheDocument();
  });

  it('renders AttemptStats without invalid widths for empty or out-of-range data', () => {
    const { container } = renderWithProviders(
      <AttemptStats
        stats={{
          ...stats,
          questionsAnswered: 0,
          correctAnswers: 0,
          accuracyPercentage: 125,
          completionPercentage: -5,
          questionTimings: [],
        }}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Attempt Statistics' })).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(container.querySelector('[style="width: 125%;"]')).not.toBeInTheDocument();
    expect(container.querySelectorAll('[style="width: 0%;"]')).not.toHaveLength(0);
  });

  it('renders zero-value QuestionTiming summaries for an empty attempt', () => {
    const { container } = renderWithProviders(<QuestionTiming timings={[]} />, {
      withAuthProvider: false,
    });

    expect(screen.getByRole('heading', { name: 'Question Timing Analysis' })).toBeInTheDocument();
    expect(screen.getAllByText('0s').length).toBeGreaterThanOrEqual(3);
    expect(container.textContent).not.toMatch(/NaN|Infinity/);
  });

  it('expands AnswerReview feedback and invokes its back action', async () => {
    const onBack = vi.fn();
    const { user } = renderWithProviders(
      <AnswerReview answers={[answers[1]]} questions={[{ ...question, id: 'question-2' }]} onBack={onBack} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '▶' }));
    expect(screen.getByText('Answer Details:')).toBeInTheDocument();
    expect(screen.getByText(/this answer was incorrect/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});

describe('UserAttempts', () => {
  it('loads resumable attempts for the authenticated user', async () => {
    const user: UserDto = {
      id: 'user-1',
      username: 'architect',
      email: 'architect@example.com',
      isActive: true,
      roles: ['ROLE_USER'],
      createdAt: '2026-06-29T12:00:00Z',
      updatedAt: '2026-06-29T12:00:00Z',
    };
    setTestAuthTokens();
    vi.spyOn(api, 'get').mockResolvedValue({ data: user });
    const getAttempts = vi
      .spyOn(AttemptService.prototype, 'getAttempts')
      .mockResolvedValue(pageWith([attempt]));
    vi.spyOn(AttemptService.prototype, 'getAttemptStats').mockResolvedValue(stats);
    const currentQuestion: CurrentQuestionDto = {
      question,
      questionNumber: 1,
      totalQuestions: 2,
      attemptStatus: 'PAUSED',
    };
    vi.spyOn(AttemptService.prototype, 'getCurrentQuestion').mockResolvedValue(currentQuestion);
    vi.spyOn(QuizService.prototype, 'getQuizById').mockResolvedValue(quiz);
    const onAttemptsLoaded = vi.fn();

    renderWithProviders(<UserAttempts onAttemptsLoaded={onAttemptsLoaded} />);

    expect(await screen.findByRole('heading', { name: 'Active Attempts' })).toBeInTheDocument();
    expect(getAttempts).toHaveBeenCalledWith({ userId: 'user-1', page: 0, size: 50 });
    await waitFor(() => expect(onAttemptsLoaded).toHaveBeenCalledWith(true));
  });

  it('finishes loading cleanly when no user is authenticated', async () => {
    const onAttemptsLoaded = vi.fn();
    renderWithProviders(
      <UserAttempts onAttemptsLoaded={onAttemptsLoaded} />,
    );

    await waitFor(() => expect(onAttemptsLoaded).toHaveBeenCalledWith(false));
    expect(screen.queryByRole('heading', { name: 'Active Attempts' })).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
