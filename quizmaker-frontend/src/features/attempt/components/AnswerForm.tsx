// src/components/attempt/AnswerForm.tsx
// ---------------------------------------------------------------------------
// Base component for answer forms during quiz attempts
// Provides common functionality for all answer types
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { Button } from '@/components';
import { QuestionForAttemptDto, AnswerSubmissionRequest } from '@/types';
import QuestionPrompt from './QuestionPrompt';
import { AttemptService } from '@/services';
import { api } from '@/services';

interface AnswerFormProps {
  question: QuestionForAttemptDto;
  attemptId: string;
  currentAnswer?: any;
  onAnswerChange: (answer: any) => void;
  onSubmit: (result: any) => void;
  onError: (error: string) => void;
  isSubmitting?: boolean;
  showSubmitButton?: boolean;
  className?: string;
}

const AnswerForm: React.FC<AnswerFormProps> = ({
  question,
  attemptId,
  currentAnswer,
  onAnswerChange,
  onSubmit,
  onError,
  isSubmitting = false,
  showSubmitButton = true,
  className = ''
}) => {
  const [answer, setAnswer] = useState<any>(currentAnswer);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const attemptService = new AttemptService(api);

  useEffect(() => {
    setAnswer(currentAnswer);
  }, [currentAnswer]);

  useEffect(() => {
    validateAnswer(answer);
  }, [answer, question]);

  const validateAnswer = (value: any): boolean => {
    setValidationError(null);

    if (value === null || value === undefined || value === '') {
      setValidationError('Please provide an answer.');
      setIsValid(false);
      return false;
    }

    switch (question.type) {
      case 'MCQ_SINGLE':
        if (!value || typeof value !== 'string') {
          setValidationError('Please select one option.');
          setIsValid(false);
          return false;
        }
        break;

      case 'MCQ_MULTI':
        if (!Array.isArray(value) || value.length === 0) {
          setValidationError('Please select at least one option.');
          setIsValid(false);
          return false;
        }
        break;

      case 'TRUE_FALSE':
        if (typeof value !== 'boolean') {
          setValidationError('Please select True or False.');
          setIsValid(false);
          return false;
        }
        break;

      case 'OPEN':
        if (typeof value !== 'string' || value.trim().length === 0) {
          setValidationError('Please provide a text answer.');
          setIsValid(false);
          return false;
        }
        if (value.trim().length < 3) {
          setValidationError('Answer must be at least 3 characters long.');
          setIsValid(false);
          return false;
        }
        break;

      case 'FILL_GAP':
        if (!value || typeof value !== 'object') {
          setValidationError('Please fill in all gaps.');
          setIsValid(false);
          return false;
        }
        const gaps = Object.values(value);
        if (gaps.some((gap: any) => !gap || gap.toString().trim().length === 0)) {
          setValidationError('Please fill in all gaps.');
          setIsValid(false);
          return false;
        }
        break;

      case 'COMPLIANCE':
        if (!Array.isArray(value) || value.length === 0) {
          setValidationError('Please select at least one statement.');
          setIsValid(false);
          return false;
        }
        break;

      case 'ORDERING':
        if (!Array.isArray(value) || value.length === 0) {
          setValidationError('Please arrange all items in order.');
          setIsValid(false);
          return false;
        }
        break;

      case 'HOTSPOT':
        if (!value || typeof value !== 'object') {
          setValidationError('Please select a region on the image.');
          setIsValid(false);
          return false;
        }
        break;
    }

    setIsValid(true);
    return true;
  };

  const handleAnswerChange = (newAnswer: any) => {
    setAnswer(newAnswer);
    onAnswerChange(newAnswer);
  };

  const handleSubmit = async () => {
    if (!validateAnswer(answer)) {
      return;
    }

    try {
      const request: AnswerSubmissionRequest = {
        questionId: question.id,
        response: answer
      };

      const result = await attemptService.submitAnswer(attemptId, request);
      onSubmit(result);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit answer. Please try again.';
      onError(errorMessage);
    }
  };

  const getQuestionTypeLabel = (): string => {
    switch (question.type) {
      case 'MCQ_SINGLE':
        return 'Multiple Choice (Single Answer)';
      case 'MCQ_MULTI':
        return 'Multiple Choice (Multiple Answers)';
      case 'TRUE_FALSE':
        return 'True/False';
      case 'OPEN':
        return 'Open Answer';
      case 'FILL_GAP':
        return 'Fill in the Blanks';
      case 'COMPLIANCE':
        return 'Compliance Check';
      case 'ORDERING':
        return 'Ordering';
      case 'HOTSPOT':
        return 'Hotspot Selection';
      default:
        return 'Question';
    }
  };

  const getDifficultyColor = (): string => {
    switch (question.difficulty) {
      case 'EASY':
        return 'text-theme-interactive-success bg-theme-bg-success';
      case 'MEDIUM':
        return 'text-theme-interactive-warning bg-theme-bg-warning';
      case 'HARD':
        return 'text-theme-interactive-danger bg-theme-bg-danger';
      default:
        return 'text-theme-text-secondary bg-theme-bg-tertiary';
    }
  };

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-theme-text-tertiary">
              {getQuestionTypeLabel()}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor()}`}>
              {question.difficulty}
            </span>
          </div>
        </div>

        <QuestionPrompt
          question={question}
          questionTextClassName="text-lg text-theme-text-primary"
        />
      </div>

      {/* Answer Input Area - To be overridden by specific answer components */}
      <div className="mb-6">
        {/* This will be replaced by specific answer components */}
        <div className="text-theme-text-tertiary text-center py-8">
          Answer input area - use specific answer component
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="mb-4 p-3 bg-theme-bg-danger border border-theme-border-danger rounded-md">
          <div className="text-sm text-theme-interactive-danger">{validationError}</div>
        </div>
      )}

      {/* Submit Button */}
      {showSubmitButton && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            variant="primary"
            size="md"
            loading={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AnswerForm; 
