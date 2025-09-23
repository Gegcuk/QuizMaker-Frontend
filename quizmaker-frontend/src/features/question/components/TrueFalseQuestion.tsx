// ---------------------------------------------------------------------------
// TrueFalseQuestion.tsx - True/False question display
// Based on TrueFalseContent from API documentation
// ---------------------------------------------------------------------------

import React from 'react';
import { QuestionDto, TrueFalseContent } from '@/types';

interface TrueFalseQuestionProps {
  question: QuestionDto;
  onAnswerChange?: (answer: boolean | null) => void;
  currentAnswer?: boolean | null;
  showCorrectAnswer?: boolean;
  disabled?: boolean;
}

const TrueFalseQuestion: React.FC<TrueFalseQuestionProps> = ({
  question,
  onAnswerChange,
  currentAnswer,
  showCorrectAnswer = false,
  disabled = false
}) => {
  const content = question.content as TrueFalseContent;
  const correctAnswer = content.answer;

  const handleAnswerChange = (answer: boolean) => {
    if (disabled) return;
    onAnswerChange?.(answer);
  };

  const getOptionStatus = (optionValue: boolean) => {
    if (!showCorrectAnswer) return 'normal';
    
    const isSelected = currentAnswer === optionValue;
    if (optionValue === correctAnswer) return 'correct';
    if (isSelected && optionValue !== correctAnswer) return 'incorrect';
    return 'normal';
  };

  return (
    <div className="true-false-question">
      <div className="space-y-4">
        {/* True Option */}
        <div
          className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
            getOptionStatus(true) === 'correct'
              ? 'border-green-300 bg-theme-bg-success'
              : getOptionStatus(true) === 'incorrect'
              ? 'border-red-300 bg-theme-bg-danger'
              : currentAnswer === true
              ? 'border-theme-interactive-primary bg-theme-bg-primary'
              : 'border-theme-border-primary bg-theme-bg-primary hover:border-theme-border-secondary'
          } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={() => handleAnswerChange(true)}
        >
          <input
            type="radio"
            name="true-false-answer"
            checked={currentAnswer === true}
            onChange={() => handleAnswerChange(true)}
            disabled={disabled}
            className={`h-4 w-4 ${
              getOptionStatus(true) === 'correct'
                ? 'text-theme-interactive-success focus:ring-green-500 border-green-300'
                : getOptionStatus(true) === 'incorrect'
                ? 'text-theme-interactive-danger focus:ring-theme-interactive-danger border-theme-border-primary'
                : 'text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary'
            }`}
          />
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-theme-bg-success rounded-full">
              <svg className="w-5 h-5 text-theme-interactive-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className={`text-lg font-medium ${
              getOptionStatus(true) === 'correct' ? 'text-theme-interactive-success' :
              getOptionStatus(true) === 'incorrect' ? 'text-theme-interactive-danger' :
              'text-theme-text-primary'
            }`}>
              True
            </span>
          </div>
          {showCorrectAnswer && getOptionStatus(true) === 'correct' && (
            <svg className="w-5 h-5 text-theme-interactive-success ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* False Option */}
        <div
          className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
            getOptionStatus(false) === 'correct'
              ? 'border-green-300 bg-theme-bg-success'
              : getOptionStatus(false) === 'incorrect'
              ? 'border-red-300 bg-theme-bg-danger'
              : currentAnswer === false
              ? 'border-theme-interactive-primary bg-theme-bg-primary'
              : 'border-theme-border-primary bg-theme-bg-primary hover:border-theme-border-secondary'
          } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={() => handleAnswerChange(false)}
        >
          <input
            type="radio"
            name="true-false-answer"
            checked={currentAnswer === false}
            onChange={() => handleAnswerChange(false)}
            disabled={disabled}
            className={`h-4 w-4 ${
              getOptionStatus(false) === 'correct'
                ? 'text-theme-interactive-success focus:ring-green-500 border-green-300'
                : getOptionStatus(false) === 'incorrect'
                ? 'text-theme-interactive-danger focus:ring-theme-interactive-danger border-theme-border-primary'
                : 'text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary'
            }`}
          />
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-theme-bg-danger rounded-full">
              <svg className="w-5 h-5 text-theme-interactive-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className={`text-lg font-medium ${
              getOptionStatus(false) === 'correct' ? 'text-theme-interactive-success' :
              getOptionStatus(false) === 'incorrect' ? 'text-theme-interactive-danger' :
              'text-theme-text-primary'
            }`}>
              False
            </span>
          </div>
          {showCorrectAnswer && getOptionStatus(false) === 'correct' && (
            <svg className="w-5 h-5 text-theme-interactive-success ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-theme-text-secondary">
        <p>Select whether the statement is True or False.</p>
      </div>

      {/* Answer Summary */}
      {showCorrectAnswer && (
        <div className="mt-4 p-3 bg-theme-bg-info border border-theme-border-info rounded-md">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-theme-interactive-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-theme-interactive-info">Correct Answer:</span>
            <span className="text-sm text-theme-interactive-primary font-medium">
              {correctAnswer ? 'True' : 'False'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrueFalseQuestion; 