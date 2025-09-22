// ---------------------------------------------------------------------------
// McqQuestionEditor.tsx - Multiple choice question editor
// Based on McqSingleContent/McqMultiContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { McqOption, McqSingleContent, McqMultiContent } from '@/types';
// No specific content types - API uses JsonNode

interface McqQuestionEditorProps {
  content: McqSingleContent | McqMultiContent;
  onChange: (content: McqSingleContent | McqMultiContent) => void;
  isMultiSelect?: boolean;
  className?: string;
}

const McqQuestionEditor: React.FC<McqQuestionEditorProps> = ({
  content,
  onChange,
  isMultiSelect = false,
  className = ''
}) => {
  const [options, setOptions] = useState<McqOption[]>(content.options || [
    { id: 'a', text: '', correct: false },
    { id: 'b', text: '', correct: false },
    { id: 'c', text: '', correct: false },
    { id: 'd', text: '', correct: false }
  ]);

  // Update parent when options change
  useEffect(() => {
    onChange({ options } as McqSingleContent | McqMultiContent);
  }, [options, onChange]);

  const handleOptionTextChange = (id: string, text: string) => {
    setOptions(prev => prev.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  const handleOptionCorrectChange = (id: string, correct: boolean) => {
    setOptions(prev => {
      const updated = prev.map(option => {
        if (option.id === id) {
          return { ...option, correct };
        }
        // For single select, uncheck other options
        if (!isMultiSelect && correct) {
          return { ...option, correct: false };
        }
        return option;
      });
      return updated;
    });
  };

  const addOption = () => {
    const newId = String.fromCharCode(97 + options.length); // a, b, c, d, e, f...
    setOptions(prev => [...prev, { id: newId, text: '', correct: false }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return; // Minimum 2 options required
    setOptions(prev => prev.filter(option => option.id !== id));
  };

  const reorderOption = (fromIndex: number, toIndex: number) => {
    const newOptions = [...options];
    const [movedOption] = newOptions.splice(fromIndex, 1);
    newOptions.splice(toIndex, 0, movedOption);
    setOptions(newOptions);
  };

  const getCorrectCount = () => options.filter(option => option.correct).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium text-gray-900">
            {isMultiSelect ? 'Multiple Choice (Multiple Answers)' : 'Multiple Choice (Single Answer)'}
          </h4>
          <p className="text-sm text-gray-500">
            {isMultiSelect 
              ? 'Select all correct answers' 
              : 'Select the one correct answer'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {getCorrectCount()} correct answer{getCorrectCount() !== 1 ? 's' : ''}
          </span>
          {isMultiSelect && getCorrectCount() === 0 && (
            <span className="text-xs text-red-500">At least one correct answer required</span>
          )}
          {!isMultiSelect && getCorrectCount() !== 1 && (
            <span className="text-xs text-red-500">Exactly one correct answer required</span>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={option.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
            {/* Drag Handle */}
            <div className="flex-shrink-0 mt-2 cursor-move">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
              </svg>
            </div>

            {/* Option Letter */}
            <div className="flex-shrink-0 mt-2">
              <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-gray-700 bg-gray-100 rounded-full">
                {option.id.toUpperCase()}
              </span>
            </div>

            {/* Correct Answer Checkbox */}
            <div className="flex-shrink-0 mt-2">
              <input
                type={isMultiSelect ? 'checkbox' : 'radio'}
                name={isMultiSelect ? 'multi-correct' : 'single-correct'}
                checked={option.correct}
                onChange={(e) => handleOptionCorrectChange(option.id, e.target.checked)}
                className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 ${
                  isMultiSelect ? 'rounded' : ''
                }`}
              />
            </div>

            {/* Option Text */}
            <div className="flex-1">
              <textarea
                value={option.text}
                onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                placeholder={`Option ${option.id.toUpperCase()}...`}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
                rows={2}
              />
            </div>

            {/* Remove Button */}
            <div className="flex-shrink-0 mt-2">
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                disabled={options.length <= 2}
                className="text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded"
                title="Remove option"
                aria-label={`Remove option ${option.id.toUpperCase()}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Option Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={addOption}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Option
        </button>
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
                <li>Enter the text for each option</li>
                <li>Mark the correct answer(s) using the checkbox/radio button</li>
                <li>Drag options to reorder them</li>
                <li>Minimum 2 options required</li>
                {isMultiSelect ? (
                  <li>Multiple correct answers allowed</li>
                ) : (
                  <li>Only one correct answer allowed</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default McqQuestionEditor; 
