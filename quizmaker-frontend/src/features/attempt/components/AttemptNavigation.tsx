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
        return `${baseClass} bg-green-500 text-white hover:bg-green-600 focus:ring-green-500`;
      case 'current':
        return `${baseClass} bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-500`;
      case 'unanswered':
        return `${baseClass} bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500`;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Main Navigation Controls */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        <div className="text-sm text-gray-600">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>

        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Question Jump Navigation (for ALL_AT_ONCE mode) */}
      {attemptMode === 'ALL_AT_ONCE' && totalQuestions > 1 && (
        <div className="border-t pt-4">
          <div className="text-sm font-medium text-gray-700 mb-3">
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
        <div className="flex justify-between text-sm text-gray-600">
          <span>Answered: {answeredQuestions.length}</span>
          <span>Remaining: {totalQuestions - answeredQuestions.length}</span>
          <span>Progress: {Math.round((answeredQuestions.length / totalQuestions) * 100)}%</span>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        <span>Use ← → arrow keys to navigate</span>
        {attemptMode === 'ALL_AT_ONCE' && (
          <span className="ml-2">• Click question numbers to jump</span>
        )}
      </div>
    </div>
  );
};

export default AttemptNavigation; 
