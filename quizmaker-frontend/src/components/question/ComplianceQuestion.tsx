// ---------------------------------------------------------------------------
// ComplianceQuestion.tsx - Compliance question display
// Based on ComplianceContent from API documentation
// ---------------------------------------------------------------------------

import React from 'react';
import { QuestionDto, ComplianceContent, ComplianceStatement } from '../../types/question.types';

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
  const statements = content.statements || [];

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
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
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
                    : 'bg-gray-100 text-gray-700'
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
                      ? 'text-red-600 focus:ring-red-500 border-red-300'
                      : 'text-indigo-600 focus:ring-indigo-500 border-gray-300'
                  }`}
                />
              </div>

              {/* Statement Text */}
              <div className="flex-1">
                <div 
                  className={`text-sm ${
                    status === 'correct' ? 'text-green-800' :
                    status === 'incorrect' ? 'text-red-800' :
                    'text-gray-900'
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
      <div className="mt-4 text-sm text-gray-600">
        <p>Check the statements that are compliant with the requirements.</p>
      </div>

      {/* Progress Summary */}
      {statements.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Selection Summary</span>
            <span className="text-sm text-gray-600">
              {currentAnswer.length} of {statements.length} statements selected
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
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
                  <span className="text-blue-700">Total compliant statements:</span>
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
            <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">Compliant Statements</p>
              <div className="mt-2 space-y-1">
                {statements.filter(s => s.compliant).map((statement) => (
                  <div key={statement.id} className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-blue-700">{statement.id}.</span>
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