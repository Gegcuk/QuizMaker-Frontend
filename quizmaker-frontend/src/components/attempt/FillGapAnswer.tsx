// src/components/attempt/FillGapAnswer.tsx
// ---------------------------------------------------------------------------
// Component for fill-in-the-blank question answers
// Handles multiple input fields for gap filling
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionForAttemptDto } from '../../types/attempt.types';

interface FillGapAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer?: Record<number, string>;
  onAnswerChange: (answer: Record<number, string>) => void;
  disabled?: boolean;
  className?: string;
}

interface GapAnswer {
  id: number;
  answer: string;
}

const FillGapAnswer: React.FC<FillGapAnswerProps> = ({
  question,
  currentAnswer = {},
  onAnswerChange,
  disabled = false,
  className = ''
}) => {
  const [gapAnswers, setGapAnswers] = useState<Record<number, string>>(currentAnswer);

  useEffect(() => {
    setGapAnswers(currentAnswer);
  }, [currentAnswer]);

  const handleGapChange = (gapId: number, value: string) => {
    const newAnswers = { ...gapAnswers, [gapId]: value };
    setGapAnswers(newAnswers);
    onAnswerChange(newAnswers);
  };

  const handleClearAll = () => {
    const emptyAnswers: Record<number, string> = {};
    setGapAnswers(emptyAnswers);
    onAnswerChange(emptyAnswers);
  };

  // Extract text and gaps from safe content
  const text = question.safeContent?.text || '';
  const gaps = question.safeContent?.gaps || [];

  const renderTextWithGaps = () => {
    if (!text || gaps.length === 0) {
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="text-gray-500 text-center">No text with gaps available</div>
        </div>
      );
    }

    // Split text by gaps and render with input fields
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    gaps.forEach((gap: GapAnswer, index: number) => {
      // Add text before gap
      if (gap.id > lastIndex) {
        parts.push(
          <span key={`text-${index}`} className="text-gray-900">
            {text.substring(lastIndex, gap.id)}
          </span>
        );
      }

      // Add gap input
      parts.push(
        <input
          key={`gap-${gap.id}`}
          type="text"
          value={gapAnswers[gap.id] || ''}
          onChange={(e) => handleGapChange(gap.id, e.target.value)}
          disabled={disabled}
          placeholder={`Gap ${index + 1}`}
          className="mx-2 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 min-w-[120px] text-center"
        />
      );

      lastIndex = gap.id;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-end" className="text-gray-900">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  const filledGaps = Object.values(gapAnswers).filter(answer => answer.trim().length > 0).length;
  const totalGaps = gaps.length;
  const completionPercentage = totalGaps > 0 ? (filledGaps / totalGaps) * 100 : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      <div className="text-sm text-gray-600 mb-4">
        Fill in the blanks with the correct words or phrases:
      </div>

      {/* Text with Gaps */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-lg leading-relaxed">
          {renderTextWithGaps()}
        </div>
      </div>

      {/* Progress and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {filledGaps} of {totalGaps} gaps filled
          </div>
          
          <div className="text-sm text-gray-600">
            {Math.round(completionPercentage)}% complete
          </div>
        </div>

        {Object.keys(gapAnswers).length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Gap List (Alternative View) */}
      {gaps.length > 0 && (
        <div className="border-t pt-4">
          <div className="text-sm font-medium text-gray-700 mb-3">
            Gap Summary:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gaps.map((gap: GapAnswer, index: number) => (
              <div key={gap.id} className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600 min-w-[60px]">
                  Gap {index + 1}:
                </span>
                <input
                  type="text"
                  value={gapAnswers[gap.id] || ''}
                  onChange={(e) => handleGapChange(gap.id, e.target.value)}
                  disabled={disabled}
                  placeholder={`Answer for gap ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                />
                {gapAnswers[gap.id] && (
                  <span className="text-green-600 text-sm">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Status */}
      {completionPercentage === 100 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="text-sm text-green-700">
            ✅ All gaps have been filled!
          </div>
        </div>
      )}

      {completionPercentage > 0 && completionPercentage < 100 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-sm text-yellow-700">
            ⚠️ {totalGaps - filledGaps} gap{totalGaps - filledGaps !== 1 ? 's' : ''} remaining
          </div>
        </div>
      )}

      {completionPercentage === 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-700">
            <strong>Instructions:</strong> Read the text carefully and fill in each blank with the appropriate word or phrase.
          </div>
        </div>
      )}
    </div>
  );
};

export default FillGapAnswer; 