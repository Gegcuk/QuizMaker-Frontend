// src/components/attempt/AnswerReview.tsx
// ---------------------------------------------------------------------------
// Component for reviewing quiz answers
// Shows detailed review of all answers with correct/incorrect indicators
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { AnswerSubmissionDto, QuestionForAttemptDto } from '@/types';
import { getQuestionTypeIcon } from '@/utils/questionUtils';
import { getAnswerStatusText, getAnswerStatusColor, getAnswerStatusIcon } from '@/utils/statusHelpers';

interface AnswerReviewProps {
  answers: AnswerSubmissionDto[];
  questions?: QuestionForAttemptDto[];
  onBack?: () => void;
  className?: string;
}

const AnswerReview: React.FC<AnswerReviewProps> = ({
  answers,
  questions = [],
  onBack,
  className = ''
}) => {
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());

  const toggleAnswerExpansion = (answerId: string) => {
    const newExpanded = new Set(expandedAnswers);
    if (newExpanded.has(answerId)) {
      newExpanded.delete(answerId);
    } else {
      newExpanded.add(answerId);
    }
    setExpandedAnswers(newExpanded);
  };

  const getQuestionText = (questionId: string): string => {
    const question = questions.find(q => q.id === questionId);
    return question?.questionText || `Question ${questionId}`;
  };

  const getQuestionType = (questionId: string): string => {
    const question = questions.find(q => q.id === questionId);
    return question?.type || 'Unknown';
  };





  const correctAnswers = answers.filter(answer => answer.isCorrect).length;
  const totalAnswers = answers.length;
  const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-text-primary">Answer Review</h2>
          <p className="text-theme-text-secondary">Review your answers and see where you went wrong</p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-theme-bg-secondary rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-theme-text-primary">{totalAnswers}</div>
            <div className="text-sm text-theme-text-secondary">Total Questions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-theme-interactive-success">{correctAnswers}</div>
            <div className="text-sm text-theme-interactive-success">Correct</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-theme-interactive-primary">{Math.round(accuracy)}%</div>
            <div className="text-sm text-theme-interactive-primary">Accuracy</div>
          </div>
        </div>
      </div>

      {/* Answers List */}
      <div className="space-y-4">
        {answers.map((answer, index) => {
          const questionType = getQuestionType(answer.questionId);
          const isExpanded = expandedAnswers.has(answer.answerId);
          const questionText = getQuestionText(answer.questionId);

          return (
            <div
              key={answer.answerId}
              className={`border rounded-lg p-4 transition-colors ${getAnswerStatusColor(answer.isCorrect ?? false)}`}
            >
              {/* Answer Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getAnswerStatusIcon(answer.isCorrect ?? false)}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-theme-text-secondary">
                      Question {index + 1}
                    </span>
                    <span className="text-sm text-theme-text-tertiary">
                      {getQuestionTypeIcon(questionType)} {questionType}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${
                    answer.isCorrect ? 'text-theme-interactive-success' : 'text-theme-interactive-danger'
                  }`}>
                    {getAnswerStatusText(answer.isCorrect ?? false)}
                  </span>
                  <span className="text-sm text-theme-text-secondary">
                    Score: {answer.score}
                  </span>
                  <button
                    onClick={() => toggleAnswerExpansion(answer.answerId)}
                    className="text-theme-text-tertiary hover:text-theme-text-secondary transition-colors"
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-3">
                <h4 className="font-medium text-theme-text-primary">{questionText}</h4>
              </div>

              {/* Answer Details (Expanded) */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
                  <div className="space-y-3">
                                         {/* Your Answer */}
                     <div>
                       <div className="text-sm font-medium text-theme-text-secondary mb-1">Answer Details:</div>
                       <div className="p-3 bg-theme-bg-primary border border-theme-border-primary rounded-md bg-theme-bg-primary text-theme-text-primary">
                         <div className="text-sm text-theme-text-secondary">
                           <strong>Status:</strong> {answer.isCorrect ? 'Correct' : 'Incorrect'}
                         </div>
                         <div className="text-sm text-theme-text-secondary mt-1">
                           <strong>Score:</strong> {answer.score}
                         </div>
                       </div>
                     </div>

                    {/* Answer Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-theme-text-secondary">
                      <div>
                        <span className="font-medium">Answered at:</span> {new Date(answer.answeredAt).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Score earned:</span> {answer.score}
                      </div>
                    </div>

                    {/* Feedback */}
                    {!answer.isCorrect && (
                      <div className="p-3 bg-theme-bg-warning border border-theme-border-warning rounded-md">
                        <div className="text-sm text-theme-interactive-warning">
                          <strong>Note:</strong> This answer was incorrect. Review the question and consider the correct approach for future attempts.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Review Tips */}
      <div className="mt-6 p-4 bg-theme-bg-info border border-theme-border-info rounded-lg">
        <h3 className="text-sm font-medium text-theme-text-primary mb-2">Review Tips:</h3>
        <ul className="text-sm text-theme-interactive-primary space-y-1">
          <li>• Click the arrow to expand each answer for detailed review</li>
          <li>• Pay attention to questions you got wrong - they're learning opportunities</li>
          <li>• Note the question types you struggle with for focused practice</li>
          <li>• Consider retaking the quiz to improve your score</li>
        </ul>
      </div>

      {/* Performance Insights */}
      {totalAnswers > 0 && (
        <div className="mt-6 p-4 bg-theme-bg-primary border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
          <h3 className="text-sm font-medium text-theme-text-primary mb-2">Performance Insights:</h3>
          <div className="text-sm text-theme-text-primary">
            {accuracy >= 90 && "🎯 Excellent performance! You've mastered this material."}
            {accuracy >= 80 && accuracy < 90 && "👍 Great work! You have a solid understanding."}
            {accuracy >= 70 && accuracy < 80 && "📚 Good effort! Focus on the areas you missed."}
            {accuracy >= 60 && accuracy < 70 && "💪 Keep practicing! Review the incorrect answers carefully."}
            {accuracy < 60 && "📖 More study needed. Consider reviewing the material before retaking."}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnswerReview; 
