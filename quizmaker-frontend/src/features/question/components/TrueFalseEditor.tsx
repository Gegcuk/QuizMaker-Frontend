// ---------------------------------------------------------------------------
// TrueFalseEditor.tsx - True/False question editor
// Based on TrueFalseContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { TrueFalseContent } from '@/types';
import { InstructionsModal } from '@/components';
// No specific content types - API uses JsonNode

interface TrueFalseEditorProps {
  content: TrueFalseContent;
  onChange: (content: TrueFalseContent) => void;
  className?: string;
  showPreview?: boolean;
}

const TrueFalseEditor: React.FC<TrueFalseEditorProps> = ({
  content,
  onChange,
  className = '',
  showPreview = true
}) => {
  const [answer, setAnswer] = useState<boolean>(content.answer ?? true);

  // Update parent when answer changes
  useEffect(() => {
    onChange({ answer });
  }, [answer, onChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-theme-text-tertiary">Select the correct answer</p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-theme-text-tertiary">
            Correct Answer: <span className="font-medium">{answer ? 'True' : 'False'}</span>
          </span>
        </div>
      </div>

      {/* Answer Selection */}
      <div className="bg-theme-bg-secondary rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 border border-theme-border-primary rounded-lg bg-theme-bg-primary bg-theme-bg-primary text-theme-text-primary">
            <input
              type="radio"
              name="true-false-answer"
              id="true-option"
              checked={answer === true}
              onChange={() => setAnswer(true)}
              className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
            />
            <label htmlFor="true-option" className="flex items-center space-x-3 cursor-pointer">
              <div className="flex items-center justify-center w-8 h-8 bg-theme-bg-tertiary rounded-full">
                <svg className="w-5 h-5 text-theme-interactive-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-lg font-medium text-theme-text-primary">True</span>
            </label>
          </div>

          <div className="flex items-center space-x-3 p-4 border border-theme-border-primary rounded-lg bg-theme-bg-primary bg-theme-bg-primary text-theme-text-primary">
            <input
              type="radio"
              name="true-false-answer"
              id="false-option"
              checked={answer === false}
              onChange={() => setAnswer(false)}
              className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
            />
            <label htmlFor="false-option" className="flex items-center space-x-3 cursor-pointer">
              <div className="flex items-center justify-center w-8 h-8 bg-theme-bg-tertiary rounded-full">
                <svg className="w-5 h-5 text-theme-interactive-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-lg font-medium text-theme-text-primary">False</span>
            </label>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <InstructionsModal title="Instructions">
        <ul className="list-disc list-inside space-y-1">
          <li>Select whether the statement is True or False</li>
          <li>Only one answer can be correct</li>
          <li>The selected answer will be marked as correct</li>
        </ul>
      </InstructionsModal>

      {showPreview && (
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-4 bg-theme-bg-primary text-theme-text-primary">
          <h5 className="text-sm font-medium text-theme-text-secondary mb-2">Preview</h5>
          <div className="text-sm text-theme-text-secondary">
            <p>How it will appear:</p>
            <div className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <input type="radio" disabled className="h-4 w-4 text-theme-text-tertiary" />
                <span>True</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" disabled className="h-4 w-4 text-theme-text-tertiary" />
                <span>False</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrueFalseEditor; 
