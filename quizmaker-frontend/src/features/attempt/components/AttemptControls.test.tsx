import React, { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderWithProviders, screen, waitFor } from '@/test/render';
import type { QuestionForAttemptDto } from '../types/attempt.types';
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
    const progress = screen.getByRole('progressbar', { name: 'Quiz progress' });
    expect(progress).toHaveAttribute('aria-valuenow', '0');
    expect(progress).toHaveAttribute('aria-valuetext', '0 of 0 questions answered');
    expect(container.querySelector('[style="width: 0%;"]')).toBeInTheDocument();

    rerender(
      <AttemptProgress
        currentQuestionIndex={1}
        totalQuestions={2}
        answeredQuestions={3}
        attemptMode="ONE_BY_ONE"
      />,
    );
    expect(progress).toHaveAttribute('aria-valuenow', '100');
    expect(progress).toHaveAttribute('aria-valuetext', 'Question 2 of 2');
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
      <StrictMode>
        <AttemptTimer
          durationMinutes={1 / 60}
          onWarning={onWarning}
          onTimeUp={onTimeUp}
        />
      </StrictMode>,
      { withAuthProvider: false },
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByRole('timer', { name: 'Time remaining' })).toHaveAttribute('aria-live', 'off');
    expect(screen.getByRole('alert')).toHaveTextContent('Time is up.');
    expect(onWarning).toHaveBeenCalledWith(1);
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

  it('announces only meaningful warning thresholds while the timer counts down', () => {
    vi.useFakeTimers();

    renderWithProviders(
      <AttemptTimer durationMinutes={6} onTimeUp={vi.fn()} />,
      { withAuthProvider: false },
    );

    const timer = screen.getByRole('timer', { name: 'Time remaining' });
    expect(timer).toHaveAttribute('aria-live', 'off');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByRole('status')).toHaveTextContent('Less than 5 minutes remaining');

    act(() => vi.advanceTimersByTime(240_000));
    expect(screen.getByRole('alert')).toHaveTextContent('Less than 1 minute remaining');
  });
});

describe('attempt persistence controls', () => {
  it('pauses an active attempt after confirmation', async () => {
    const onPause = vi.fn().mockResolvedValue(true);
    const onResume = vi.fn().mockResolvedValue(true);
    const { user } = renderWithProviders(
      <AttemptPause
        currentStatus="IN_PROGRESS"
        onPause={onPause}
        onResume={onResume}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /pause/i }));
    await user.click(screen.getByRole('button', { name: 'Pause' }));

    await waitFor(() => expect(onPause).toHaveBeenCalledOnce());
    expect(onResume).not.toHaveBeenCalled();
  });

  it('keeps the pause confirmation available after an action failure', async () => {
    const onPause = vi
      .fn()
      .mockRejectedValueOnce(new Error('Pause unavailable'))
      .mockResolvedValueOnce(true);
    const { user } = renderWithProviders(
      <AttemptPause
        currentStatus="IN_PROGRESS"
        onPause={onPause}
        onResume={vi.fn().mockResolvedValue(true)}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /pause/i }));
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(await screen.findByText('Pause unavailable')).toBeInTheDocument();
    expect(screen.getByText('Pause Attempt?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pause' }));
    await waitFor(() => expect(screen.queryByText('Pause Attempt?')).not.toBeInTheDocument());
    expect(onPause).toHaveBeenCalledTimes(2);
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
