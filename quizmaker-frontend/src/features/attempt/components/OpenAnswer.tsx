// src/components/attempt/OpenAnswer.tsx
// ---------------------------------------------------------------------------
// Component for open-ended question answers
// Handles text input with character limits and validation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionForAttemptDto } from '@/types';
import { Textarea, Button } from '@/components';

interface OpenAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer?: string;
  onAnswerChange: (answer: string) => void;
  disabled?: boolean;
  maxLength?: number;
  minLength?: number;
  className?: string;
  showFeedback?: boolean;
  isCorrect?: boolean;
  correctAnswer?: any;
}

const OpenAnswer: React.FC<OpenAnswerProps> = ({
  question,
  currentAnswer = '',
  onAnswerChange,
  disabled = false,
  maxLength = 1000,
  minLength = 3,
  className = '',
  showFeedback = false,
  isCorrect,
  correctAnswer
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
    if (isOverLimit) return 'text-theme-interactive-danger';
    if (isUnderLimit) return 'text-theme-interactive-warning';
    return 'text-theme-interactive-success';
  };

  const getTextareaClass = (): string => {
    const baseClass = 'w-full p-4 border-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary transition-colors';
    
    // Apply feedback colors
    if (showFeedback && isCorrect !== undefined) {
      if (isCorrect) {
        return `${baseClass} border-theme-interactive-success bg-theme-bg-success`;
      } else {
        return `${baseClass} border-theme-interactive-danger bg-theme-bg-danger`;
      }
    }
    
    if (isOverLimit) {
      return `${baseClass} border-theme-border-danger focus:border-theme-border-danger`;
    }
    if (isFocused) {
      return `${baseClass} border-theme-interactive-primary`;
    }
    return `${baseClass} border-theme-border-primary`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      <div className="text-sm text-theme-text-secondary mb-4">
        Provide a detailed answer in the text area below:
      </div>

      {/* Text Area */}
      <div className="relative">
        <Textarea
          value={safeAnswer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          disabled={disabled}
          placeholder="Type your answer here..."
          rows={8}
          maxLength={maxLength}
          showCharCount
          fullWidth
          error={isOverLimit ? 'Exceeds maximum length' : undefined}
        />
      </div>

      {/* Character Count and Validation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`text-sm ${getCharacterCountColor()}`}>
            {characterCount} character{characterCount !== 1 ? 's' : ''}
          </div>
          
          {isOverLimit && (
            <div className="text-sm text-theme-interactive-danger">
              ⚠️ Exceeds maximum length
            </div>
          )}
          
          {isUnderLimit && characterCount > 0 && (
            <div className="text-sm text-theme-interactive-warning">
              ⚠️ Minimum {minLength} characters required
            </div>
          )}
          
          {isValidLength && (
            <div className="text-sm text-theme-interactive-success">
              ✅ Valid length
            </div>
          )}
        </div>

        {/* Clear Button */}
        {safeAnswer.length > 0 && (
          <Button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            variant="ghost"
            size="sm"
            className="!text-sm !p-0 hover:underline"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Length Requirements */}
      <div className="p-3 bg-theme-bg-info border border-theme-border-info rounded-md">
        <div className="text-sm text-theme-interactive-primary">
          <strong>Requirements:</strong> 
          <ul className="mt-1 ml-4 list-disc">
            <li>Minimum {minLength} characters</li>
            <li>Maximum {maxLength} characters</li>
            <li>Be specific and detailed in your response</li>
          </ul>
        </div>
      </div>

      {/* Writing Tips */}
      <div className="p-3 bg-theme-bg-secondary border border-theme-border-primary rounded-md bg-theme-bg-primary text-theme-text-primary">
        <div className="text-sm text-theme-text-secondary">
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
        <div className="p-3 bg-theme-bg-tertiary border border-theme-border-primary rounded-md bg-theme-bg-primary text-theme-text-primary">
          <div className="text-sm text-theme-text-secondary">
            Please provide an answer to continue.
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenAnswer; 
