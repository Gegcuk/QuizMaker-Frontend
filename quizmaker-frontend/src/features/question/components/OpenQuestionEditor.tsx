// ---------------------------------------------------------------------------
// OpenQuestionEditor.tsx - Open-ended question editor
// Based on OpenContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { OpenContent } from '@/types';
import { InstructionsModal } from '@/components';
// No specific content types - API uses JsonNode

interface OpenQuestionEditorProps {
  content: OpenContent;
  onChange: (content: OpenContent) => void;
  className?: string;
  showPreview?: boolean;
}

const OpenQuestionEditor: React.FC<OpenQuestionEditorProps> = ({
  content,
  onChange,
  className = '',
  showPreview = true
}) => {
  const [modelAnswer, setModelAnswer] = useState<string>(content.answer || '');

  // Update parent when model answer changes
  useEffect(() => {
    onChange({ answer: modelAnswer });
  }, [modelAnswer, onChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium text-theme-text-primary">Open-Ended Question</h4>
          <p className="text-sm text-theme-text-tertiary">Provide a model answer for grading</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-theme-text-tertiary">
            Model Answer: {modelAnswer ? 'Provided' : 'Not provided'}
          </span>
          {!modelAnswer && (
            <span className="text-xs text-theme-text-danger">Model answer required</span>
          )}
        </div>
      </div>

      {/* Model Answer Input */}
      <div className="bg-theme-bg-secondary rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="model-answer" className="block text-sm font-medium text-theme-text-secondary mb-2">
              Model Answer <span className="text-theme-text-danger">*</span>
            </label>
            <textarea
              id="model-answer"
              value={modelAnswer}
              onChange={(e) => setModelAnswer(e.target.value)}
              placeholder="Enter the model answer that students should provide..."
              className="block w-full border-theme-border-primary rounded-md shadow-sm bg-theme-bg-primary text-theme-text-primary focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm resize-none bg-theme-bg-primary text-theme-text-primary"
              rows={6}
              required
            />
            <p className="mt-1 text-sm text-theme-text-tertiary">
              This answer will be used for grading and comparison with student responses.
            </p>
          </div>

          {/* Answer Guidelines */}
          <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-md p-4 bg-theme-bg-primary text-theme-text-primary">
            <h5 className="text-sm font-medium text-theme-text-primary mb-2">Answer Guidelines</h5>
            <div className="text-sm text-theme-text-secondary space-y-1">
              <p>Consider including:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Key points that should be mentioned</li>
                <li>Expected length or detail level</li>
                <li>Specific terminology or concepts</li>
                <li>Examples or explanations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <InstructionsModal title="Instructions">
        <ul className="list-disc list-inside space-y-1">
          <li>Provide a comprehensive model answer</li>
          <li>Include all key points students should mention</li>
          <li>Consider different acceptable variations</li>
          <li>Use clear and specific language</li>
        </ul>
      </InstructionsModal>

      {showPreview && (
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-4 bg-theme-bg-primary text-theme-text-primary">
          <h5 className="text-sm font-medium text-theme-text-secondary mb-2">Preview</h5>
          <div className="text-sm text-theme-text-secondary">
            <p>Students will see:</p>
            <div className="mt-2">
              <textarea
                placeholder="Enter your answer here..."
                disabled
                className="block w-full border-theme-border-primary rounded-md shadow-sm bg-theme-bg-tertiary text-theme-text-tertiary sm:text-sm resize-none bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                rows={4}
              />
            </div>
            <p className="mt-2 text-xs text-theme-text-tertiary">
              Students will provide free-text answers that can be compared against your model answer.
            </p>
          </div>
        </div>
      )}

      {/* Grading Information */}
      <div className="bg-theme-bg-tertiary border border-theme-border-primary rounded-md p-4 bg-theme-bg-primary text-theme-text-primary">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-theme-text-tertiary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-theme-text-primary">Grading Note</h3>
            <div className="mt-2 text-sm text-theme-text-secondary">
              <p>
                Open-ended questions typically require manual grading or AI-powered assessment. 
                The model answer serves as a reference for grading criteria.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenQuestionEditor; 
