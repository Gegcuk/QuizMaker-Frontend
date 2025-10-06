// ---------------------------------------------------------------------------
// QuestionTypeSelector.tsx - Question type selection component
// Based on QuestionType from API documentation
// ---------------------------------------------------------------------------

import React from 'react';
import { QuestionType } from '@/types';

interface QuestionTypeSelectorProps {
  selectedType: QuestionType;
  onTypeChange: (type: QuestionType) => void;
  className?: string;
}

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  className = ''
}) => {
  const questionTypes = [
    {
      type: 'MCQ_SINGLE' as QuestionType,
      label: 'Multiple Choice (Single Answer)',
      description: 'Choose one correct answer from multiple options',
      icon: '🔘',
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    },
    {
      type: 'MCQ_MULTI' as QuestionType,
      label: 'Multiple Choice (Multiple Answers)',
      description: 'Choose multiple correct answers from options',
      icon: '☑️',
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    },
    {
      type: 'TRUE_FALSE' as QuestionType,
      label: 'True/False',
      description: 'Simple true or false question',
      icon: '✅',
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    },
    {
      type: 'FILL_GAP' as QuestionType,
      label: 'Fill in the Blank',
      description: 'Complete missing words in text',
      icon: '⬜',
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    },
    {
      type: 'COMPLIANCE' as QuestionType,
      label: 'Compliance',
      description: 'Identify compliant/non-compliant statements',
      icon: '📋',
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    },
    {
      type: 'ORDERING' as QuestionType,
      label: 'Ordering',
      description: 'Arrange items in correct order',
      icon: '📊',
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    },
    {
      type: 'HOTSPOT' as QuestionType,
      label: 'Hotspot',
      description: 'Click on correct areas in an image',
      icon: '🎯',
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    },
    {
      type: 'MATCHING' as QuestionType,
      label: 'Matching',
      description: 'Match items from two columns together',
      icon: '🔗',
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    }
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {questionTypes.map((questionType) => (
        <button
          type="button"
          key={questionType.type}
          className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            selectedType === questionType.type
              ? `${questionType.color} border-current`
              : 'bg-theme-bg-primary border-theme-border-primary hover:border-theme-border-secondary'
          }`}
          onClick={() => onTypeChange(questionType.type)}
        >
          {/* Radio Button */}
          <div className="flex items-center h-5 mt-0.5">
            <input
              type="radio"
              name="questionType"
              value={questionType.type}
              checked={selectedType === questionType.type}
              onChange={() => onTypeChange(questionType.type)}
              className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary bg-theme-bg-primary"
            />
          </div>

          {/* Content */}
          <div className="ml-3 flex-1">
            <div className="flex items-center">
              <span className="text-lg mr-2">{questionType.icon}</span>
              <label className="text-sm font-medium text-theme-text-primary cursor-pointer">
                {questionType.label}
              </label>
            </div>
            <p className="mt-1 text-sm text-theme-text-tertiary">
              {questionType.description}
            </p>
          </div>

          {/* Selected Indicator */}
          {selectedType === questionType.type && (
            <div className="absolute top-2 right-2">
              <svg className="h-5 w-5 text-current" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default QuestionTypeSelector; 
