// ---------------------------------------------------------------------------
// ComplianceEditor.tsx - Compliance question editor
// Based on ComplianceContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { ComplianceContent, ComplianceStatement } from '@/types';
import { InstructionsModal, AddItemButton, QuestionPreviewSection, ItemManagementContainer } from '@/components';

interface ComplianceEditorProps {
  content: ComplianceContent;
  onChange: (content: ComplianceContent) => void;
  className?: string;
  showPreview?: boolean;
}

const ComplianceEditor: React.FC<ComplianceEditorProps> = ({
  content,
  onChange,
  className = '',
  showPreview = true
}) => {
  const [statements, setStatements] = useState<ComplianceStatement[]>(
    content.statements || [
      { id: 1, text: '', compliant: true },
      { id: 2, text: '', compliant: false }
    ]
  );

  // Update parent when statements change
  useEffect(() => {
    onChange({ statements });
  }, [statements, onChange]);

  // Auto-resize all textareas on mount and when statements change
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea[data-compliance-statement]');
    textareas.forEach((textarea) => {
      const element = textarea as HTMLTextAreaElement;
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    });
  }, [statements]);

  const addStatement = () => {
    const newId = statements.length + 1;
    setStatements(prev => [...prev, { id: newId, text: '', compliant: true }]);
  };

  const removeStatement = (id: number) => {
    if (statements.length <= 2) return; // Minimum 2 statements required
    setStatements(prev => prev.filter(statement => statement.id !== id));
  };

  const updateStatementText = (id: number, text: string) => {
    setStatements(prev => prev.map(statement => 
      statement.id === id ? { ...statement, text } : statement
    ));
  };

  const updateStatementCompliance = (id: number, compliant: boolean) => {
    setStatements(prev => prev.map(statement => 
      statement.id === id ? { ...statement, compliant } : statement
    ));
  };

  const getCompliantCount = () => statements.filter(s => s.compliant).length;
  const getNonCompliantCount = () => statements.filter(s => !s.compliant).length;
  const getEmptyStatements = () => statements.filter(s => !s.text.trim());

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-theme-text-tertiary">Identify compliant and non-compliant statements</p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-theme-text-tertiary">
            {statements.length} statement{statements.length !== 1 ? 's' : ''}
          </span>
          {getEmptyStatements().length > 0 && (
            <span className="text-xs text-theme-text-danger">
              {getEmptyStatements().length} empty statement{getEmptyStatements().length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Statements */}
      <ItemManagementContainer
        title="Statements"
        helperText={`${getCompliantCount()} Compliant • ${getNonCompliantCount()} Non-compliant`}
      >
        {statements.map((statement) => (
          <div key={statement.id} className="p-4 border border-theme-border-primary rounded-lg bg-theme-bg-primary bg-theme-bg-primary text-theme-text-primary space-y-3">
            {/* Statement Text */}
            <div className="flex-1">
              <textarea
                data-compliance-statement
                value={statement.text}
                onChange={(e) => {
                  updateStatementText(statement.id, e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder="Enter statement text..."
                className="block w-full border border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm resize-none overflow-hidden bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                rows={1}
                style={{ minHeight: '38px' }}
              />
            </div>

            {/* Compliance Toggle + Delete Button */}
            <div className="flex items-center justify-between pl-1">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`compliance-${statement.id}`}
                    id={`compliant-${statement.id}`}
                    checked={statement.compliant}
                    onChange={() => updateStatementCompliance(statement.id, true)}
                    className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                  />
                  <label htmlFor={`compliant-${statement.id}`} className="text-sm text-theme-text-secondary font-medium cursor-pointer">
                    Compliant
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`compliance-${statement.id}`}
                    id={`non-compliant-${statement.id}`}
                    checked={!statement.compliant}
                    onChange={() => updateStatementCompliance(statement.id, false)}
                    className="h-4 w-4 text-theme-interactive-danger focus:ring-theme-interactive-danger border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                  />
                  <label htmlFor={`non-compliant-${statement.id}`} className="text-sm text-theme-text-secondary font-medium cursor-pointer">
                    Non-compliant
                  </label>
                </div>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeStatement(statement.id)}
                disabled={statements.length <= 2}
                className="text-theme-text-danger hover:text-theme-text-danger disabled:text-theme-text-tertiary disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-danger rounded"
                title="Remove statement"
                aria-label={`Remove statement ${statement.id}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        <AddItemButton onClick={addStatement} itemType="Statement" />
      </ItemManagementContainer>

      {/* Instructions */}
      <InstructionsModal title="Instructions">
        <ul className="list-disc list-inside space-y-1">
          <li>Write statements to evaluate</li>
          <li>Mark each statement as Compliant or Non-compliant</li>
          <li>Minimum 2 statements required</li>
        </ul>
      </InstructionsModal>

      <QuestionPreviewSection showPreview={showPreview}>
        <p>How it will appear:</p>
        <div className="mt-2 space-y-2">
          {statements.map((statement) => (
            <div key={statement.id} className="flex items-start space-x-3 p-3 border border-theme-border-primary rounded bg-theme-bg-primary bg-theme-bg-primary text-theme-text-primary">
              <input
                type="checkbox"
                disabled
                className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded mt-1 bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary rounded-md"
              />
              <span className="text-sm">
                {statement.text || `Statement ${statement.id}`}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-theme-text-tertiary">
          Check the statements that are compliant.
        </p>
      </QuestionPreviewSection>

      {/* Compliance Summary */}
      {statements.length > 0 && (
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-md p-4 bg-theme-bg-primary text-theme-text-primary">
          <h5 className="text-sm font-medium text-theme-text-primary mb-2">Compliance Summary</h5>
          <div className="text-sm text-theme-text-secondary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h6 className="font-medium text-theme-text-primary">Compliant Statements:</h6>
                <div className="mt-1 space-y-1">
                  {statements.filter(s => s.compliant).map((statement) => (
                    <div key={statement.id} className="flex items-center space-x-2">
                      <span className="font-medium">{statement.id}.</span>
                      <span className={statement.text ? 'text-theme-text-primary' : 'text-theme-text-danger'}>
                        {statement.text || 'No text provided'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h6 className="font-medium text-theme-text-primary">Non-compliant Statements:</h6>
                <div className="mt-1 space-y-1">
                  {statements.filter(s => !s.compliant).map((statement) => (
                    <div key={statement.id} className="flex items-center space-x-2">
                      <span className="font-medium">{statement.id}.</span>
                      <span className={statement.text ? 'text-theme-text-primary' : 'text-theme-text-danger'}>
                        {statement.text || 'No text provided'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceEditor; 
