// ---------------------------------------------------------------------------
// MatchingAnswer.tsx - Matching question answer component for attempts
// Based on MATCHING content from API documentation
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { QuestionForAttemptDto } from '../types/attempt.types';

interface MatchingAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer: { matches: Array<{ leftId: number; rightId: number }> } | null;
  onAnswerChange: (answer: { matches: Array<{ leftId: number; rightId: number }> }) => void;
  disabled?: boolean;
  className?: string;
}

export const MatchingAnswer: React.FC<MatchingAnswerProps> = ({
  question,
  currentAnswer = { matches: [] },
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
    
    const matchedRightId = getMatchedRightId(leftId);
    
    if (matchedRightId) {
      // If this left item is already matched, remove the match
      const newMatches = currentAnswer?.matches?.filter(m => m.leftId !== leftId) || [];
      const newAnswer = { matches: newMatches };
      console.log('MatchingAnswer: Unmatching left item', { leftId, matchedRightId, newAnswer });
      onAnswerChange(newAnswer);
      setSelectedLeft(null);
    } else if (selectedLeft === leftId) {
      // If this is the currently selected left item, deselect it
      setSelectedLeft(null);
    } else {
      // Select this left item
      setSelectedLeft(leftId);
    }
  };

  const handleRightItemClick = (rightId: number) => {
    if (disabled) return;

    const matchedLeftId = getMatchedLeftId(rightId);
    
    if (matchedLeftId) {
      // If this right item is already matched, remove the match
      const newMatches = currentAnswer?.matches?.filter(m => m.rightId !== rightId) || [];
      const newAnswer = { matches: newMatches };
      console.log('MatchingAnswer: Unmatching right item', { rightId, matchedLeftId, newAnswer });
      onAnswerChange(newAnswer);
      setSelectedLeft(null);
    } else if (selectedLeft === null) {
      // If no left item is selected, don't do anything
      return;
    } else {
      // Create new answer with the match
      const newMatches = [
        ...(currentAnswer?.matches?.filter(m => m.leftId !== selectedLeft) || []),
        { leftId: selectedLeft, rightId: rightId }
      ];
      const newAnswer = { matches: newMatches };
      console.log('MatchingAnswer: Creating new match', { selectedLeft, rightId, newAnswer });
      onAnswerChange(newAnswer);
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  const getMatchedRightId = (leftId: number) => {
    if (!currentAnswer?.matches) return null;
    const match = currentAnswer.matches.find(m => m.leftId === leftId);
    return match?.rightId || null;
  };

  const getMatchedLeftId = (rightId: number) => {
    if (!currentAnswer?.matches) return null;
    const match = currentAnswer.matches.find(m => m.rightId === rightId);
    return match?.leftId || null;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm text-theme-text-secondary mb-4">
        Click an item on the left, then click its match on the right to connect them. Click on matched items to uncheck them.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div>
          <h4 className="text-sm font-medium text-theme-text-secondary mb-3">Left Column</h4>
          <div className="space-y-2">
            {leftItems.map((item: any) => {
              const matchedRightId = getMatchedRightId(item.id);
              const isSelected = selectedLeft === item.id;
              const isMatched = matchedRightId !== null;
              
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLeftItemClick(item.id)}
                  disabled={disabled}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    isSelected
                      ? 'border-theme-interactive-primary bg-theme-bg-tertiary text-theme-interactive-primary'
                      : isMatched
                      ? 'border-theme-interactive-primary bg-theme-bg-tertiary text-theme-interactive-primary'
                      : 'border-theme-border-primary bg-theme-bg-primary hover:bg-theme-bg-secondary'
                  } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{item.text}</span>
                    {isMatched && (
                      <span className="text-xs bg-theme-bg-tertiary text-theme-interactive-primary px-2 py-1 rounded">
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
            {rightItems.map((item: any) => {
              const matchedLeftId = getMatchedLeftId(item.id);
              const isMatched = matchedLeftId !== null;
              
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRightItemClick(item.id)}
                  disabled={disabled}
                  className={`w-full p-3 text-left border rounded-lg transition-colors ${
                    isMatched
                      ? 'border-theme-interactive-primary bg-theme-bg-tertiary text-theme-interactive-primary'
                      : selectedLeft !== null
                      ? 'border-theme-border-primary bg-theme-bg-primary hover:bg-theme-bg-secondary cursor-pointer'
                      : 'border-theme-border-primary bg-theme-bg-secondary cursor-not-allowed opacity-50'
                  } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{item.text}</span>
                    {isMatched && (
                      <span className="text-xs bg-theme-bg-tertiary text-theme-interactive-primary px-2 py-1 rounded">
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
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-md p-3">
          <p className="text-sm text-theme-text-primary">
            Now click the matching item in the right column to connect them, or click the selected item again to cancel.
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="text-sm text-theme-text-secondary">
        {currentAnswer?.matches?.length || 0} of {leftItems.length} matches completed
      </div>
    </div>
  );
};
