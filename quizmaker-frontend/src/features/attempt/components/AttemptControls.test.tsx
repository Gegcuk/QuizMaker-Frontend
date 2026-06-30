import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderWithProviders, screen, waitFor } from '@/test/render';
import type { AttemptDto, QuestionForAttemptDto } from '../types/attempt.types';
import { AttemptService } from '../services/attempt.service';
import AttemptNavigation from './AttemptNavigation';
import AttemptPause from './AttemptPause';
import AttemptProgress from './AttemptProgress';
import AttemptSaveProgress from './AttemptSaveProgress';
import AttemptTimer from './AttemptTimer';
import HintDisplay from './HintDisplay';
import QuestionPrompt from './QuestionPrompt';

const baseQuestion: QuestionForAttemptDto = {
  id: 'question-1',
  type: 'TRUE_FALSE',
  difficulty: 'MEDIUM',
  questionText: 'The contract is stable.',
  safeContent: {},
};

const pausedAttempt: AttemptDto = {
  attemptId: 'attempt-1',
  quizId: 'quiz-1',
  userId: 'user-1',
  startedAt: '2026-06-29T12:00:00Z',
  status: 'PAUSED',
  mode: 'ONE_BY_ONE',
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('attempt display controls', () => {
  it('reveals and hides a hint only when requested', async () => {
    const { user } = renderWithProviders(<HintDisplay hint="Read the schema." />, {
      withAuthProvider: false,
    });

    expect(screen.queryByText(/read the schema/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show Hint' }));
    expect(screen.getByText(/read the schema/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide Hint' }));
    expect(screen.queryByText(/read the schema/i)).not.toBeInTheDocument();
  });

  it('hides duplicate fill-gap prompt text and renders resolved attachments', () => {
    const { rerender } = renderWithProviders(
      <QuestionPrompt
        question={{
          ...baseQuestion,
          type: 'FILL_GAP',
          questionText: 'The {1} is hidden here.',
          attachment: {
            assetId: 'asset-1',
            cdnUrl: 'https://cdn.example.com/question.png',
          },
        }}
      />,
      { withAuthProvider: false },
    );

    expect(screen.queryByText('The {1} is hidden here.')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Question attachment' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/question.png',
    );

    rerender(<QuestionPrompt question={baseQuestion} showAttachment={false} />);
    expect(screen.getByText(baseQuestion.questionText)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('clamps progress and handles an empty quiz without invalid percentages', () => {
    const { container, rerender } = renderWithProviders(
      <AttemptProgress
        currentQuestionIndex={0}
        totalQuestions={0}
        answeredQuestions={0}
        attemptMode="ALL_AT_ONCE"
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('0 of 0 questions answered')).toBeInTheDocument();
    expect(container.querySelector('[style="width: 0%;"]')).toBeInTheDocument();

    rerender(
      <AttemptProgress
        currentQuestionIndex={1}
        totalQuestions={2}
        answeredQuestions={3}
        attemptMode="ONE_BY_ONE"
      />,
    );
    expect(container.querySelector('[style="width: 100%;"]')).toBeInTheDocument();
  });

  it('disables unavailable navigation and supports question jumping', async () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onNavigateToQuestion = vi.fn();
    const { user } = renderWithProviders(
      <AttemptNavigation
        currentQuestionIndex={1}
        totalQuestions={3}
        answeredQuestions={[0]}
        onNavigateToQuestion={onNavigateToQuestion}
        onPrevious={onPrevious}
        onNext={onNext}
        canGoPrevious={false}
        canGoNext
        attemptMode="ALL_AT_ONCE"
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByText('Progress: 33%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByTitle('Question 3 (Unanswered)'));

    expect(onPrevious).not.toHaveBeenCalled();
    expect(onNext).toHaveBeenCalledOnce();
    expect(onNavigateToQuestion).toHaveBeenCalledWith(2);
  });
});

describe('AttemptTimer', () => {
  it('calls the warning and completion callbacks when time expires', () => {
    vi.useFakeTimers();
    const onWarning = vi.fn();
    const onTimeUp = vi.fn();

    renderWithProviders(
      <AttemptTimer
        durationMinutes={1 / 60}
        onWarning={onWarning}
        onTimeUp={onTimeUp}
      />,
      { withAuthProvider: false },
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(onWarning).toHaveBeenCalledWith(0);
    expect(onTimeUp).toHaveBeenCalledOnce();
  });

  it('does not count down while paused', () => {
    vi.useFakeTimers();
    const onTimeUp = vi.fn();

    renderWithProviders(
      <AttemptTimer durationMinutes={1} onTimeUp={onTimeUp} isPaused />,
      { withAuthProvider: false },
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(screen.getByText('Timer paused')).toBeInTheDocument();
    expect(onTimeUp).not.toHaveBeenCalled();
  });
});

describe('attempt persistence controls', () => {
  it('pauses an active attempt after confirmation', async () => {
    const pauseAttempt = vi
      .spyOn(AttemptService.prototype, 'pauseAttempt')
      .mockResolvedValue(pausedAttempt);
    const onStatusChange = vi.fn();
    const onPause = vi.fn();
    const { user } = renderWithProviders(
      <AttemptPause
        attemptId="attempt-1"
        currentStatus="IN_PROGRESS"
        onStatusChange={onStatusChange}
        onPause={onPause}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /pause/i }));
    await user.click(screen.getByRole('button', { name: 'Pause' }));

    await waitFor(() => expect(pauseAttempt).toHaveBeenCalledWith('attempt-1'));
    expect(onStatusChange).toHaveBeenCalledWith('PAUSED');
    expect(onPause).toHaveBeenCalledOnce();
  });

  it('submits current answers as a batch save payload', async () => {
    const submitBatchAnswers = vi
      .spyOn(AttemptService.prototype, 'submitBatchAnswers')
      .mockResolvedValue([]);
    const onSaveSuccess = vi.fn();
    const { user } = renderWithProviders(
      <AttemptSaveProgress
        attemptId="attempt-1"
        answers={{ 'question-1': { answer: true } }}
        autoSaveInterval={0}
        onSaveSuccess={onSaveSuccess}
      />,
      { withAuthProvider: false },
    );

    await waitFor(() => {
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Save Now' }));

    await waitFor(() => {
      expect(submitBatchAnswers).toHaveBeenCalledWith('attempt-1', {
        answers: [
          {
            questionId: 'question-1',
            response: { answer: true },
          },
        ],
      });
    });
    expect(onSaveSuccess).toHaveBeenCalledOnce();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });
});
