// ---------------------------------------------------------------------------
// FillGapQuestion.tsx - Fill in the blank question display
// Based on FillGapContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { QuestionDto, FillGapContent } from '@/types';

interface FillGapQuestionProps {
  question: QuestionDto;
  onAnswerChange?: (answers: Record<number, string>) => void;
  currentAnswer?: Record<number, string>;
  showCorrectAnswer?: boolean;
  disabled?: boolean;
}

const FillGapQuestion: React.FC<FillGapQuestionProps> = ({
  question,
  onAnswerChange,
  currentAnswer = {},
  showCorrectAnswer = false,
  disabled = false
}) => {
  const content = question.content as FillGapContent;
  const { text, gaps } = content;
  const [answers, setAnswers] = useState<Record<number, string>>(currentAnswer);

  const handleGapChange = (gapId: number, value: string) => {
    if (disabled) return;
    
    const newAnswers = { ...answers, [gapId]: value };
    setAnswers(newAnswers);
    onAnswerChange?.(newAnswers);
  };

  const renderTextWithGaps = () => {
    if (!text) return null;

    const parts = text.split(/(___\d+___)/);
    return parts.map((part, index) => {
      const gapMatch = part.match(/___(\d+)___/);
      if (gapMatch) {
        const gapId = parseInt(gapMatch[1]);
        const gap = gaps?.find(g => g.id === gapId);
        const userAnswer = answers[gapId] || '';
        const correctAnswer = gap?.answer || '';

        return (
          <span key={index} className="inline-flex items-center space-x-2">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => handleGapChange(gapId, e.target.value)}
              disabled={disabled}
              className={`inline-block min-w-[120px] border rounded-md px-2 py-1 text-sm ${
                showCorrectAnswer
                  ? userAnswer === correctAnswer
                    ? 'border-green-300 bg-theme-bg-success text-theme-interactive-success'
                    : 'border-red-300 bg-theme-bg-danger text-theme-interactive-danger'
                  : 'border-theme-border-primary focus:ring-theme-interactive-primary focus:border-theme-interactive-primary'
              }`}
              placeholder={`Gap ${gapId}`}
            />
            {showCorrectAnswer && (
              <span className="text-xs text-theme-text-tertiary">
                ({correctAnswer})
              </span>
            )}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getCorrectAnswersCount = () => {
    if (!gaps) return 0;
    return gaps.filter(gap => answers[gap.id] === gap.answer).length;
  };

  const getTotalGaps = () => gaps?.length || 0;

  return (
    <div className="fill-gap-question">
      {/* Question Text with Gaps */}
      <div className="space-y-4">
        <div className="p-4 border border-theme-border-primary rounded-lg bg-theme-bg-primary">
          <div className="text-base text-theme-text-primary leading-relaxed">
            {renderTextWithGaps()}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-theme-text-secondary">
        <p>Fill in each blank with the appropriate word or phrase.</p>
      </div>

      {/* Progress Indicator */}
      {getTotalGaps() > 0 && (
        <div className="mt-4 p-3 bg-theme-bg-secondary border border-theme-border-primary rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-theme-text-secondary">Progress</span>
            <span className="text-sm text-theme-text-secondary">
              {Object.keys(answers).length} of {getTotalGaps()} gaps filled
            </span>
          </div>
          <div className="mt-2 w-full bg-theme-bg-tertiary rounded-full h-2">
            <div 
              className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(Object.keys(answers).length / getTotalGaps()) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Answer Summary */}
      {showCorrectAnswer && gaps && gaps.length > 0 && (
        <div className="mt-6 p-4 bg-theme-bg-success border border-green-200 rounded-md">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-theme-interactive-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-theme-interactive-success">Correct Answers</p>
              <div className="mt-2 space-y-1">
                {gaps.map((gap) => (
                  <div key={gap.id} className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-green-700">Gap {gap.id}:</span>
                    <span className="text-theme-interactive-success">{gap.answer}</span>
                    {answers[gap.id] === gap.answer && (
                      <svg className="w-4 h-4 text-theme-interactive-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm text-green-700">
                  You got {getCorrectAnswersCount()} out of {getTotalGaps()} gaps correct.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Answer Review */}
      {showCorrectAnswer && Object.keys(answers).length > 0 && (
        <div className="mt-4 p-4 bg-theme-bg-info border border-theme-border-info rounded-md">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-theme-interactive-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-theme-interactive-info">Your Answers</p>
              <div className="mt-2 space-y-1">
                {Object.entries(answers).map(([gapId, answer]) => {
                  const gap = gaps?.find(g => g.id === parseInt(gapId));
                  const isCorrect = gap && answer === gap.answer;
                  return (
                    <div key={gapId} className="flex items-center space-x-2 text-sm">
                      <span className="font-medium text-theme-interactive-primary">Gap {gapId}:</span>
                      <span className={isCorrect ? 'text-theme-interactive-success' : 'text-theme-interactive-danger'}>
                        {answer || '(empty)'}
                      </span>
                      {isCorrect ? (
                        <svg className="w-4 h-4 text-theme-interactive-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-theme-interactive-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FillGapQuestion; 