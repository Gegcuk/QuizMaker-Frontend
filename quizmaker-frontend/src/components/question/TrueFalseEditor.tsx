// ---------------------------------------------------------------------------
// TrueFalseEditor.tsx - True/False question editor
// Based on TrueFalseContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { TrueFalseContent } from '../../types/question.types';

interface TrueFalseEditorProps {
  content: TrueFalseContent;
  onChange: (content: TrueFalseContent) => void;
  className?: string;
}

const TrueFalseEditor: React.FC<TrueFalseEditorProps> = ({
  content,
  onChange,
  className = ''
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
        <div>
          <h4 className="text-lg font-medium text-gray-900">True/False Question</h4>
          <p className="text-sm text-gray-500">Select the correct answer</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Correct Answer: <span className="font-medium">{answer ? 'True' : 'False'}</span>
          </span>
        </div>
      </div>

      {/* Answer Selection */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg bg-white">
            <input
              type="radio"
              name="true-false-answer"
              id="true-option"
              checked={answer === true}
              onChange={() => setAnswer(true)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <label htmlFor="true-option" className="flex items-center space-x-3 cursor-pointer">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-lg font-medium text-gray-900">True</span>
            </label>
          </div>

          <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg bg-white">
            <input
              type="radio"
              name="true-false-answer"
              id="false-option"
              checked={answer === false}
              onChange={() => setAnswer(false)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <label htmlFor="false-option" className="flex items-center space-x-3 cursor-pointer">
              <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-lg font-medium text-gray-900">False</span>
            </label>
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
                <li>Select whether the statement is True or False</li>
                <li>Only one answer can be correct</li>
                <li>The selected answer will be marked as correct</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Preview</h5>
        <div className="text-sm text-gray-600">
          <p>Students will see:</p>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <input type="radio" disabled className="h-4 w-4 text-gray-400" />
              <span>True</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="radio" disabled className="h-4 w-4 text-gray-400" />
              <span>False</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrueFalseEditor; 