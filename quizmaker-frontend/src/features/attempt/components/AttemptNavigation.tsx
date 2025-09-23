// src/components/attempt/AttemptNavigation.tsx
// ---------------------------------------------------------------------------
// Component for navigating between questions during quiz attempts
// Provides previous/next buttons and question jumping functionality
// ---------------------------------------------------------------------------

import React from 'react';

interface AttemptNavigationProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: number[];
  onNavigateToQuestion: (questionIndex: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  attemptMode: 'ONE_BY_ONE' | 'ALL_AT_ONCE' | 'TIMED';
  className?: string;
}

const AttemptNavigation: React.FC<AttemptNavigationProps> = ({
  currentQuestionIndex,
  totalQuestions,
  answeredQuestions,
  onNavigateToQuestion,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  attemptMode,
  className = ''
}) => {
  const isQuestionAnswered = (questionIndex: number): boolean => {
    return answeredQuestions.includes(questionIndex);
  };

  const getQuestionStatus = (questionIndex: number): 'answered' | 'current' | 'unanswered' => {
    if (questionIndex === currentQuestionIndex) return 'current';
    if (isQuestionAnswered(questionIndex)) return 'answered';
    return 'unanswered';
  };

  const getQuestionButtonClass = (questionIndex: number): string => {
    const status = getQuestionStatus(questionIndex);
    const baseClass = 'w-8 h-8 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (status) {
      case 'answered':
        return `${baseClass} bg-theme-interactive-success text-theme-bg-primary hover:bg-theme-interactive-success focus:ring-theme-interactive-success`;
      case 'current':
        return `${baseClass} bg-theme-interactive-primary text-theme-bg-primary hover:bg-theme-interactive-primary focus:ring-theme-interactive-primary`;
      case 'unanswered':
        return `${baseClass} bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-bg-secondary focus:ring-theme-border-primary`;
    }
  };

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-4 ${className}`}>
      {/* Main Navigation Controls */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="px-4 py-2 bg-theme-bg-tertiary text-theme-text-secondary rounded-md hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-theme-border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        <div className="text-sm text-theme-text-secondary">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>

        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="px-4 py-2 bg-theme-interactive-primary text-theme-bg-primary rounded-md hover:bg-theme-interactive-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Question Jump Navigation (for ALL_AT_ONCE mode) */}
      {attemptMode === 'ALL_AT_ONCE' && totalQuestions > 1 && (
        <div className="border-t pt-4">
          <div className="text-sm font-medium text-theme-text-secondary mb-3">
            Jump to Question
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {Array.from({ length: totalQuestions }, (_, index) => (
              <button
                key={index}
                onClick={() => onNavigateToQuestion(index)}
                className={getQuestionButtonClass(index)}
                title={`Question ${index + 1}${isQuestionAnswered(index) ? ' (Answered)' : index === currentQuestionIndex ? ' (Current)' : ' (Unanswered)'}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress Summary */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between text-sm text-theme-text-secondary">
          <span>Answered: {answeredQuestions.length}</span>
          <span>Remaining: {totalQuestions - answeredQuestions.length}</span>
          <span>Progress: {Math.round((answeredQuestions.length / totalQuestions) * 100)}%</span>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="mt-3 text-xs text-theme-text-tertiary text-center">
        <span>Use ← → arrow keys to navigate</span>
        {attemptMode === 'ALL_AT_ONCE' && (
          <span className="ml-2">• Click question numbers to jump</span>
        )}
      </div>
    </div>
  );
};

export default AttemptNavigation; 
