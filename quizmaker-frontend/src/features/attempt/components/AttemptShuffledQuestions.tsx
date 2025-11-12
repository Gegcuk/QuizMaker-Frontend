// src/components/attempt/AttemptShuffledQuestions.tsx
// ---------------------------------------------------------------------------
// Component for displaying shuffled questions in quiz attempts
// Handles question ordering, navigation, and answer tracking
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { AttemptService } from '@/services';
import { QuestionForAttemptDto } from '@/types';
import { getQuestionTypeIcon } from '@/utils/questionUtils';
import { api } from '@/services';
import { HintDisplay } from './';
import { Button } from '@/components';

interface AttemptShuffledQuestionsProps {
  quizId: string;
  attemptId: string;
  onQuestionsLoaded: (questions: QuestionForAttemptDto[]) => void;
  onQuestionChange: (questionIndex: number) => void;
  currentQuestionIndex: number;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  className?: string;
}

const AttemptShuffledQuestions: React.FC<AttemptShuffledQuestionsProps> = ({
  quizId,
  attemptId,
  onQuestionsLoaded,
  onQuestionChange,
  currentQuestionIndex,
  answers,
  onAnswerChange,
  className = ''
}) => {
  const [questions, setQuestions] = useState<QuestionForAttemptDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionOrder, setQuestionOrder] = useState<number[]>([]);

  const attemptService = new AttemptService(api);

  useEffect(() => {
    loadShuffledQuestions();
  }, [quizId]);

  const loadShuffledQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const shuffledQuestions = await attemptService.getShuffledQuestions(quizId);
      setQuestions(shuffledQuestions);
      
      // Create question order array (0-based indices)
      const order = Array.from({ length: shuffledQuestions.length }, (_, i) => i);
      setQuestionOrder(order);
      
      onQuestionsLoaded(shuffledQuestions);
    } catch (err: any) {
      setError(err.message || 'Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getQuestionStatus = (questionIndex: number): 'answered' | 'current' | 'unanswered' => {
    const question = questions[questionIndex];
    if (!question) return 'unanswered';
    
    if (questionIndex === currentQuestionIndex) return 'current';
    if (answers[question.id]) return 'answered';
    return 'unanswered';
  };

  const getQuestionButtonClass = (questionIndex: number): string => {
    const status = getQuestionStatus(questionIndex);
    const baseClass = 'w-10 h-10 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (status) {
      case 'answered':
        return `${baseClass} bg-theme-bg-success text-theme-text-primary hover:bg-theme-bg-overlay focus:ring-theme-interactive-success`;
      case 'current':
        return `${baseClass} bg-theme-interactive-primary text-theme-bg-primary hover:bg-theme-interactive-primary focus:ring-theme-interactive-primary`;
      case 'unanswered':
        return `${baseClass} bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-bg-secondary focus:ring-theme-border-primary`;
    }
  };

  const handleQuestionClick = (questionIndex: number) => {
    onQuestionChange(questionIndex);
  };


  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'EASY':
        return 'text-theme-interactive-success bg-theme-bg-success';
      case 'MEDIUM':
        return 'text-theme-interactive-warning bg-theme-bg-warning';
      case 'HARD':
        return 'text-theme-interactive-danger bg-theme-bg-tertiary';
      default:
        return 'text-theme-text-secondary bg-theme-bg-tertiary';
    }
  };

  if (loading) {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-interactive-primary mx-auto mb-4" />
          <p className="text-theme-text-secondary">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-theme-interactive-danger mb-4">❌</div>
          <p className="text-theme-interactive-danger mb-4">{error}</p>
          <Button
            onClick={loadShuffledQuestions}
            variant="primary"
            size="md"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <p className="text-theme-text-secondary">No questions available for this quiz.</p>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-theme-text-primary">Questions</h3>
          <p className="text-sm text-theme-text-secondary">
            {answeredCount} of {totalQuestions} answered
          </p>
        </div>
        <div className="text-sm text-theme-text-tertiary">
          Questions are shuffled
        </div>
      </div>

      {/* Question Navigation Grid */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {questionOrder.map((questionIndex) => {
          const question = questions[questionIndex];
          if (!question) return null;

          return (
            <Button
              key={questionIndex}
              onClick={() => handleQuestionClick(questionIndex)}
              variant="ghost"
              size="sm"
              className={`!w-10 !h-10 !p-0 !rounded-full !min-w-0 ${getQuestionButtonClass(questionIndex)}`}
              title={`Question ${questionIndex + 1}: ${question.questionText.substring(0, 50)}...`}
            >
              {questionIndex + 1}
            </Button>
          );
        })}
      </div>

      {/* Current Question Info */}
      {questions[currentQuestionIndex] && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {getQuestionTypeIcon(questions[currentQuestionIndex].type)}
              </span>
              <span className="text-sm font-medium text-theme-text-primary">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(questions[currentQuestionIndex].difficulty)}`}>
              {questions[currentQuestionIndex].difficulty}
            </span>
          </div>

          <div className="text-sm text-theme-text-secondary mb-2">
            {questions[currentQuestionIndex].questionText}
          </div>

          {questions[currentQuestionIndex].hint && (
            <HintDisplay hint={questions[currentQuestionIndex].hint} />
          )}
        </div>
      )}

      {/* Progress Summary */}
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between text-xs text-theme-text-tertiary">
          <span>Progress: {Math.round((answeredCount / totalQuestions) * 100)}%</span>
          <span>Remaining: {totalQuestions - answeredCount}</span>
        </div>
        <div className="w-full bg-theme-bg-tertiary rounded-full h-1 mt-2">
          <div
            className="bg-theme-bg-success h-1 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-center space-x-4 text-xs text-theme-text-tertiary">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-theme-bg-tertiary rounded-full" />
            <span>Unanswered</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-theme-bg-primary rounded-full" />
            <span>Current</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-theme-bg-success rounded-full" />
            <span>Answered</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttemptShuffledQuestions; 
