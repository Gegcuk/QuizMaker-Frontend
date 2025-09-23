// ---------------------------------------------------------------------------
// QuestionRenderer.tsx - Dynamic question display
// Based on QuestionDto from API documentation
// ---------------------------------------------------------------------------

import React from 'react';
import { Badge } from '@/components';
import { QuestionDto, QuestionType } from '@/types';
import McqQuestion from './McqQuestion';
import TrueFalseQuestion from './TrueFalseQuestion';
import OpenQuestion from './OpenQuestion';
import FillGapQuestion from './FillGapQuestion';
import ComplianceQuestion from './ComplianceQuestion';
import OrderingQuestion from './OrderingQuestion';
import HotspotQuestion from './HotspotQuestion';
import MatchingQuestion from './MatchingQuestion';

interface QuestionRendererProps {
  question: QuestionDto;
  onAnswerChange?: (answer: any) => void;
  currentAnswer?: any;
  showCorrectAnswer?: boolean;
  disabled?: boolean;
  className?: string;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  onAnswerChange,
  currentAnswer,
  showCorrectAnswer = false,
  disabled = false,
  className = ''
}) => {
  const renderQuestionByType = () => {
    switch (question.type) {
      case 'MCQ_SINGLE':
        return (
          <McqQuestion
            question={question}
            onAnswerChange={onAnswerChange}
            currentAnswer={currentAnswer}
            showCorrectAnswer={showCorrectAnswer}
            disabled={disabled}
            isMultiSelect={false}
          />
        );

      case 'MCQ_MULTI':
        return (
          <McqQuestion
            question={question}
            onAnswerChange={onAnswerChange}
            currentAnswer={currentAnswer}
            showCorrectAnswer={showCorrectAnswer}
            disabled={disabled}
            isMultiSelect={true}
          />
        );

      case 'TRUE_FALSE':
        return (
          <TrueFalseQuestion
            question={question}
            onAnswerChange={onAnswerChange}
            currentAnswer={currentAnswer}
            showCorrectAnswer={showCorrectAnswer}
            disabled={disabled}
          />
        );

      case 'OPEN':
        return (
          <OpenQuestion
            question={question}
            onAnswerChange={onAnswerChange}
            currentAnswer={currentAnswer}
            showCorrectAnswer={showCorrectAnswer}
            disabled={disabled}
          />
        );

      case 'FILL_GAP':
        return (
          <FillGapQuestion
            question={question}
            onAnswerChange={onAnswerChange}
            currentAnswer={currentAnswer}
            showCorrectAnswer={showCorrectAnswer}
            disabled={disabled}
          />
        );

      case 'COMPLIANCE':
        return (
          <ComplianceQuestion
            question={question}
            onAnswerChange={onAnswerChange}
            currentAnswer={currentAnswer}
            showCorrectAnswer={showCorrectAnswer}
            disabled={disabled}
          />
        );

      case 'ORDERING':
        return (
          <OrderingQuestion
            question={question}
            onAnswerChange={onAnswerChange}
            currentAnswer={currentAnswer}
            showCorrectAnswer={showCorrectAnswer}
            disabled={disabled}
          />
        );

      case 'HOTSPOT':
        return (
          <HotspotQuestion
            question={question}
            onAnswerChange={onAnswerChange}
            currentAnswer={currentAnswer}
            showCorrectAnswer={showCorrectAnswer}
            disabled={disabled}
          />
        );

      case 'MATCHING':
        return (
          <MatchingQuestion
            question={question}
            onAnswerChange={onAnswerChange}
            currentAnswer={currentAnswer}
            showCorrectAnswer={showCorrectAnswer}
            disabled={disabled}
          />
        );

      default:
        return (
          <div className="p-4 border border-theme-border-primary rounded-lg bg-theme-bg-tertiary bg-theme-bg-primary text-theme-text-primary">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-theme-interactive-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-theme-interactive-danger font-medium">Unsupported Question Type</span>
            </div>
            <p className="mt-1 text-sm text-theme-interactive-danger">
              Question type "{question.type}" is not supported in this version.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`question-renderer ${className}`}>
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Badge variant="info" size="sm">{question.type.replace('_', ' ')}</Badge>
            {question.difficulty && (
              <Badge
                variant={
                  question.difficulty === 'EASY'
                    ? 'success'
                    : question.difficulty === 'MEDIUM'
                    ? 'warning'
                    : 'danger'
                }
                size="sm"
              >
                {question.difficulty}
              </Badge>
            )}
          </div>
          {/* Points display removed as it's not in QuestionDto */}
        </div>

        {/* Question Text */}
        <div className="prose max-w-none">
          <div 
            className="text-lg font-medium text-theme-text-primary mb-4"
            dangerouslySetInnerHTML={{ __html: question.questionText }}
          />
        </div>

        {/* Question Metadata */}
        {question.hint && (
          <div className="mb-4 p-3 bg-theme-bg-tertiary border border-theme-border-primary rounded-md bg-theme-bg-primary text-theme-text-primary">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-theme-interactive-warning mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-theme-interactive-warning">Hint</p>
                <p className="text-sm text-theme-interactive-warning mt-1">{question.hint}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question Content */}
      <div className="question-content">
        {renderQuestionByType()}
      </div>

      {/* Question Footer */}
      {showCorrectAnswer && question.explanation && (
        <div className="mt-6 p-4 bg-theme-bg-tertiary border border-theme-border-primary rounded-md bg-theme-bg-primary text-theme-text-primary">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-theme-interactive-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-theme-interactive-success">Explanation</p>
              <div 
                className="text-sm text-theme-interactive-success mt-1 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: question.explanation }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer; 
