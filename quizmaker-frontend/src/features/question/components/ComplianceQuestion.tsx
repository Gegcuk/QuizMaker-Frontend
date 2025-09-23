// ---------------------------------------------------------------------------
// ComplianceQuestion.tsx - Compliance question display
// Based on ComplianceContent from API documentation
// ---------------------------------------------------------------------------

import React from 'react';
import { QuestionDto, ComplianceContent, ComplianceStatement } from '@/types';

interface ComplianceQuestionProps {
  question: QuestionDto;
  onAnswerChange?: (selectedIds: number[]) => void;
  currentAnswer?: number[];
  showCorrectAnswer?: boolean;
  disabled?: boolean;
}

const ComplianceQuestion: React.FC<ComplianceQuestionProps> = ({
  question,
  onAnswerChange,
  currentAnswer = [],
  showCorrectAnswer = false,
  disabled = false
}) => {
  const content = question.content as ComplianceContent;
  const statements = content?.statements || [];

  const handleStatementToggle = (statementId: number) => {
    if (disabled) return;
    
    const newSelection = currentAnswer.includes(statementId)
      ? currentAnswer.filter(id => id !== statementId)
      : [...currentAnswer, statementId];
    
    onAnswerChange?.(newSelection);
  };

  const getStatementStatus = (statement: ComplianceStatement) => {
    if (!showCorrectAnswer) return 'normal';
    
    const isSelected = currentAnswer.includes(statement.id);
    if (statement.compliant) return 'correct';
    if (isSelected && !statement.compliant) return 'incorrect';
    return 'normal';
  };

  const getCorrectAnswersCount = () => {
    return statements.filter(statement => 
      statement.compliant && currentAnswer.includes(statement.id)
    ).length;
  };

  const getIncorrectAnswersCount = () => {
    return currentAnswer.filter(id => 
      !statements.find(s => s.id === id)?.compliant
    ).length;
  };

  const getTotalCompliant = () => {
    return statements.filter(s => s.compliant).length;
  };

  return (
    <div className="compliance-question">
      <div className="space-y-4">
        {statements.map((statement) => {
          const status = getStatementStatus(statement);
          const isSelected = currentAnswer.includes(statement.id);
          
          return (
            <div
              key={statement.id}
              className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${
                status === 'correct'
                  ? 'border-green-300 bg-green-50'
                  : status === 'incorrect'
                  ? 'border-red-300 bg-red-50'
                  : isSelected
                  ? 'border-theme-interactive-primary bg-indigo-50'
                  : 'border-theme-border-primary bg-theme-bg-primary hover:border-theme-border-secondary'
              } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => handleStatementToggle(statement.id)}
            >
              {/* Statement Number */}
              <div className="flex-shrink-0 mt-1">
                <span className={`inline-flex items-center justify-center w-6 h-6 text-sm font-medium rounded-full ${
                  status === 'correct'
                    ? 'bg-green-500 text-white'
                    : status === 'incorrect'
                    ? 'bg-red-500 text-white'
                    : isSelected
                    ? 'bg-indigo-500 text-white'
                    : 'bg-theme-bg-tertiary text-theme-text-secondary'
                }`}>
                  {statement.id}
                </span>
              </div>

              {/* Checkbox */}
              <div className="flex-shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleStatementToggle(statement.id)}
                  disabled={disabled}
                  className={`h-4 w-4 rounded ${
                    status === 'correct'
                      ? 'text-green-600 focus:ring-green-500 border-green-300'
                      : status === 'incorrect'
                      ? 'text-theme-interactive-danger focus:ring-theme-interactive-danger border-theme-border-primary'
                      : 'text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary'
                  }`}
                />
              </div>

              {/* Statement Text */}
              <div className="flex-1">
                <div 
                  className={`text-sm ${
                    status === 'correct' ? 'text-green-800' :
                    status === 'incorrect' ? 'text-red-800' :
                    'text-theme-text-primary'
                  }`}
                  dangerouslySetInnerHTML={{ __html: statement.text }}
                />
              </div>

              {/* Status Icons */}
              {showCorrectAnswer && (
                <div className="flex-shrink-0 mt-1">
                  {status === 'correct' && (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {status === 'incorrect' && (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-theme-text-secondary">
        <p>Check the statements that are compliant with the requirements.</p>
      </div>

      {/* Progress Summary */}
      {statements.length > 0 && (
        <div className="mt-4 p-3 bg-theme-bg-secondary border border-theme-border-primary rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-theme-text-secondary">Selection Summary</span>
            <span className="text-sm text-theme-text-secondary">
              {currentAnswer.length} of {statements.length} statements selected
            </span>
          </div>
          <div className="mt-2 w-full bg-theme-bg-tertiary rounded-full h-2">
            <div 
              className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentAnswer.length / statements.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Answer Summary */}
      {showCorrectAnswer && statements.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">Compliance Analysis</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-green-700">Correctly identified compliant statements:</span>
                  <span className="font-medium text-green-800">{getCorrectAnswersCount()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-red-700">Incorrectly selected non-compliant statements:</span>
                  <span className="font-medium text-red-800">{getIncorrectAnswersCount()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-theme-interactive-primary">Total compliant statements:</span>
                  <span className="font-medium text-blue-800">{getTotalCompliant()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Correct Answers */}
      {showCorrectAnswer && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-theme-interactive-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">Compliant Statements</p>
              <div className="mt-2 space-y-1">
                {statements.filter(s => s.compliant).map((statement) => (
                  <div key={statement.id} className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-theme-interactive-primary">{statement.id}.</span>
                    <span className="text-blue-800">{statement.text}</span>
                    {currentAnswer.includes(statement.id) && (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceQuestion; 