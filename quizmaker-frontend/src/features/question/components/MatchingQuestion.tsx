// ---------------------------------------------------------------------------
// MatchingQuestion.tsx - Display component for matching questions
// Based on MATCHING content from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionDto } from '@/types';

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

const MatchingQuestion: React.FC<MatchingQuestionProps> = ({
  question,
  onAnswerChange,
  currentAnswer = {},
  showCorrectAnswer = false,
  disabled = false,
  className = ''
}) => {
  const [matches, setMatches] = useState<Record<number, number>>(currentAnswer);
  
  // Extract left and right items from question content
  const leftItems: MatchingItem[] = question.content?.left || [];
  const rightItems: MatchingItem[] = question.content?.right || [];

  useEffect(() => {
    setMatches(currentAnswer);
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
      if (newMatches[parseInt(key)] === rightId) {
        delete newMatches[parseInt(key)];
      }
    });
    
    // Add the new match
    newMatches[leftId] = rightId;
    setMatches(newMatches);
    onAnswerChange?.(newMatches);
  };

  const isCorrectMatch = (leftId: number, rightId: number) => {
    if (!showCorrectAnswer) return false;
    
    // Find the correct match for this left item
    const leftItem = leftItems.find(item => item.id === leftId);
    if (!leftItem || !leftItem.matchId) return false;
    
    return leftItem.matchId === rightId;
  };

  const getMatchStatus = (leftId: number, rightId: number) => {
    if (!showCorrectAnswer) return '';
    
    const isCorrect = isCorrectMatch(leftId, rightId);
    const isSelected = matches[leftId] === rightId;
    
    if (isSelected && isCorrect) return 'correct';
    if (isSelected && !isCorrect) return 'incorrect';
    if (!isSelected && isCorrect) return 'should-be-selected';
    return '';
  };

  return (
    <div className={`matching-question space-y-6 ${className}`}>
      {/* Question Text */}
      <div className="text-lg font-medium text-gray-900">
        {question.text}
      </div>

      {/* Matching Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 mb-3">Column A</h4>
          {leftItems.map((leftItem) => (
            <div
              key={leftItem.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                matches[leftItem.id]
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!disabled) {
                  // Toggle selection
                  if (matches[leftItem.id]) {
                    const newMatches = { ...matches };
                    delete newMatches[leftItem.id];
                    setMatches(newMatches);
                    onAnswerChange?.(newMatches);
                  }
                }
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-900">{leftItem.text}</span>
                {matches[leftItem.id] && (
                  <span className="text-blue-600 font-medium">Selected</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 mb-3">Column B</h4>
          {rightItems.map((rightItem) => (
            <div
              key={rightItem.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                Object.values(matches).includes(rightItem.id)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!disabled) {
                  // Find which left item is currently selected
                  const selectedLeftId = Object.keys(matches).find(
                    key => matches[parseInt(key)] === rightItem.id
                  );
                  
                  if (selectedLeftId) {
                    // Remove this match
                    const newMatches = { ...matches };
                    delete newMatches[parseInt(selectedLeftId)];
                    setMatches(newMatches);
                    onAnswerChange?.(newMatches);
                  }
                }
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-900">{rightItem.text}</span>
                {Object.values(matches).includes(rightItem.id) && (
                  <span className="text-green-600 font-medium">Matched</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <strong>Instructions:</strong> Click on items from Column A and Column B to create matches. 
        Click again to remove a match.
      </div>

      {/* Answer Summary */}
      {Object.keys(matches).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-700">
            <strong>Current Matches:</strong>
            <div className="mt-1 space-y-1">
              {Object.entries(matches).map(([leftId, rightId]) => {
                const leftItem = leftItems.find(item => item.id === parseInt(leftId));
                const rightItem = rightItems.find(item => item.id === rightId);
                return (
                  <div key={`${leftId}-${rightId}`} className="text-xs">
                    {leftItem?.text} → {rightItem?.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Correct Answer Display */}
      {showCorrectAnswer && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm text-green-700">
            <strong>Correct Answer:</strong>
            <div className="mt-1 space-y-1">
              {leftItems.map((leftItem) => {
                const correctRightItem = rightItems.find(item => item.id === leftItem.matchId);
                return (
                  <div key={leftItem.id} className="text-xs">
                    {leftItem.text} → {correctRightItem?.text || 'No match'}
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
