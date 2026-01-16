// ---------------------------------------------------------------------------
// McqQuestion.tsx - Multiple choice question display
// Based on McqSingleContent/McqMultiContent from API documentation
// ---------------------------------------------------------------------------

import React from 'react';
import { QuestionDto, McqSingleContent, McqMultiContent, McqOption } from '@/types';

interface McqQuestionProps {
  question: QuestionDto;
  onAnswerChange?: (answer: string | string[]) => void;
  currentAnswer?: string | string[];
  showCorrectAnswer?: boolean;
  disabled?: boolean;
  isMultiSelect?: boolean;
}

const McqQuestion: React.FC<McqQuestionProps> = ({
  question,
  onAnswerChange,
  currentAnswer,
  showCorrectAnswer = false,
  disabled = false,
  isMultiSelect = false
}) => {
  const content = question.content as McqSingleContent | McqMultiContent;
  const options = content.options || [];

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (disabled) return;

    if (isMultiSelect) {
      const currentAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
      const newAnswers = checked
        ? [...currentAnswers, optionId]
        : currentAnswers.filter(id => id !== optionId);
      onAnswerChange?.(newAnswers);
    } else {
      onAnswerChange?.(checked ? optionId : '');
    }
  };

  const isOptionSelected = (optionId: string) => {
    if (isMultiSelect) {
      return Array.isArray(currentAnswer) && currentAnswer.includes(optionId);
    }
    return currentAnswer === optionId;
  };

  const isOptionCorrect = (option: McqOption) => {
    return showCorrectAnswer && option.correct;
  };

  const getOptionStatus = (option: McqOption) => {
    if (!showCorrectAnswer) return 'normal';
    
    const isSelected = isOptionSelected(option.id);
    if (option.correct) return 'correct';
    if (isSelected && !option.correct) return 'incorrect';
    return 'normal';
  };

  return (
    <div className="mcq-question">
      <div className="space-y-3">
        {options.map((option) => {
          const status = getOptionStatus(option);
          const isSelected = isOptionSelected(option.id);
          
          return (
            <div
              key={option.id}
              className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${
                status === 'correct' 
                  ? 'border-theme-border-success bg-theme-bg-success' 
                  : status === 'incorrect'
                  ? 'border-theme-border-danger bg-theme-bg-danger'
                  : isSelected
                  ? 'border-theme-interactive-primary bg-theme-bg-primary'
                  : 'border-theme-border-primary bg-theme-bg-primary hover:border-theme-border-secondary'
              } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => handleOptionChange(option.id, !isSelected)}
            >
              {/* Option Letter */}
              <div className="flex-shrink-0 mt-1">
                <span className={`inline-flex items-center justify-center w-6 h-6 text-sm font-medium rounded-full ${
                  status === 'correct'
                    ? 'bg-theme-bg-success text-theme-text-primary'
                    : status === 'incorrect'
                    ? 'bg-theme-bg-danger text-theme-text-primary'
                    : isSelected
                    ? 'bg-theme-bg-primary text-theme-text-primary'
                    : 'bg-theme-bg-tertiary text-theme-text-secondary'
                }`}>
                  {option.id.toUpperCase()}
                </span>
              </div>

              {/* Checkbox/Radio */}
              <div className="flex-shrink-0 mt-1">
                <input
                  type={isMultiSelect ? 'checkbox' : 'radio'}
                  name={isMultiSelect ? 'mcq-multi' : 'mcq-single'}
                  checked={isSelected}
                  onChange={(e) => handleOptionChange(option.id, e.target.checked)}
                  disabled={disabled}
                  className={`h-4 w-4 ${
                    isMultiSelect ? 'rounded' : ''
                  } ${
                    status === 'correct'
                      ? 'text-theme-interactive-success focus:ring-theme-interactive-success border-theme-border-success'
                      : status === 'incorrect'
                      ? 'text-theme-interactive-danger focus:ring-theme-interactive-danger border-theme-border-primary'
                      : 'text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary'
                  }`}
                />
              </div>

              {/* Option Text + Media */}
              <div className="flex-1 space-y-2">
                {option.media?.cdnUrl && (
                  <img
                    src={option.media.cdnUrl}
                    alt={`Option ${option.id.toUpperCase()} media`}
                    className="max-w-full h-auto rounded-md border border-theme-border-primary"
                  />
                )}
                {option.text && option.text.trim().length > 0 ? (
                  <div 
                    className={`text-sm ${
                      status === 'correct' ? 'text-theme-interactive-success' :
                      status === 'incorrect' ? 'text-theme-interactive-danger' :
                      'text-theme-text-primary'
                    }`}
                    dangerouslySetInnerHTML={{ __html: option.text }}
                  />
                ) : (
                  !option.media?.cdnUrl && (
                    <div className="text-sm text-theme-text-tertiary">
                      Option {option.id.toUpperCase()}
                    </div>
                  )
                )}
              </div>

              {/* Status Icons */}
              {showCorrectAnswer && (
                <div className="flex-shrink-0 mt-1">
                  {status === 'correct' && (
                    <svg className="w-5 h-5 text-theme-interactive-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {status === 'incorrect' && (
                    <svg className="w-5 h-5 text-theme-interactive-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-theme-text-secondary">
        {isMultiSelect ? (
          <p>Select all correct answers.</p>
        ) : (
          <p>Select the one correct answer.</p>
        )}
      </div>
    </div>
  );
};

export default McqQuestion; 
