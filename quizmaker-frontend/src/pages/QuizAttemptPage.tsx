// src/pages/QuizAttemptPage.tsx
// ---------------------------------------------------------------------------
// Quiz attempt page - handles different attempt modes and paused attempts
// Supports ONE_BY_ONE, ALL_AT_ONCE, and TIMED modes
// ---------------------------------------------------------------------------

import React, { useCallback, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import type { AnswerSubmissionRequest, QuestionForAttemptDto } from '@/types';
import { Spinner, Button } from "@/components";
import { 
  McqAnswer, 
  TrueFalseAnswer, 
  OpenAnswer, 
  FillGapAnswer, 
  ComplianceAnswer, 
  OrderingAnswer, 
  HotspotAnswer,
  MatchingAnswer,
  AttemptPause,
  AttemptBatchAnswers,
  AttemptTimer,
  QuestionPrompt,
  HintDisplay,
  useAttemptSessionController,
} from '@/features/attempt';
import { Seo } from '@/features/seo';
import SafeContent from '@/components/common/SafeContent';
import {
  buildQuestionResponse,
  isQuestionAnswerProvided,
  type AnswerInput,
} from '@/features/attempt/utils/answerResponse';

const QuizAttemptPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, actions } = useAttemptSessionController({
    quizId,
    requestedAttemptId: searchParams.get('attemptId'),
    requestedMode: searchParams.get('mode'),
  });
  const {
    phase,
    initializationError,
    actionError,
    activeAction,
    attemptId,
    attemptMode,
    attemptStatus,
    quiz,
    currentQuestion,
    allQuestions,
    answers,
    existingAnswers,
    answerInput,
    answerResult,
    totalQuestions,
    questionsAnswered,
    currentQuestionNumber,
  } = state;
  const submitting = activeAction === 'submit-answer' || activeAction === 'complete';
  const completingAttempt = activeAction === 'complete';

  const isAnswerProvided = () => {
    if (!currentQuestion) return false;
    return isQuestionAnswerProvided(currentQuestion, answerInput);
  };

  /* -------------------------------------------------------------------- */
  /*  Submit current answer (ONE_BY_ONE mode)                             */
  /* -------------------------------------------------------------------- */
  const handleSubmitAnswer = useCallback(async () => {
    if (!attemptId || !currentQuestion) return;

    const response = buildQuestionResponse(currentQuestion, answerInput);

    const payload: AnswerSubmissionRequest = {
      questionId: currentQuestion.id,
      response,
      includeCorrectness: true,  // Always include correctness to show result
      includeCorrectAnswer: true, // Always include correct answer to show if incorrect
      includeExplanation: true,   // Always include explanation to display after submission
    };

    try {
      await actions.submitAnswer(payload, response);
    } catch {
      // The controller keeps the question visible and exposes a retryable action error.
    }
  }, [actions, answerInput, attemptId, currentQuestion]);

  /* -------------------------------------------------------------------- */
  /*  Handle proceeding to next question after viewing result             */
  /* -------------------------------------------------------------------- */
  const handleNextQuestion = async () => {
    if (!attemptId || !answerResult || !quizId) return;

    // Check if there's a next question from the stored result
    if (answerResult.nextQuestion) {
      actions.goToNextQuestion();
    } else {
      try {
        const completed = await actions.completeAttempt();
        if (!completed) return;
        navigate(`/quizzes/${quizId}/results?attemptId=${attemptId}`);
      } catch {
        // Completion can be retried without losing the submitted answer.
      }
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Submit all answers (ALL_AT_ONCE mode)                               */
  /* -------------------------------------------------------------------- */
  const handleSubmitAllAnswers = async () => {
    if (!attemptId || !quizId) return;
    try {
      const completed = await actions.completeAttempt();
      if (!completed) return;
      navigate(`/quizzes/${quizId}/results?attemptId=${attemptId}`);
    } catch {
      // The controller exposes the completion error beside the loaded attempt.
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Handle answer changes (ALL_AT_ONCE mode)                            */
  /* -------------------------------------------------------------------- */
  const handleAnswerChange = (questionId: string, answer: AnswerInput) => {
    actions.setAnswer(questionId, answer);
  };

  const buildAllAnswersForSubmission = () => {
    return allQuestions.reduce<Record<string, unknown>>((acc, question) => {
      const answer = answers[question.id];

      if (isQuestionAnswerProvided(question, answer)) {
        acc[question.id] = buildQuestionResponse(question, answer);
      }

      return acc;
    }, {});
  };

  const getAnsweredQuestionCount = () => {
    return allQuestions.filter((question) =>
      isQuestionAnswerProvided(question, answers[question.id])
    ).length;
  };

  /* -------------------------------------------------------------------- */
  /*  Handle pause/resume                                                  */
  /* -------------------------------------------------------------------- */
  const handlePause = async () => {
    return Boolean(await actions.pauseAttempt());
  };

  const handleResume = async () => {
    const resumed = await actions.resumeAttempt();
    if (!resumed) return false;
    void actions.refreshStats().catch(() => undefined);
    return true;
  };

  const handleTimeUp = useCallback(() => {
    void handleSubmitAnswer();
  }, [handleSubmitAnswer]);

  // Scroll to top when a new question is loaded
  useEffect(() => {
    if (currentQuestion) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentQuestion]);

  /* -------------------------------------------------------------------- */
  /*  Rendering helpers                                                   */
  /* -------------------------------------------------------------------- */
  
  const renderQuestion = (question: QuestionForAttemptDto, isCurrent: boolean = false) => {
    // For ONE_BY_ONE and TIMED modes, use answerInput; for ALL_AT_ONCE mode, use answers state
    let currentAnswer: AnswerInput;
    let onAnswerChange: (answer: AnswerInput) => void;
    
    if (attemptMode === 'ALL_AT_ONCE') {
      // For ALL_AT_ONCE mode, use answers state
      currentAnswer = answers[question.id];
      if (currentAnswer === null || currentAnswer === undefined) {
        // Set appropriate default based on question type
        switch (question.type) {
          case "MCQ_SINGLE":
          case "MCQ_MULTI":
          case "OPEN":
          case "COMPLIANCE":
            currentAnswer = '';
            break;
          case "FILL_GAP":
            currentAnswer = {};
            break;
          case "TRUE_FALSE":
          case "HOTSPOT":
            currentAnswer = null;
            break;
          case "ORDERING":
            currentAnswer = [];
            break;
          default:
            currentAnswer = '';
        }
      }
      onAnswerChange = (answer: AnswerInput) => handleAnswerChange(question.id, answer);
    } else {
      // For ONE_BY_ONE and TIMED modes, use answerInput
      currentAnswer = answerInput;
      onAnswerChange = (answer: AnswerInput) => actions.setAnswerInput(answer);
    }
    
    // Disable input if submitted (show feedback mode)
    const isDisabled = submitting || !isCurrent || answerResult !== null;
    
    // Determine if we should show feedback (answer was submitted for this question)
    const showFeedback = answerResult !== null && answerResult.userAnswer !== undefined;

    switch (question.type) {
      case "MCQ_SINGLE":
        return (
          <McqAnswer
            question={question}
            currentAnswer={currentAnswer as React.ComponentProps<typeof McqAnswer>['currentAnswer']}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            singleChoice={true}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "MCQ_MULTI":
        return (
          <McqAnswer
            question={question}
            currentAnswer={currentAnswer as React.ComponentProps<typeof McqAnswer>['currentAnswer']}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            singleChoice={false}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "TRUE_FALSE":
        return (
          <TrueFalseAnswer
            question={question}
            currentAnswer={currentAnswer as React.ComponentProps<typeof TrueFalseAnswer>['currentAnswer']}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "OPEN":
        return (
          <OpenAnswer
            question={question}
            currentAnswer={currentAnswer as React.ComponentProps<typeof OpenAnswer>['currentAnswer']}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "COMPLIANCE":
        return (
          <ComplianceAnswer
            question={question}
            currentAnswer={currentAnswer as React.ComponentProps<typeof ComplianceAnswer>['currentAnswer']}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "FILL_GAP":
        return (
          <FillGapAnswer
            question={question}
            currentAnswer={currentAnswer as React.ComponentProps<typeof FillGapAnswer>['currentAnswer']}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "HOTSPOT":
        return (
          <HotspotAnswer
            question={question}
            currentAnswer={currentAnswer as React.ComponentProps<typeof HotspotAnswer>['currentAnswer']}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "ORDERING":
        return (
          <OrderingAnswer
            question={question}
            currentAnswer={currentAnswer as React.ComponentProps<typeof OrderingAnswer>['currentAnswer']}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "MATCHING":
        return (
          <MatchingAnswer
            question={question}
            currentAnswer={currentAnswer as React.ComponentProps<typeof MatchingAnswer>['currentAnswer']}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      default:
        return <p>Unsupported question type: {question.type}</p>;
    }
  };

  const renderONE_BY_ONE_Mode = () => {
    if (!currentQuestion) return <p>No question available.</p>;

    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Progress Indicator */}
        <div className="mb-6 p-4 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
          <div className="mb-2">
            <div className="text-sm font-medium text-theme-text-primary">
              Question {currentQuestionNumber} of {totalQuestions || '?'}
            </div>
          </div>
          
          <div className="w-full bg-theme-bg-secondary rounded-full h-2">
            <div 
              className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${totalQuestions > 0 ? (questionsAnswered / totalQuestions) * 100 : 0}%` 
              }}
            />
          </div>
        </div>

        <QuestionPrompt question={currentQuestion} className="mb-4" />

        {/* Question Options */}
        <div className="space-y-2 mb-6">
          {renderQuestion(currentQuestion, true)}
        </div>

        {/* Explanation (shown when answer result is available) */}
        {answerResult && answerResult.explanation && (
          <div className="mt-4 p-4 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-theme-interactive-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-theme-text-primary mb-1">Explanation</p>
                <SafeContent 
                  content={answerResult.explanation} 
                  allowHtml={true}
                  className="text-sm text-theme-text-secondary prose prose-sm max-w-none"
                />
              </div>
            </div>
          </div>
        )}

        {currentQuestion.hint && (
          <div className="mt-4">
            <HintDisplay hint={currentQuestion.hint} />
          </div>
        )}

        <Button
          onClick={answerResult ? handleNextQuestion : handleSubmitAnswer}
          disabled={answerResult ? completingAttempt : (submitting || !isAnswerProvided())}
          loading={answerResult ? completingAttempt : submitting}
          variant="primary"
          size="md"
          className="mt-4 w-full"
        >
          {answerResult 
            ? (completingAttempt
              ? 'Completing...'
              : (answerResult.nextQuestion ? "Next Question →" : "View Results"))
            : (submitting ? "Submitting..." : "Submit Answer")
          }
        </Button>
      </div>
    );
  };

  const renderALL_AT_ONCE_Mode = () => {
    const answeredQuestionCount = getAnsweredQuestionCount();
    const submissionAnswers = buildAllAnswersForSubmission();

    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Progress and Timer */}
        <div className="mb-6 p-4 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-theme-text-primary">
              All Questions Mode
            </div>
            <div className="text-sm text-theme-text-secondary">
              {answeredQuestionCount} of {totalQuestions} answered
            </div>
          </div>
          
          <div className="w-full bg-theme-bg-secondary rounded-full h-2 mb-2">
            <div 
              className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${totalQuestions > 0 ? (answeredQuestionCount / totalQuestions) * 100 : 0}%`
              }}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {allQuestions.map((question, index) => (
            <div key={question.id} className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-medium text-theme-text-primary">
                  Question {index + 1}
                </h3>
                {isQuestionAnswerProvided(question, answers[question.id]) && (
                  <span className="text-sm text-theme-interactive-success bg-theme-bg-success px-2 py-1 rounded">
                    ✓ Answered
                  </span>
                )}
              </div>
              
              <QuestionPrompt
                question={question}
                questionTextClassName="text-theme-text-secondary"
                className="mb-4"
              />

              {renderQuestion(question, true)}

              {question.hint && (
                <div className="mt-4">
                  <HintDisplay hint={question.hint} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit All Button */}
        <div className="mt-8">
          <AttemptBatchAnswers
            answers={submissionAnswers}
            totalQuestions={totalQuestions}
            existingAnswers={existingAnswers}
            onSubmit={actions.submitBatchAnswers}
            onSubmissionComplete={handleSubmitAllAnswers}
          />
        </div>
      </div>
    );
  };

  const renderTIMED_Mode = () => {
    if (!currentQuestion) return <p>No question available.</p>;

    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Timer and Progress */}
        <div className="mb-6 p-4 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
          <div className="mb-2">
            <div className="text-sm font-medium text-theme-text-primary">
              Question {currentQuestionNumber} of {totalQuestions || '?'}
            </div>
          </div>
          
          {quiz?.timerDuration && (
            <AttemptTimer
              durationMinutes={quiz.timerDuration}
              onTimeUp={handleTimeUp}
            />
          )}
          
          <div className="w-full bg-theme-bg-secondary rounded-full h-2">
            <div 
              className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${totalQuestions > 0 ? (questionsAnswered / totalQuestions) * 100 : 0}%` 
              }}
            />
          </div>
        </div>

        <QuestionPrompt question={currentQuestion} className="mb-4" />

        {/* Render the current question */}
        {renderQuestion(currentQuestion, true)}

        {currentQuestion.hint && (
          <div className="mt-4">
            <HintDisplay hint={currentQuestion.hint} />
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={handleSubmitAnswer}
            disabled={submitting || !isAnswerProvided()}
            loading={submitting}
            variant="primary"
            size="lg"
          >
            {submitting ? 'Submitting...' : 'Submit Answer'}
          </Button>
        </div>
      </div>
    );
  };

  /* -------------------------------------------------------------------- */
  /*  Main Render                                                         */
  /* -------------------------------------------------------------------- */
  if (phase === 'loading') return <Spinner />;
  if (phase === 'initialization-error') {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 text-center">
        <p role="alert" className="text-theme-interactive-danger">
          {initializationError || 'Failed to initialize attempt.'}
        </p>
        <Button className="mt-4" onClick={actions.retryInitialization}>
          Retry
        </Button>
      </div>
    );
  }
  if (!attemptId) return <p className="text-center py-10">Failed to initialize attempt.</p>;

  return (
    <>
      <Seo title={quiz ? `Taking Quiz: ${quiz.title} | Quizzence` : 'Quiz Attempt | Quizzence'} noindex />
      <div className="min-h-screen bg-theme-bg-secondary">
        {/* Pause/Resume Controls */}
      {attemptId && (quiz?.timerEnabled || attemptMode === 'TIMED') && (
        <div className="max-w-4xl mx-auto pt-4 px-4">
          <AttemptPause
            currentStatus={attemptStatus}
            onPause={handlePause}
            onResume={handleResume}
            disabled={activeAction !== null}
            className="mb-4"
          />
        </div>
      )}

      {/* Error Display */}
      {actionError && (
        <div className="max-w-4xl mx-auto px-4 mb-4">
          <div role="alert" className="bg-theme-bg-danger border border-theme-border-danger rounded-lg p-4">
            <p className="text-theme-interactive-danger">{actionError}</p>
          </div>
        </div>
      )}

      {/* Mode-specific rendering */}
      {attemptMode === 'ONE_BY_ONE' && renderONE_BY_ONE_Mode()}
      {attemptMode === 'ALL_AT_ONCE' && renderALL_AT_ONCE_Mode()}
      {attemptMode === 'TIMED' && renderTIMED_Mode()}
      </div>
    </>
  );
};

export default QuizAttemptPage;
