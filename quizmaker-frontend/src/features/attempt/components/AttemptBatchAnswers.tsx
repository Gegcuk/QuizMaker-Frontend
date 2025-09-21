// src/components/attempt/AttemptBatchAnswers.tsx
// ---------------------------------------------------------------------------
// Component for batch answer submission in ALL_AT_ONCE mode
// Handles multiple answer submission with validation and progress tracking
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { AttemptService } from '../services/attempt.service';
import { BatchAnswerSubmissionRequest, AnswerSubmissionRequest } from '../types/attempt.types';
import api from '../../../api/axiosInstance';

interface AttemptBatchAnswersProps {
  attemptId: string;
  answers: Record<string, any>;
  totalQuestions: number;
  existingAnswers?: Record<string, any>; // Track already submitted answers
  onSubmissionComplete: (results: any[]) => void;
  onSubmissionError: (error: string) => void;
  className?: string;
}

const AttemptBatchAnswers: React.FC<AttemptBatchAnswersProps> = ({
  attemptId,
  answers,
  totalQuestions,
  existingAnswers = {},
  onSubmissionComplete,
  onSubmissionError,
  className = ''
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const attemptService = new AttemptService(api);

  const validateAnswers = (): string[] => {
    const errors: string[] = [];
    const answeredQuestions = Object.keys(answers).length;

    if (answeredQuestions === 0) {
      errors.push('No answers provided. Please answer at least one question.');
    }

    if (answeredQuestions < totalQuestions) {
      const unanswered = totalQuestions - answeredQuestions;
      errors.push(`${unanswered} question${unanswered > 1 ? 's' : ''} remain${unanswered > 1 ? '' : 's'} unanswered.`);
    }

    // Validate individual answers
    Object.entries(answers).forEach(([questionId, answer]) => {
      if (answer === null || answer === undefined || answer === '') {
        errors.push(`Question ${questionId} has an empty answer.`);
      }
    });

    return errors;
  };

  const handleBatchSubmission = async () => {
    const errors = validateAnswers();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setValidationErrors([]);
    setSubmissionProgress(0);

    try {
      // Filter out answers that have already been submitted
      const newAnswers = Object.entries(answers).filter(([questionId, response]) => {
        // Only include answers that are not in existingAnswers or have changed
        return !existingAnswers[questionId] || existingAnswers[questionId] !== response;
      });

      if (newAnswers.length === 0) {
        // No new answers to submit, just complete the attempt
        onSubmissionComplete([]);
        return;
      }

      // Convert new answers to batch submission format
      const batchAnswers: AnswerSubmissionRequest[] = newAnswers.map(([questionId, response]) => ({
        questionId,
        response
      }));

      const request: BatchAnswerSubmissionRequest = {
        answers: batchAnswers
      };

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSubmissionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const results = await attemptService.submitBatchAnswers(attemptId, request);
      
      clearInterval(progressInterval);
      setSubmissionProgress(100);

      // Small delay to show completion
      setTimeout(() => {
        onSubmissionComplete(results);
      }, 500);

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit answers. Please try again.';
      setError(errorMessage);
      onSubmissionError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const completionPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Submit All Answers
        </h3>
        <p className="text-sm text-gray-600">
          Review your answers before final submission
        </p>
      </div>

      {/* Answer Summary */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{answeredCount}</div>
            <div className="text-sm text-green-700">Answered</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{unansweredCount}</div>
            <div className="text-sm text-yellow-700">Unanswered</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
            <div className="text-sm text-blue-700">Total</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Completion</span>
          <span>{Math.round(completionPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm font-medium text-red-800 mb-2">
            Please fix the following issues:
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Submission Progress */}
      {isSubmitting && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Submitting answers...</span>
            <span>{submissionProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${submissionProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-700">
            <strong>Submission Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleBatchSubmission}
          disabled={isSubmitting || answeredCount === 0}
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
            </div>
          ) : (
            'Submit All Answers'
          )}
        </button>
      </div>

      {/* Warning for incomplete answers */}
      {unansweredCount > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <strong>Note:</strong> You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}. 
            You can still submit, but unanswered questions will be marked as incorrect.
          </div>
        </div>
      )}

      {/* Final confirmation */}
      {answeredCount === totalQuestions && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">
            <strong>Ready to submit!</strong> All questions have been answered.
          </div>
        </div>
      )}
    </div>
  );
};

export default AttemptBatchAnswers; 
