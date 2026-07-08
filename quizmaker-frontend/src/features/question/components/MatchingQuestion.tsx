// ---------------------------------------------------------------------------
// MatchingQuestion.tsx - Display component for matching questions
// Based on MATCHING content from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionDto } from '@/types';
import { InstructionsModal, SafeContent } from '@/components';

interface MatchingQuestionProps {
  question: QuestionDto;
  onAnswerChange?: (answer: Record<number, number>) => void;
  currentAnswer?: Record<number, number>;
  showCorrectAnswer?: boolean;
  disabled?: boolean;
  className?: string;
}

interface MatchingItem {
  id: number;
  text: string;
  matchId?: number;
}

const EMPTY_MATCHES: Record<number, number> = {};

const MatchingQuestion: React.FC<MatchingQuestionProps> = ({
  question,
  onAnswerChange,
  currentAnswer = EMPTY_MATCHES,
  showCorrectAnswer = false,
  disabled = false,
  className = ''
}) => {
  const [matches, setMatches] = useState<Record<number, number>>(currentAnswer);
  const [selectedLeftId, setSelectedLeftId] = useState<number | null>(null);
  
  // Extract left and right items from question content
  const leftItems: MatchingItem[] = question.content?.left || [];
  const rightItems: MatchingItem[] = question.content?.right || [];

  useEffect(() => {
    setMatches(currentAnswer);
    setSelectedLeftId(null);
  }, [currentAnswer]);

  const handleMatch = (leftId: number, rightId: number) => {
    if (disabled) return;
    
    const newMatches = { ...matches };
    
    // If this left item was already matched, remove the old match
    if (matches[leftId]) {
      delete newMatches[leftId];
    }
    
    // If this right item was already matched by another left item, remove that match
    Object.keys(newMatches).forEach(key => {
      const leftIdForExistingMatch = parseInt(key, 10);
      if (newMatches[leftIdForExistingMatch] === rightId) {
        delete newMatches[leftIdForExistingMatch];
      }
    });
    
    // Add the new match
    newMatches[leftId] = rightId;
    setMatches(newMatches);
    setSelectedLeftId(null);
    onAnswerChange?.(newMatches);
  };

  const removeMatch = (leftId: number) => {
    if (disabled) return;

    const newMatches = { ...matches };
    delete newMatches[leftId];
    setMatches(newMatches);
    if (selectedLeftId === leftId) {
      setSelectedLeftId(null);
    }
    onAnswerChange?.(newMatches);
  };

  const handleLeftClick = (leftId: number) => {
    if (disabled) return;

    if (matches[leftId]) {
      removeMatch(leftId);
      return;
    }

    setSelectedLeftId((current) => (current === leftId ? null : leftId));
  };

  const handleRightClick = (rightId: number) => {
    if (disabled) return;

    if (selectedLeftId !== null) {
      handleMatch(selectedLeftId, rightId);
      return;
    }

    const matchedLeftId = Object.keys(matches).find(
      key => matches[parseInt(key, 10)] === rightId
    );
    if (matchedLeftId) {
      removeMatch(parseInt(matchedLeftId, 10));
    }
  };

  return (
    <div className={`matching-question space-y-6 ${className}`}>
      {/* Question Text */}
      <div className="text-lg font-medium text-theme-text-primary">
        {question.questionText}
      </div>

      {/* Matching Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-3">
          <h4 className="font-medium text-theme-text-secondary mb-3">Column A</h4>
          {leftItems.map((leftItem) => (
            <button
              type="button"
              key={leftItem.id}
              disabled={disabled}
              aria-pressed={selectedLeftId === leftItem.id || !!matches[leftItem.id]}
              className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                matches[leftItem.id]
                  ? 'border-theme-interactive-primary bg-theme-bg-tertiary'
                  : selectedLeftId === leftItem.id
                  ? 'border-theme-interactive-primary bg-theme-bg-info'
                  : 'border-theme-border-primary hover:border-theme-border-secondary'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => handleLeftClick(leftItem.id)}
            >
              <div className="flex items-center justify-between">
                <SafeContent
                  content={leftItem.text}
                  allowHtml
                  className="text-theme-text-primary"
                />
                {matches[leftItem.id] && (
                  <span className="text-theme-interactive-primary font-medium">Selected</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <h4 className="font-medium text-theme-text-secondary mb-3">Column B</h4>
          {rightItems.map((rightItem) => (
            <button
              type="button"
              key={rightItem.id}
              disabled={disabled}
              aria-pressed={Object.values(matches).includes(rightItem.id)}
              className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                Object.values(matches).includes(rightItem.id)
                  ? 'border-theme-interactive-success bg-theme-bg-tertiary'
                  : selectedLeftId !== null
                  ? 'border-theme-border-secondary bg-theme-bg-primary'
                  : 'border-theme-border-primary hover:border-theme-border-secondary'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => handleRightClick(rightItem.id)}
            >
              <div className="flex items-center justify-between">
                <SafeContent
                  content={rightItem.text}
                  allowHtml
                  className="text-theme-text-primary"
                />
                {Object.values(matches).includes(rightItem.id) && (
                  <span className="text-theme-interactive-success font-medium">Matched</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <InstructionsModal title="Instructions">
        Click on items from Column A and Column B to create matches. 
        Click again to remove a match.
      </InstructionsModal>

      {/* Answer Summary */}
      {Object.keys(matches).length > 0 && (
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-3 bg-theme-bg-primary text-theme-text-primary">
          <div className="text-sm text-theme-text-secondary">
            <strong>Current Matches:</strong>
            <div className="mt-1 space-y-1">
              {Object.entries(matches).map(([leftId, rightId]) => {
                const leftItem = leftItems.find(item => item.id === parseInt(leftId, 10));
                const rightItem = rightItems.find(item => item.id === rightId);
                return (
                  <div key={`${leftId}-${rightId}`} className="flex items-center gap-1 text-xs">
                    <SafeContent
                      content={leftItem?.text ?? ''}
                      allowHtml
                      className="text-theme-text-secondary"
                    />
                    <span className="text-theme-text-secondary">→</span>
                    <SafeContent
                      content={rightItem?.text ?? ''}
                      allowHtml
                      className="text-theme-text-secondary"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Correct Answer Display */}
      {showCorrectAnswer && (
        <div className="bg-theme-bg-tertiary border border-theme-border-primary rounded-lg p-3 bg-theme-bg-primary text-theme-text-primary">
          <div className="text-sm text-theme-text-secondary">
            <strong>Correct Answer:</strong>
            <div className="mt-1 space-y-1">
              {leftItems.map((leftItem) => {
                const correctRightItem = rightItems.find(item => item.id === leftItem.matchId);
                return (
                  <div key={leftItem.id} className="flex items-center gap-1 text-xs">
                    <SafeContent
                      content={leftItem.text}
                      allowHtml
                      className="text-theme-text-secondary"
                    />
                    <span className="text-theme-text-secondary">→</span>
                    <SafeContent
                      content={correctRightItem?.text || 'No match'}
                      allowHtml
                      className="text-theme-text-secondary"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingQuestion;
