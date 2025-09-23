// src/components/attempt/ComplianceAnswer.tsx
// ---------------------------------------------------------------------------
// Component for compliance question answers
// Handles statement selection for compliance checking
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionForAttemptDto } from '@/types';

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
  const normalize = (val: any): number[] => Array.isArray(val) ? val : [];
  const [selectedStatements, setSelectedStatements] = useState<number[]>(normalize(currentAnswer));

  useEffect(() => {
    setSelectedStatements(normalize(currentAnswer));
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
      <div className={`p-4 bg-theme-bg-secondary border border-theme-border-primary rounded-md ${className}`}>
        <div className="text-theme-text-tertiary text-center">No statements available</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      <div className="text-sm text-theme-text-secondary mb-4">
        Select all statements that are compliant with the given criteria:
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-theme-text-secondary">
          {selectedStatements.length} of {statements.length} statements selected
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled}
            className="text-xs text-theme-interactive-primary hover:text-theme-interactive-primary disabled:opacity-50"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled}
            className="text-xs text-theme-text-secondary hover:text-theme-text-secondary disabled:opacity-50"
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
                  ? 'border-theme-border-success bg-theme-bg-success'
                  : 'border-theme-border-primary hover:border-theme-border-primary hover:bg-theme-bg-secondary'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleStatementToggle(statement.id)}
                disabled={disabled}
                className="mt-1 rounded border-theme-border-primary text-theme-interactive-success focus:ring-theme-interactive-success focus:ring-2"
              />
              
              <div className="ml-3 flex-1">
                <div className="flex items-start">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-theme-text-secondary bg-theme-bg-tertiary rounded-full mr-3 flex-shrink-0">
                    {statementNumber}
                  </span>
                  <div className="text-theme-text-primary">
                    {statement.text}
                  </div>
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="ml-2 text-theme-interactive-success">
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
      <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
        <div
          className="bg-theme-bg-success0 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(selectedStatements.length / statements.length) * 100}%` }}
        />
      </div>

      {/* Selection Summary */}
      {selectedStatements.length > 0 && (
        <div className="p-3 bg-theme-bg-success border border-theme-border-success rounded-md">
          <div className="text-sm text-theme-interactive-success">
            <strong>Selected Statements:</strong> {selectedStatements.length} of {statements.length}
          </div>
          <div className="text-xs text-theme-interactive-success mt-1">
            Statements: {selectedStatements.map(id => id).join(', ')}
          </div>
        </div>
      )}

      {/* No Selection Warning */}
      {selectedStatements.length === 0 && (
        <div className="p-3 bg-theme-bg-tertiary border border-theme-border-primary rounded-md">
          <div className="text-sm text-theme-text-secondary">
            Please select at least one compliant statement to continue.
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 bg-theme-bg-info border border-theme-border-info rounded-md">
        <div className="text-sm text-theme-interactive-primary">
          <strong>Instructions:</strong> Review each statement carefully and select all that comply with the requirements or criteria mentioned in the question.
        </div>
      </div>

      {/* Tips */}
      <div className="p-3 bg-theme-bg-secondary border border-theme-border-primary rounded-md">
        <div className="text-sm text-theme-text-secondary">
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
