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
                  ? 'border-green-300 bg-green-50' 
                  : status === 'incorrect'
                  ? 'border-red-300 bg-red-50'
                  : isSelected
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => handleOptionChange(option.id, !isSelected)}
            >
              {/* Option Letter */}
              <div className="flex-shrink-0 mt-1">
                <span className={`inline-flex items-center justify-center w-6 h-6 text-sm font-medium rounded-full ${
                  status === 'correct'
                    ? 'bg-green-500 text-white'
                    : status === 'incorrect'
                    ? 'bg-red-500 text-white'
                    : isSelected
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700'
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
                      ? 'text-green-600 focus:ring-green-500 border-green-300'
                      : status === 'incorrect'
                      ? 'text-red-600 focus:ring-red-500 border-red-300'
                      : 'text-indigo-600 focus:ring-indigo-500 border-gray-300'
                  }`}
                />
              </div>

              {/* Option Text */}
              <div className="flex-1">
                <div 
                  className={`text-sm ${
                    status === 'correct' ? 'text-green-800' :
                    status === 'incorrect' ? 'text-red-800' :
                    'text-gray-900'
                  }`}
                  dangerouslySetInnerHTML={{ __html: option.text }}
                />
              </div>

              {/* Status Icons */}
              {showCorrectAnswer && (
                <div className="flex-shrink-0 mt-1">
                  {status === 'correct' && (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {status === 'incorrect' && (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="mt-4 text-sm text-gray-600">
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