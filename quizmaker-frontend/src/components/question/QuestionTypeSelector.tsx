// ---------------------------------------------------------------------------
// QuestionTypeSelector.tsx - Question type selection component
// Based on QuestionType from API documentation
// ---------------------------------------------------------------------------

import React from 'react';
import { QuestionType } from '../../types/question.types';

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
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      type: 'MCQ_MULTI' as QuestionType,
      label: 'Multiple Choice (Multiple Answers)',
      description: 'Choose multiple correct answers from options',
      icon: '☑️',
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      type: 'TRUE_FALSE' as QuestionType,
      label: 'True/False',
      description: 'Simple true or false question',
      icon: '✅',
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    },
    {
      type: 'OPEN' as QuestionType,
      label: 'Open Ended',
      description: 'Free text answer with model answer',
      icon: '📝',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700'
    },
    {
      type: 'FILL_GAP' as QuestionType,
      label: 'Fill in the Blank',
      description: 'Complete missing words in text',
      icon: '⬜',
      color: 'bg-orange-50 border-orange-200 text-orange-700'
    },
    {
      type: 'COMPLIANCE' as QuestionType,
      label: 'Compliance',
      description: 'Identify compliant/non-compliant statements',
      icon: '📋',
      color: 'bg-red-50 border-red-200 text-red-700'
    },
    {
      type: 'ORDERING' as QuestionType,
      label: 'Ordering',
      description: 'Arrange items in correct order',
      icon: '📊',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    },
    {
      type: 'HOTSPOT' as QuestionType,
      label: 'Hotspot',
      description: 'Click on correct areas in an image',
      icon: '🎯',
      color: 'bg-pink-50 border-pink-200 text-pink-700'
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
              : 'bg-white border-gray-200 hover:border-gray-300'
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
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
          </div>

          {/* Content */}
          <div className="ml-3 flex-1">
            <div className="flex items-center">
              <span className="text-lg mr-2">{questionType.icon}</span>
              <label className="text-sm font-medium text-gray-900 cursor-pointer">
                {questionType.label}
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
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
