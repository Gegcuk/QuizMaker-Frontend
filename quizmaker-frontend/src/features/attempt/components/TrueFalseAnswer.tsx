// src/components/attempt/TrueFalseAnswer.tsx
// ---------------------------------------------------------------------------
// Component for True/False question answers
// Provides clear visual feedback for true/false selection
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionForAttemptDto } from '@/types';

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
          ? 'border-theme-interactive-success bg-theme-bg-tertiary text-theme-text-primary' 
          : 'border-theme-interactive-danger bg-theme-bg-tertiary text-theme-text-primary'
      }`;
    }
    
    return `${baseClass} border-theme-border-primary bg-theme-bg-primary text-theme-text-secondary hover:border-theme-border-secondary hover:bg-theme-bg-secondary ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    }`;
  };

  const getAnswerIcon = (isTrue: boolean): string => {
    if (selectedAnswer === isTrue) {
      return isTrue ? '✅' : '❌';
    }
    return isTrue ? '✓' : '✗';
  };

  return (
    <div className={`space-y-4 ${className}`}>


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
            <span className="text-3xl font-bold">{getAnswerIcon(true)}</span>
            <span className="font-semibold">True</span>
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
            <span className="text-3xl font-bold">{getAnswerIcon(false)}</span>
            <span className="font-semibold">False</span>
          </div>
        </button>
      </div>


    </div>
  );
};

export default TrueFalseAnswer; 
