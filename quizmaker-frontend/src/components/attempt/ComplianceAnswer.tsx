// src/components/attempt/ComplianceAnswer.tsx
// ---------------------------------------------------------------------------
// Component for compliance question answers
// Handles statement selection for compliance checking
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionForAttemptDto } from '../../types/attempt.types';

interface ComplianceAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer?: number[];
  onAnswerChange: (answer: number[]) => void;
  disabled?: boolean;
  className?: string;
}

interface ComplianceStatement {
  id: number;
  text: string;
}

const ComplianceAnswer: React.FC<ComplianceAnswerProps> = ({
  question,
  currentAnswer = [],
  onAnswerChange,
  disabled = false,
  className = ''
}) => {
  const [selectedStatements, setSelectedStatements] = useState<number[]>(currentAnswer);

  useEffect(() => {
    setSelectedStatements(currentAnswer);
  }, [currentAnswer]);

  const handleStatementToggle = (statementId: number) => {
    const newSelection = selectedStatements.includes(statementId)
      ? selectedStatements.filter(id => id !== statementId)
      : [...selectedStatements, statementId];
    
    setSelectedStatements(newSelection);
    onAnswerChange(newSelection);
  };

  const handleSelectAll = () => {
    const allStatementIds = (question.safeContent?.statements || []).map((stmt: ComplianceStatement) => stmt.id);
    setSelectedStatements(allStatementIds);
    onAnswerChange(allStatementIds);
  };

  const handleClearAll = () => {
    setSelectedStatements([]);
    onAnswerChange([]);
  };

  // Extract statements from safe content
  const statements: ComplianceStatement[] = question.safeContent?.statements || [];

  if (statements.length === 0) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-md ${className}`}>
        <div className="text-gray-500 text-center">No statements available</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      <div className="text-sm text-gray-600 mb-4">
        Select all statements that are compliant with the given criteria:
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedStatements.length} of {statements.length} statements selected
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled}
            className="text-xs text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled}
            className="text-xs text-gray-600 hover:text-gray-700 disabled:opacity-50"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Statements */}
      <div className="space-y-3">
        {statements.map((statement, index) => {
          const isSelected = selectedStatements.includes(statement.id);
          const statementNumber = index + 1;

          return (
            <label
              key={statement.id}
              className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleStatementToggle(statement.id)}
                disabled={disabled}
                className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2"
              />
              
              <div className="ml-3 flex-1">
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-gray-600 bg-gray-100 rounded-full mr-3 flex-shrink-0">
                    {statementNumber}
                  </span>
                  <div className="text-gray-900">
                    {statement.text}
                  </div>
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="ml-2 text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </label>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(selectedStatements.length / statements.length) * 100}%` }}
        />
      </div>

      {/* Selection Summary */}
      {selectedStatements.length > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="text-sm text-green-700">
            <strong>Selected Statements:</strong> {selectedStatements.length} of {statements.length}
          </div>
          <div className="text-xs text-green-600 mt-1">
            Statements: {selectedStatements.map(id => id).join(', ')}
          </div>
        </div>
      )}

      {/* No Selection Warning */}
      {selectedStatements.length === 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-sm text-yellow-700">
            Please select at least one compliant statement to continue.
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-sm text-blue-700">
          <strong>Instructions:</strong> Review each statement carefully and select all that comply with the requirements or criteria mentioned in the question.
        </div>
      </div>

      {/* Tips */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="text-sm text-gray-700">
          <strong>Tips:</strong>
          <ul className="mt-1 ml-4 list-disc">
            <li>Read each statement thoroughly</li>
            <li>Consider the specific criteria mentioned</li>
            <li>You can select multiple statements if they all apply</li>
            <li>Don't select statements that don't meet the requirements</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ComplianceAnswer; 