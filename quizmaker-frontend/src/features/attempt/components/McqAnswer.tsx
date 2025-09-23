// src/components/attempt/McqAnswer.tsx
// ---------------------------------------------------------------------------
// Component for MCQ (Multiple Choice) question answers
// Handles both single and multiple choice questions
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionForAttemptDto } from '@/types';

interface McqAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer?: string | string[];
  onAnswerChange: (answer: string | string[]) => void;
  disabled?: boolean;
  singleChoice?: boolean;
  className?: string;
}

interface McqOption {
  id: string;
  text: string;
}

const McqAnswer: React.FC<McqAnswerProps> = ({
  question,
  currentAnswer,
  onAnswerChange,
  disabled = false,
  singleChoice = false,
  className = ''
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const isMultiChoice = !singleChoice && question.type === 'MCQ_MULTI';

  useEffect(() => {
    if (currentAnswer) {
      if (isMultiChoice) {
        setSelectedOptions(Array.isArray(currentAnswer) ? currentAnswer : [currentAnswer]);
      } else {
        setSelectedOptions(typeof currentAnswer === 'string' ? [currentAnswer] : []);
      }
    } else {
      setSelectedOptions([]);
    }
  }, [currentAnswer, isMultiChoice]);

  const handleOptionChange = (optionId: string) => {
    let newSelection: string[];

    if (isMultiChoice) {
      // Multiple choice: toggle selection
      if (selectedOptions.includes(optionId)) {
        newSelection = selectedOptions.filter(id => id !== optionId);
      } else {
        newSelection = [...selectedOptions, optionId];
      }
    } else {
      // Single choice: replace selection
      newSelection = [optionId];
    }

    setSelectedOptions(newSelection);
    
    // Call parent with appropriate format
    if (isMultiChoice) {
      onAnswerChange(newSelection);
    } else {
      onAnswerChange(newSelection[0] || '');
    }
  };

  const handleSelectAll = () => {
    if (!isMultiChoice) return;
    
    const allOptionIds = (question.safeContent?.options || []).map((opt: McqOption) => opt.id);
    setSelectedOptions(allOptionIds);
    onAnswerChange(allOptionIds);
  };

  const handleClearAll = () => {
    setSelectedOptions([]);
    onAnswerChange(isMultiChoice ? [] : '');
  };

  // Extract options from safe content
  const options: McqOption[] = question.safeContent?.options || [];

  if (options.length === 0) {
    return (
      <div className={`p-4 bg-theme-bg-secondary border border-theme-border-primary rounded-md ${className}`}>
        <div className="text-theme-text-tertiary text-center">No options available</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      <div className="text-sm text-theme-text-secondary mb-4">
        {isMultiChoice ? (
          <div className="flex items-center justify-between">
            <span>Select all that apply:</span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleSelectAll}
                disabled={disabled}
                className="text-xs text-theme-interactive-primary hover:text-theme-interactive-primary-hover disabled:opacity-50"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={disabled}
                className="text-xs text-theme-text-secondary hover:text-theme-text-primary disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
          </div>
        ) : (
          <span>Select one option:</span>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedOptions.includes(option.id);
          const optionLabel = String.fromCharCode(65 + index); // A, B, C, D, etc.

          return (
            <label
              key={option.id}
              className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'border-theme-interactive-primary bg-theme-bg-tertiary'
                  : 'border-theme-border-primary hover:border-theme-border-secondary hover:bg-theme-bg-secondary'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type={isMultiChoice ? 'checkbox' : 'radio'}
                name={`question-${question.id}`}
                value={option.id}
                checked={isSelected}
                onChange={() => handleOptionChange(option.id)}
                disabled={disabled}
                className={`mt-1 ${
                  isMultiChoice ? 'rounded' : 'rounded-full'
                } border-theme-border-primary text-theme-interactive-primary focus:ring-theme-interactive-primary focus:ring-2`}
              />
              
              <div className="ml-3 flex-1">
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-theme-text-secondary bg-theme-bg-tertiary rounded-full mr-3 flex-shrink-0">
                    {optionLabel}
                  </span>
                  <span className="text-theme-text-primary">{option.text}</span>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Selection Summary */}
      {isMultiChoice && selectedOptions.length > 0 && (
        <div className="mt-4 p-3 bg-theme-bg-tertiary border border-theme-border-primary rounded-md">
          <div className="text-sm text-theme-text-secondary">
            <strong>Selected:</strong> {selectedOptions.length} option{selectedOptions.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* No Selection Warning */}
      {selectedOptions.length === 0 && (
        <div className="mt-4 p-3 bg-theme-bg-tertiary border border-theme-border-primary rounded-md">
          <div className="text-sm text-theme-text-secondary">
            Please select {isMultiChoice ? 'at least one option' : 'an option'} to continue.
          </div>
        </div>
      )}
    </div>
  );
};

export default McqAnswer; 
