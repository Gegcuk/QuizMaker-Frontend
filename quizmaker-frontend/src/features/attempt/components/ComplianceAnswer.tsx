// src/components/attempt/ComplianceAnswer.tsx
// ---------------------------------------------------------------------------
// Component for compliance question answers
// Handles statement selection for compliance checking
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionForAttemptDto } from '@/types';
import { Button } from '@/components';

interface ComplianceAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer?: number[];
  onAnswerChange: (answer: number[]) => void;
  disabled?: boolean;
  className?: string;
  showFeedback?: boolean;
  isCorrect?: boolean;
  correctAnswer?: any;
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
  className = '',
  showFeedback = false,
  isCorrect,
  correctAnswer
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
          {selectedStatements.length} statement{selectedStatements.length !== 1 ? 's' : ''} selected
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled}
            variant="ghost"
            size="sm"
            className="!text-xs !p-1 !min-w-0"
          >
            Select All
          </Button>
          <Button
            type="button"
            onClick={handleClearAll}
            disabled={disabled}
            variant="ghost"
            size="sm"
            className="!text-xs !p-1 !min-w-0"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Statements */}
      <div className="space-y-3">
        {statements.map((statement, index) => {
          const isSelected = selectedStatements.includes(statement.id);
          const statementNumber = index + 1;

          // Determine if this statement should be selected (correct answer)
          let isCorrectStatement = false;
          if (showFeedback && correctAnswer && Array.isArray(correctAnswer.compliantIds)) {
            isCorrectStatement = correctAnswer.compliantIds.includes(statement.id);
          }

          // Get styling based on feedback
          let borderColor = 'border-theme-border-primary';
          let bgColor = 'bg-transparent';
          if (showFeedback && isCorrect !== undefined) {
            if (isCorrect && isSelected) {
              // User selected correct statement
              borderColor = 'border-theme-interactive-success';
              bgColor = 'bg-theme-bg-success';
            } else if (!isCorrect && isSelected && !isCorrectStatement) {
              // User selected incorrect statement
              borderColor = 'border-theme-interactive-danger';
              bgColor = 'bg-theme-bg-danger';
            } else if (!isCorrect && isCorrectStatement) {
              // Correct statement (shown when user was wrong)
              borderColor = 'border-theme-interactive-primary';
              bgColor = 'bg-theme-bg-info';
            }
          } else if (isSelected) {
            // Normal selection (no feedback yet)
            borderColor = 'border-theme-interactive-primary';
            bgColor = 'bg-theme-bg-tertiary';
          }

          return (
            <label
              key={statement.id}
              className={`flex items-start p-4 border-2 rounded-lg transition-colors ${
                disabled 
                  ? 'opacity-70 cursor-not-allowed' 
                  : `cursor-pointer ${isSelected ? '' : 'hover:border-theme-border-secondary'}`
              } ${borderColor} ${bgColor}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleStatementToggle(statement.id)}
                disabled={disabled}
                className="mt-1 rounded border-theme-border-primary text-theme-interactive-primary focus:ring-theme-interactive-primary focus:ring-2 bg-theme-bg-primary"
              />
              
              <div className="ml-3 flex-1">
                <div className="flex items-start">
                  <span className={`inline-flex items-center justify-center w-6 h-6 text-sm font-medium rounded-full mr-3 flex-shrink-0 ${
                    showFeedback && isCorrectStatement 
                      ? 'text-theme-text-primary bg-theme-bg-info' 
                      : 'text-theme-text-secondary bg-theme-bg-tertiary'
                  }`}>
                    {statementNumber}
                  </span>
                  <div className="text-theme-text-primary">
                    {statement.text}
                  </div>
                  {showFeedback && isCorrectStatement && (
                    <span className="ml-2 text-theme-interactive-success">✓</span>
                  )}
                  {showFeedback && !isCorrect && isSelected && !isCorrectStatement && (
                    <span className="ml-2 text-theme-interactive-danger">✗</span>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedStatements.length > 0 && (
        <div className="p-3 bg-theme-bg-tertiary border border-theme-border-primary rounded-md">
          <div className="text-sm text-theme-text-primary">
            <strong>Selected:</strong> {selectedStatements.length} statement{selectedStatements.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

    </div>
  );
};

export default ComplianceAnswer; 

