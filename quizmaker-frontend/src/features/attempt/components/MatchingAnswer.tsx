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
  showFeedback?: boolean;
  isCorrect?: boolean;
  correctAnswer?: any;
}

export const MatchingAnswer: React.FC<MatchingAnswerProps> = ({
  question,
  currentAnswer = { matches: [] },
  onAnswerChange,
  disabled = false,
  className = '',
  showFeedback = false,
  isCorrect,
  correctAnswer
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

  const isMatchCorrect = (leftId: number, rightId: number): boolean => {
    if (!showFeedback || !correctAnswer || !Array.isArray(correctAnswer.pairs)) return false;
    return correctAnswer.pairs.some((pair: any) => pair.leftId === leftId && pair.rightId === rightId);
  };

  const getCorrectRightId = (leftId: number): number | null => {
    if (!showFeedback || !correctAnswer || !Array.isArray(correctAnswer.pairs)) return null;
    const correctPair = correctAnswer.pairs.find((pair: any) => pair.leftId === leftId);
    return correctPair?.rightId || null;
  };

  const getCorrectLeftId = (rightId: number): number | null => {
    if (!showFeedback || !correctAnswer || !Array.isArray(correctAnswer.pairs)) return null;
    const correctPair = correctAnswer.pairs.find((pair: any) => pair.rightId === rightId);
    return correctPair?.leftId || null;
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
              const matchIsCorrect = isMatched && matchedRightId !== null ? isMatchCorrect(item.id, matchedRightId) : false;
              const correctRightId = getCorrectRightId(item.id);
              
              // Get styling based on feedback
              let borderColor = 'border-theme-border-primary';
              let bgColor = 'bg-theme-bg-primary';
              if (showFeedback && isCorrect !== undefined) {
                if (matchIsCorrect) {
                  borderColor = 'border-theme-interactive-success';
                  bgColor = 'bg-theme-bg-success';
                } else if (isMatched && !matchIsCorrect) {
                  borderColor = 'border-theme-interactive-danger';
                  bgColor = 'bg-theme-bg-danger';
                } else if (!isCorrect && correctRightId !== null) {
                  borderColor = 'border-theme-interactive-primary';
                  bgColor = 'bg-theme-bg-info';
                }
              } else if (isSelected || isMatched) {
                borderColor = 'border-theme-interactive-primary';
                bgColor = 'bg-theme-bg-tertiary';
              }
              
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLeftItemClick(item.id)}
                  disabled={disabled}
                  className={`w-full p-3 text-left border-2 rounded-lg transition-colors ${
                    disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                  } ${borderColor} ${bgColor} ${!isSelected && !isMatched && !showFeedback ? 'hover:bg-theme-bg-secondary' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-theme-text-primary">{item.text}</span>
                    {showFeedback && matchIsCorrect && (
                      <span className="text-theme-interactive-success">✓</span>
                    )}
                    {showFeedback && isMatched && !matchIsCorrect && (
                      <span className="text-theme-interactive-danger">✗</span>
                    )}
                    {showFeedback && !isCorrect && correctRightId !== null && !isMatched && (
                      <span className="text-xs text-theme-interactive-primary">→</span>
                    )}
                    {!showFeedback && isMatched && (
                      <span className="text-xs bg-theme-bg-tertiary text-theme-interactive-primary px-2 py-1 rounded">
                        Matched
                      </span>
                    )}
                    {!showFeedback && isSelected && (
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
            {rightItems.map((item: any, rightIndex: number) => {
              const matchedLeftId = getMatchedLeftId(item.id);
              const isMatched = matchedLeftId !== null;
              const matchIsCorrect = isMatched && matchedLeftId !== null ? isMatchCorrect(matchedLeftId, item.id) : false;
              
              // Check if this is a correct match for any left item (shown when user was wrong)
              const isCorrectMatch = showFeedback && !isCorrect && correctAnswer && Array.isArray(correctAnswer.pairs) 
                ? correctAnswer.pairs.some((pair: any) => pair.rightId === item.id)
                : false;
              
              // Get the correct left item ID if this right item was matched incorrectly
              const correctLeftId = !matchIsCorrect && isMatched ? getCorrectLeftId(item.id) : null;
              const correctLeftIndex = correctLeftId !== null 
                ? leftItems.findIndex((leftItem: any) => leftItem.id === correctLeftId) + 1
                : null;
              
              // Get styling based on feedback
              let borderColor = 'border-theme-border-primary';
              let bgColor = 'bg-theme-bg-primary';
              if (showFeedback && isCorrect !== undefined) {
                if (matchIsCorrect) {
                  borderColor = 'border-theme-interactive-success';
                  bgColor = 'bg-theme-bg-success';
                } else if (isMatched && !matchIsCorrect) {
                  borderColor = 'border-theme-interactive-danger';
                  bgColor = 'bg-theme-bg-danger';
                } else if (!isCorrect && isCorrectMatch) {
                  borderColor = 'border-theme-interactive-primary';
                  bgColor = 'bg-theme-bg-info';
                }
              } else if (isMatched) {
                borderColor = 'border-theme-interactive-primary';
                bgColor = 'bg-theme-bg-tertiary';
              } else if (selectedLeft !== null) {
                bgColor = 'bg-theme-bg-primary';
              } else {
                bgColor = 'bg-theme-bg-secondary';
              }
              
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRightItemClick(item.id)}
                  disabled={disabled || (!showFeedback && selectedLeft === null)}
                  className={`w-full p-3 text-left border-2 rounded-lg transition-colors ${
                    disabled || (!showFeedback && selectedLeft === null) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                  } ${borderColor} ${bgColor} ${!isMatched && selectedLeft !== null && !showFeedback ? 'hover:bg-theme-bg-secondary' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-theme-text-primary">{item.text}</span>
                    <div className="flex items-center gap-1">
                      {showFeedback && matchIsCorrect && (
                        <span className="text-theme-interactive-success">✓</span>
                      )}
                      {showFeedback && isMatched && !matchIsCorrect && (
                        <>
                          {correctLeftIndex !== null && (
                            <span className="text-xs text-theme-interactive-primary">(←{correctLeftIndex})</span>
                          )}
                          <span className="text-theme-interactive-danger">✗</span>
                        </>
                      )}
                      {showFeedback && !isCorrect && isCorrectMatch && !isMatched && (
                        <span className="text-xs text-theme-interactive-primary">←</span>
                      )}
                      {!showFeedback && isMatched && (
                        <span className="text-xs bg-theme-bg-tertiary text-theme-interactive-primary px-2 py-1 rounded">
                          Matched
                        </span>
                      )}
                    </div>
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
