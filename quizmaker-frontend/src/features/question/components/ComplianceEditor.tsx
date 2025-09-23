// ---------------------------------------------------------------------------
// ComplianceEditor.tsx - Compliance question editor
// Based on ComplianceContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { ComplianceContent, ComplianceStatement } from '@/types';
import { InstructionsModal } from '@/components';

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
        <div>
          <h4 className="text-lg font-medium text-theme-text-primary">Compliance Question</h4>
          <p className="text-sm text-theme-text-tertiary">Identify compliant and non-compliant statements</p>
        </div>
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
      <div className="bg-theme-bg-secondary rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-theme-text-secondary">Statements</h5>
            <div className="flex items-center space-x-4 text-xs text-theme-text-tertiary">
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-theme-bg-tertiary border border-theme-border-primary rounded"></div>
                <span>{getCompliantCount()} Compliant</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-theme-bg-tertiary border border-theme-border-primary rounded"></div>
                <span>{getNonCompliantCount()} Non-compliant</span>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {statements.map((statement) => (
              <div key={statement.id} className="flex items-start space-x-3 p-4 border border-theme-border-primary rounded-lg bg-theme-bg-primary">
                {/* Statement Number */}
                <div className="flex-shrink-0 mt-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-theme-text-secondary bg-theme-bg-tertiary rounded-full">
                    {statement.id}
                  </span>
                </div>

                {/* Compliance Toggle */}
                <div className="flex-shrink-0 mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`compliance-${statement.id}`}
                      id={`compliant-${statement.id}`}
                      checked={statement.compliant}
                      onChange={() => updateStatementCompliance(statement.id, true)}
                      className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary"
                    />
                    <label htmlFor={`compliant-${statement.id}`} className="text-sm text-theme-text-secondary font-medium">
                      Compliant
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="radio"
                      name={`compliance-${statement.id}`}
                      id={`non-compliant-${statement.id}`}
                      checked={!statement.compliant}
                      onChange={() => updateStatementCompliance(statement.id, false)}
                      className="h-4 w-4 text-theme-interactive-danger focus:ring-theme-interactive-danger border-theme-border-primary"
                    />
                    <label htmlFor={`non-compliant-${statement.id}`} className="text-sm text-theme-text-secondary font-medium">
                      Non-compliant
                    </label>
                  </div>
                </div>

                {/* Statement Text */}
                <div className="flex-1">
                  <textarea
                    value={statement.text}
                    onChange={(e) => updateStatementText(statement.id, e.target.value)}
                    placeholder={`Statement ${statement.id}...`}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
                    rows={3}
                  />
                </div>

                {/* Remove Button */}
                <div className="flex-shrink-0 mt-2">
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
          </div>

          {/* Add Statement Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={addStatement}
              className="inline-flex items-center px-4 py-2 border border-theme-border-primary rounded-md shadow-sm text-sm font-medium text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Statement
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <InstructionsModal title="Instructions">
        <ul className="list-disc list-inside space-y-1">
          <li>Write statements that students need to evaluate</li>
          <li>Mark each statement as Compliant or Non-compliant</li>
          <li>Students will identify which statements are compliant</li>
          <li>Minimum 2 statements required</li>
        </ul>
      </InstructionsModal>

      {showPreview && (
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-4">
          <h5 className="text-sm font-medium text-theme-text-secondary mb-2">Preview</h5>
          <div className="text-sm text-theme-text-secondary">
            <p>Students will see:</p>
            <div className="mt-2 space-y-2">
              {statements.map((statement) => (
                <div key={statement.id} className="flex items-start space-x-3 p-3 border border-theme-border-primary rounded bg-theme-bg-primary">
                  <input
                    type="checkbox"
                    disabled
                    className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded mt-1"
                  />
                  <span className="text-sm">
                    {statement.text || `Statement ${statement.id}`}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-theme-text-tertiary">
              Students will check the statements they believe are compliant.
            </p>
          </div>
        </div>
      )}

      {/* Compliance Summary */}
      {statements.length > 0 && (
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-md p-4">
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
