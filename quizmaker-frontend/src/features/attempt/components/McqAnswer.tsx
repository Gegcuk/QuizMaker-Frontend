// src/components/attempt/McqAnswer.tsx
// ---------------------------------------------------------------------------
// Component for MCQ (Multiple Choice) question answers
// Handles both single and multiple choice questions
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionForAttemptDto } from '@/types';
import { Button } from '@/components';

interface McqAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer?: string | string[];
  onAnswerChange: (answer: string | string[]) => void;
  disabled?: boolean;
  singleChoice?: boolean;
  className?: string;
  showFeedback?: boolean;
  isCorrect?: boolean;
  correctAnswer?: any;
}

interface McqOption {
  id: string;
  text?: string;
  media?: { assetId?: string; cdnUrl?: string };
}

const McqAnswer: React.FC<McqAnswerProps> = ({
  question,
  currentAnswer,
  onAnswerChange,
  disabled = false,
  singleChoice = false,
  className = '',
  showFeedback = false,
  isCorrect,
  correctAnswer
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

  const hasOptionMedia = options.some(
    (option) => option.media?.cdnUrl || option.media?.assetId
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      <div className="text-sm text-theme-text-secondary mb-4">
        {isMultiChoice ? (
          <div className="flex items-center justify-between">
            <span>Select all that apply:</span>
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={handleSelectAll}
                disabled={disabled}
                variant="ghost"
                size="sm"
                className="!text-xs !p-1 !min-w-0"
              >
                Select All
              </Button>
              <Button
                type="button"
                onClick={handleClearAll}
                disabled={disabled}
                variant="ghost"
                size="sm"
                className="!text-xs !p-1 !min-w-0"
              >
                Clear All
              </Button>
            </div>
          </div>
        ) : (
          <span>Select one option:</span>
        )}
      </div>

      {/* Options */}
      <div className={hasOptionMedia ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-3'}>
        {options.map((option, index) => {
          const isSelected = selectedOptions.includes(option.id);
          const optionLabel = String.fromCharCode(65 + index); // A, B, C, D, etc.

          // Determine if this option is correct (for feedback)
          let isCorrectOption = false;
          if (showFeedback && correctAnswer) {
            if (singleChoice) {
              isCorrectOption = correctAnswer.correctOptionId === option.id || String(correctAnswer.correctOptionId) === String(option.id);
            } else {
              isCorrectOption = Array.isArray(correctAnswer.correctOptionIds) && 
                correctAnswer.correctOptionIds.some((id: any) => id === option.id || String(id) === String(option.id));
            }
          }

          // Get styling based on feedback
          let borderColor = 'border-theme-border-primary';
          let bgColor = 'bg-transparent';
          if (showFeedback && isCorrect !== undefined) {
            if (isCorrect && isSelected) {
              // User selected correct answer
              borderColor = 'border-theme-interactive-success';
              bgColor = 'bg-theme-bg-success';
            } else if (!isCorrect && isSelected && !isCorrectOption) {
              // User selected incorrect answer
              borderColor = 'border-theme-interactive-danger';
              bgColor = 'bg-theme-bg-danger';
            } else if (!isCorrect && isCorrectOption) {
              // Correct answer (shown when user was wrong)
              borderColor = 'border-theme-interactive-primary';
              bgColor = 'bg-theme-bg-info';
            }
          } else if (isSelected) {
            // Normal selection (no feedback yet)
            borderColor = 'border-theme-interactive-primary';
            bgColor = 'bg-theme-bg-tertiary';
          }

          return (
            <label
              key={option.id}
              className={`flex items-start p-4 border-2 rounded-lg transition-colors ${
                disabled 
                  ? 'opacity-70 cursor-not-allowed' 
                  : `cursor-pointer ${isSelected ? '' : 'hover:border-theme-border-secondary'}`
              } ${borderColor} ${bgColor}`}
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
                  <span className={`inline-flex items-center justify-center w-6 h-6 text-sm font-medium rounded-full mr-3 flex-shrink-0 ${
                    showFeedback && isCorrectOption 
                      ? 'text-theme-text-primary bg-theme-bg-info' 
                      : 'text-theme-text-secondary bg-theme-bg-tertiary'
                  }`}>
                    {optionLabel}
                  </span>
                  <div className="flex-1 space-y-2">
                    {option.media?.cdnUrl && (
                      <img
                        src={option.media.cdnUrl}
                        alt={`Option ${optionLabel} media`}
                        className="max-w-full h-auto rounded-md border border-theme-border-primary"
                      />
                    )}
                    {option.text && option.text.trim().length > 0 ? (
                      <span className="text-theme-text-primary">{option.text}</span>
                    ) : (
                      !option.media?.cdnUrl && (
                        <span className="text-theme-text-tertiary">
                          Option {optionLabel}
                        </span>
                      )
                    )}
                  </div>
                  {showFeedback && isCorrectOption && (
                    <span className="ml-2 text-theme-interactive-success">✓</span>
                  )}
                  {showFeedback && !isCorrect && isSelected && !isCorrectOption && (
                    <span className="ml-2 text-theme-interactive-danger">✗</span>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Selection Summary */}
      {isMultiChoice && selectedOptions.length > 0 && (
        <div className="mt-4 p-3 bg-theme-bg-tertiary border border-theme-border-primary rounded-md bg-theme-bg-primary text-theme-text-primary">
          <div className="text-sm text-theme-text-secondary">
            <strong>Selected:</strong> {selectedOptions.length} option{selectedOptions.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* No Selection Warning */}
      {selectedOptions.length === 0 && (
        <div className="mt-4 p-3 bg-theme-bg-tertiary border border-theme-border-primary rounded-md bg-theme-bg-primary text-theme-text-primary">
          <div className="text-sm text-theme-text-secondary">
            Please select {isMultiChoice ? 'at least one option' : 'an option'} to continue.
          </div>
        </div>
      )}
    </div>
  );
};

export default McqAnswer; 
