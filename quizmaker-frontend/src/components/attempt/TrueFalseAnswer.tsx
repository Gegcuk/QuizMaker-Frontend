// src/components/attempt/TrueFalseAnswer.tsx
// ---------------------------------------------------------------------------
// Component for True/False question answers
// Provides clear visual feedback for true/false selection
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionForAttemptDto } from '../../types/attempt.types';

interface TrueFalseAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer?: boolean;
  onAnswerChange: (answer: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const TrueFalseAnswer: React.FC<TrueFalseAnswerProps> = ({
  question,
  currentAnswer,
  onAnswerChange,
  disabled = false,
  className = ''
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(currentAnswer ?? null);

  useEffect(() => {
    setSelectedAnswer(currentAnswer ?? null);
  }, [currentAnswer]);

  const handleAnswerSelect = (answer: boolean) => {
    setSelectedAnswer(answer);
    onAnswerChange(answer);
  };

  const getAnswerButtonClass = (isTrue: boolean): string => {
    const baseClass = 'flex-1 p-6 border-2 rounded-lg text-center transition-all duration-200 font-medium text-lg';
    
    if (selectedAnswer === isTrue) {
      return `${baseClass} ${
        isTrue 
          ? 'border-green-500 bg-green-50 text-green-700' 
          : 'border-red-500 bg-red-50 text-red-700'
      }`;
    }
    
    return `${baseClass} border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    }`;
  };

  const getAnswerIcon = (isTrue: boolean): string => {
    if (selectedAnswer === isTrue) {
      return isTrue ? '✅' : '❌';
    }
    return isTrue ? '☑️' : '☐';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      <div className="text-sm text-gray-600 mb-4">
        Select the correct answer:
      </div>

      {/* True/False Options */}
      <div className="grid grid-cols-2 gap-4">
        {/* True Option */}
        <button
          type="button"
          onClick={() => !disabled && handleAnswerSelect(true)}
          disabled={disabled}
          className={getAnswerButtonClass(true)}
        >
          <div className="flex flex-col items-center space-y-2">
            <span className="text-2xl">{getAnswerIcon(true)}</span>
            <span className="font-semibold">True</span>
            <span className="text-sm opacity-75">Correct statement</span>
          </div>
        </button>

        {/* False Option */}
        <button
          type="button"
          onClick={() => !disabled && handleAnswerSelect(false)}
          disabled={disabled}
          className={getAnswerButtonClass(false)}
        >
          <div className="flex flex-col items-center space-y-2">
            <span className="text-2xl">{getAnswerIcon(false)}</span>
            <span className="font-semibold">False</span>
            <span className="text-sm opacity-75">Incorrect statement</span>
          </div>
        </button>
      </div>

      {/* Selection Summary */}
      {selectedAnswer !== null && (
        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
          <div className="text-sm text-indigo-700">
            <strong>Selected:</strong> {selectedAnswer ? 'True' : 'False'}
          </div>
        </div>
      )}

      {/* No Selection Warning */}
      {selectedAnswer === null && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-sm text-yellow-700">
            Please select True or False to continue.
          </div>
        </div>
      )}

      {/* Additional Instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-sm text-blue-700">
          <strong>Tip:</strong> Read the statement carefully and determine if it's true or false based on the information provided.
        </div>
      </div>
    </div>
  );
};

export default TrueFalseAnswer; 