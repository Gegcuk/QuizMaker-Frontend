// ---------------------------------------------------------------------------
// ComplianceEditor.tsx - Compliance question editor
// Based on ComplianceContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { ComplianceContent, ComplianceStatement } from '../../types/question.types';

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
          <h4 className="text-lg font-medium text-gray-900">Compliance Question</h4>
          <p className="text-sm text-gray-500">Identify compliant and non-compliant statements</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {statements.length} statement{statements.length !== 1 ? 's' : ''}
          </span>
          {getEmptyStatements().length > 0 && (
            <span className="text-xs text-red-500">
              {getEmptyStatements().length} empty statement{getEmptyStatements().length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Statements */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-gray-700">Statements</h5>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>{getCompliantCount()} Compliant</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span>{getNonCompliantCount()} Non-compliant</span>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {statements.map((statement) => (
              <div key={statement.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg bg-white">
                {/* Statement Number */}
                <div className="flex-shrink-0 mt-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-gray-700 bg-gray-100 rounded-full">
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
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <label htmlFor={`compliant-${statement.id}`} className="text-sm text-green-700 font-medium">
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
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <label htmlFor={`non-compliant-${statement.id}`} className="text-sm text-red-700 font-medium">
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
                    className="text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded"
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
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Instructions</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Write statements that students need to evaluate</li>
                <li>Mark each statement as Compliant or Non-compliant</li>
                <li>Students will identify which statements are compliant</li>
                <li>Minimum 2 statements required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Preview</h5>
          <div className="text-sm text-gray-600">
            <p>Students will see:</p>
            <div className="mt-2 space-y-2">
              {statements.map((statement) => (
                <div key={statement.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded bg-white">
                  <input
                    type="checkbox"
                    disabled
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                  />
                  <span className="text-sm">
                    {statement.text || `Statement ${statement.id}`}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Students will check the statements they believe are compliant.
            </p>
          </div>
        </div>
      )}

      {/* Compliance Summary */}
      {statements.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h5 className="text-sm font-medium text-green-800 mb-2">Compliance Summary</h5>
          <div className="text-sm text-green-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h6 className="font-medium text-green-800">Compliant Statements:</h6>
                <div className="mt-1 space-y-1">
                  {statements.filter(s => s.compliant).map((statement) => (
                    <div key={statement.id} className="flex items-center space-x-2">
                      <span className="font-medium">{statement.id}.</span>
                      <span className={statement.text ? 'text-green-800' : 'text-red-600'}>
                        {statement.text || 'No text provided'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h6 className="font-medium text-red-800">Non-compliant Statements:</h6>
                <div className="mt-1 space-y-1">
                  {statements.filter(s => !s.compliant).map((statement) => (
                    <div key={statement.id} className="flex items-center space-x-2">
                      <span className="font-medium">{statement.id}.</span>
                      <span className={statement.text ? 'text-red-800' : 'text-red-600'}>
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
