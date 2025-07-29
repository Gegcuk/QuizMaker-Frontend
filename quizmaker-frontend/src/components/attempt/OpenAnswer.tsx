// src/components/attempt/OpenAnswer.tsx
// ---------------------------------------------------------------------------
// Component for open-ended question answers
// Handles text input with character limits and validation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionForAttemptDto } from '../../types/attempt.types';

interface OpenAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer?: string;
  onAnswerChange: (answer: string) => void;
  disabled?: boolean;
  maxLength?: number;
  minLength?: number;
  className?: string;
}

const OpenAnswer: React.FC<OpenAnswerProps> = ({
  question,
  currentAnswer = '',
  onAnswerChange,
  disabled = false,
  maxLength = 1000,
  minLength = 3,
  className = ''
}) => {
  // Ensure currentAnswer is always a string, not null
  const safeCurrentAnswer = currentAnswer || '';
  const [answer, setAnswer] = useState(safeCurrentAnswer);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Ensure currentAnswer is always a string, not null
    setAnswer(currentAnswer || '');
  }, [currentAnswer]);

  const handleAnswerChange = (value: string) => {
    setAnswer(value);
    onAnswerChange(value);
  };

  const handleClear = () => {
    setAnswer('');
    onAnswerChange('');
  };

  // Ensure answer is always a string for safe length access
  const safeAnswer = answer || '';
  const characterCount = safeAnswer.length;
  const isOverLimit = characterCount > maxLength;
  const isUnderLimit = characterCount < minLength;
  const isValidLength = characterCount >= minLength && characterCount <= maxLength;

  const getCharacterCountColor = (): string => {
    if (isOverLimit) return 'text-red-600';
    if (isUnderLimit) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTextareaClass = (): string => {
    const baseClass = 'w-full p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors';
    
    if (isOverLimit) {
      return `${baseClass} border-red-300 focus:border-red-500`;
    }
    if (isFocused) {
      return `${baseClass} border-indigo-300`;
    }
    return `${baseClass} border-gray-300`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      <div className="text-sm text-gray-600 mb-4">
        Provide a detailed answer in the text area below:
      </div>

      {/* Text Area */}
      <div className="relative">
        <textarea
          value={safeAnswer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="Type your answer here..."
          rows={8}
          maxLength={maxLength}
          className={getTextareaClass()}
        />
        
        {/* Character Counter */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {characterCount}/{maxLength}
        </div>
      </div>

      {/* Character Count and Validation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`text-sm ${getCharacterCountColor()}`}>
            {characterCount} character{characterCount !== 1 ? 's' : ''}
          </div>
          
          {isOverLimit && (
            <div className="text-sm text-red-600">
              ⚠️ Exceeds maximum length
            </div>
          )}
          
          {isUnderLimit && characterCount > 0 && (
            <div className="text-sm text-yellow-600">
              ⚠️ Minimum {minLength} characters required
            </div>
          )}
          
          {isValidLength && (
            <div className="text-sm text-green-600">
              ✅ Valid length
            </div>
          )}
        </div>

        {/* Clear Button */}
        {safeAnswer.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Length Requirements */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-sm text-blue-700">
          <strong>Requirements:</strong> 
          <ul className="mt-1 ml-4 list-disc">
            <li>Minimum {minLength} characters</li>
            <li>Maximum {maxLength} characters</li>
            <li>Be specific and detailed in your response</li>
          </ul>
        </div>
      </div>

      {/* Writing Tips */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="text-sm text-gray-700">
          <strong>Writing Tips:</strong>
          <ul className="mt-1 ml-4 list-disc">
            <li>Structure your answer clearly</li>
            <li>Provide specific examples when possible</li>
            <li>Use complete sentences and proper grammar</li>
            <li>Address all parts of the question</li>
          </ul>
        </div>
      </div>

      {/* No Answer Warning */}
      {safeAnswer.length === 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-sm text-yellow-700">
            Please provide an answer to continue.
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenAnswer; 