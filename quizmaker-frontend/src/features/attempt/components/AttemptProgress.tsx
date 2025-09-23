// src/components/attempt/AttemptProgress.tsx
// ---------------------------------------------------------------------------
// Component for displaying quiz attempt progress
// Shows current question, total questions, and progress bar
// ---------------------------------------------------------------------------

import React from 'react';

interface AttemptProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: number;
  attemptMode: 'ONE_BY_ONE' | 'ALL_AT_ONCE' | 'TIMED';
  className?: string;
}

const AttemptProgress: React.FC<AttemptProgressProps> = ({
  currentQuestionIndex,
  totalQuestions,
  answeredQuestions,
  attemptMode,
  className = ''
}) => {
  const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  const currentQuestionNumber = currentQuestionIndex + 1;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-theme-interactive-success';
    if (percentage >= 60) return 'bg-theme-interactive-info';
    if (percentage >= 40) return 'bg-theme-interactive-warning';
    return 'bg-theme-bg-tertiary';
  };

  const getProgressText = () => {
    if (attemptMode === 'ONE_BY_ONE') {
      return `Question ${currentQuestionNumber} of ${totalQuestions}`;
    }
    return `${answeredQuestions} of ${totalQuestions} questions answered`;
  };

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-theme-text-secondary">
            {getProgressText()}
          </div>
          <div className="text-sm text-theme-text-tertiary">
            {Math.round(progressPercentage)}% complete
          </div>
        </div>
        
        {attemptMode === 'ONE_BY_ONE' && (
          <div className="text-sm font-medium text-indigo-600">
            {answeredQuestions} answered
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all duration-300 ease-in-out ${getProgressColor(progressPercentage)}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Question Navigation Dots (for ONE_BY_ONE mode) */}
      {attemptMode === 'ONE_BY_ONE' && totalQuestions > 0 && (
        <div className="flex justify-center space-x-1">
          {Array.from({ length: totalQuestions }, (_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                index < answeredQuestions
                  ? 'bg-theme-interactive-success' // Answered
                  : index === currentQuestionIndex
                  ? 'bg-theme-interactive-primary' // Current
                  : 'bg-theme-bg-tertiary' // Not reached
              }`}
              title={`Question ${index + 1}${index < answeredQuestions ? ' (Answered)' : index === currentQuestionIndex ? ' (Current)' : ''}`}
            />
          ))}
        </div>
      )}

      {/* Mode-specific status */}
      <div className="mt-3 text-xs text-theme-text-tertiary text-center">
        {attemptMode === 'ONE_BY_ONE' && 'One question at a time'}
        {attemptMode === 'ALL_AT_ONCE' && 'All questions visible'}
        {attemptMode === 'TIMED' && 'Timed attempt'}
      </div>
    </div>
  );
};

export default AttemptProgress; 
