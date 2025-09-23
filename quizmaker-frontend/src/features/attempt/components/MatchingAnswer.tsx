// ---------------------------------------------------------------------------
// MatchingAnswer.tsx - Matching question answer component for attempts
// Based on MATCHING content from API documentation
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { QuestionForAttemptDto } from '../types/attempt.types';

interface MatchingAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer: Record<number, number> | null; // leftItemId -> rightItemId
  onAnswerChange: (answer: Record<number, number>) => void;
  disabled?: boolean;
  className?: string;
}

export const MatchingAnswer: React.FC<MatchingAnswerProps> = ({
  question,
  currentAnswer = {},
  onAnswerChange,
  disabled = false,
  className = ''
}) => {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);

  const leftItems = question.safeContent?.left || [];
  const rightItems = question.safeContent?.right || [];

  const handleLeftItemClick = (leftId: number) => {
    if (disabled) return;
    
    if (selectedLeft === leftId) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftId);
    }
  };

  const handleRightItemClick = (rightId: number) => {
    if (disabled || selectedLeft === null) return;

    // Create new answer with the match
    const newAnswer = {
      ...currentAnswer,
      [selectedLeft]: rightId
    };

    onAnswerChange(newAnswer);
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  const getMatchedRightId = (leftId: number) => {
    return currentAnswer?.[leftId] || null;
  };

  const getMatchedLeftId = (rightId: number) => {
    if (!currentAnswer) return null;
    return Object.entries(currentAnswer).find(([_, rightIdMatch]) => rightIdMatch === rightId)?.[0] || null;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm text-theme-text-secondary mb-4">
        Click an item on the left, then click its match on the right to connect them.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div>
          <h4 className="text-sm font-medium text-theme-text-secondary mb-3">Left Column</h4>
          <div className="space-y-2">
            {leftItems.map((item) => {
              const matchedRightId = getMatchedRightId(item.id);
              const isSelected = selectedLeft === item.id;
              const isMatched = matchedRightId !== null;
              
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLeftItemClick(item.id)}
                  disabled={disabled || isMatched}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    isSelected
                      ? 'border-theme-interactive-primary bg-theme-bg-tertiary text-theme-interactive-primary'
                      : isMatched
                      ? 'border-theme-interactive-success bg-theme-bg-tertiary text-theme-interactive-success'
                      : 'border-theme-border-primary bg-theme-bg-primary hover:bg-theme-bg-secondary'
                  } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{item.text}</span>
                    {isMatched && (
                      <span className="text-xs bg-theme-bg-tertiary text-theme-interactive-success px-2 py-1 rounded">
                        Matched
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-xs bg-theme-bg-tertiary text-theme-interactive-primary px-2 py-1 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div>
          <h4 className="text-sm font-medium text-theme-text-secondary mb-3">Right Column</h4>
          <div className="space-y-2">
            {rightItems.map((item) => {
              const matchedLeftId = getMatchedLeftId(item.id);
              const isMatched = matchedLeftId !== null;
              
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRightItemClick(item.id)}
                  disabled={disabled || isMatched || selectedLeft === null}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    isMatched
                      ? 'border-theme-interactive-success bg-theme-bg-tertiary text-theme-interactive-success'
                      : selectedLeft !== null
                      ? 'border-theme-border-primary bg-theme-bg-primary hover:bg-theme-bg-secondary cursor-pointer'
                      : 'border-theme-border-primary bg-theme-bg-secondary cursor-not-allowed opacity-50'
                  } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{item.text}</span>
                    {isMatched && (
                      <span className="text-xs bg-theme-bg-tertiary text-theme-interactive-success px-2 py-1 rounded">
                        Matched
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Instructions */}
      {selectedLeft !== null && (
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-3">
          <p className="text-sm text-theme-text-primary">
            Now click the matching item in the right column to connect them.
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="text-sm text-theme-text-secondary">
        {Object.keys(currentAnswer || {}).length} of {leftItems.length} matches completed
      </div>
    </div>
  );
};
