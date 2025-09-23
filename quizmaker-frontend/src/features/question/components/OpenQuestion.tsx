// ---------------------------------------------------------------------------
// OpenQuestion.tsx - Open-ended question display
// Based on OpenContent from API documentation
// ---------------------------------------------------------------------------

import React from 'react';
import { QuestionDto, OpenContent } from '@/types';

interface OpenQuestionProps {
  question: QuestionDto;
  onAnswerChange?: (answer: string) => void;
  currentAnswer?: string;
  showCorrectAnswer?: boolean;
  disabled?: boolean;
}

const OpenQuestion: React.FC<OpenQuestionProps> = ({
  question,
  onAnswerChange,
  currentAnswer = '',
  showCorrectAnswer = false,
  disabled = false
}) => {
  const content = question.content as OpenContent;
  const modelAnswer = content.answer;

  const handleAnswerChange = (value: string) => {
    if (disabled) return;
    onAnswerChange?.(value);
  };

  return (
    <div className="open-question">
      {/* Answer Input */}
      <div className="space-y-4">
        <div>
          <label htmlFor="open-answer" className="block text-sm font-medium text-theme-text-secondary mb-2">
            Your Answer
          </label>
          <textarea
            id="open-answer"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Enter your answer here..."
            disabled={disabled}
            className="block w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm resize-none"
            rows={6}
          />
          <p className="mt-1 text-sm text-theme-text-tertiary">
            Provide a detailed answer to the question above.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-theme-text-secondary">
        <p>Provide a comprehensive answer in your own words.</p>
      </div>

      {/* Model Answer (shown when reviewing) */}
      {showCorrectAnswer && modelAnswer && (
        <div className="mt-6 p-4 bg-theme-bg-success border border-theme-border-success rounded-md">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-theme-interactive-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-theme-interactive-success">Model Answer</p>
              <div 
                className="text-sm text-theme-interactive-success mt-1 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: modelAnswer }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Answer Comparison */}
      {showCorrectAnswer && currentAnswer && modelAnswer && (
        <div className="mt-4 p-4 bg-theme-bg-info border border-theme-border-info rounded-md">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-theme-interactive-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-theme-interactive-info">Answer Analysis</p>
              <p className="text-sm text-theme-interactive-primary mt-1">
                Your answer will be compared against the model answer for grading. 
                Consider key points, terminology, and completeness in your response.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grading Note */}
      <div className="mt-4 p-3 bg-theme-bg-warning border border-theme-border-warning rounded-md">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-theme-interactive-warning mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-theme-interactive-warning">Grading Information</p>
            <p className="text-sm text-theme-interactive-warning mt-1">
              Open-ended questions are typically graded manually or using AI assessment. 
              Your answer will be evaluated based on completeness, accuracy, and relevance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenQuestion; 