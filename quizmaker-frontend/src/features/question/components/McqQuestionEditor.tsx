// ---------------------------------------------------------------------------
// McqQuestionEditor.tsx - Multiple choice question editor
// Based on McqSingleContent/McqMultiContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { McqOption, McqSingleContent, McqMultiContent } from '@/types';
import { InstructionsModal, AddItemButton } from '@/components';
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
          <h4 className="text-lg font-medium text-theme-text-primary">
            {isMultiSelect ? 'Multiple Choice (Multiple Answers)' : 'Multiple Choice (Single Answer)'}
          </h4>
          <p className="text-sm text-theme-text-tertiary">
            {isMultiSelect 
              ? 'Select all correct answers' 
              : 'Select the one correct answer'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-theme-text-tertiary">
            {getCorrectCount()} correct answer{getCorrectCount() !== 1 ? 's' : ''}
          </span>
          {isMultiSelect && getCorrectCount() === 0 && (
            <span className="text-xs text-theme-text-danger">At least one correct answer required</span>
          )}
          {!isMultiSelect && getCorrectCount() !== 1 && (
            <span className="text-xs text-theme-text-danger">Exactly one correct answer required</span>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={option.id} className="flex items-start space-x-3 p-3 border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
            {/* Drag Handle */}
            <div className="flex-shrink-0 mt-2 cursor-move">
              <svg className="w-4 h-4 text-theme-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
              </svg>
            </div>

            {/* Option Letter */}
            <div className="flex-shrink-0 mt-2">
              <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-theme-text-secondary bg-theme-bg-tertiary rounded-full">
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
                className={`h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary ${
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
                className="block w-full border-theme-border-primary rounded-md shadow-sm bg-theme-bg-primary text-theme-text-primary focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm resize-none bg-theme-bg-primary text-theme-text-primary"
                rows={2}
              />
            </div>

            {/* Remove Button */}
            <div className="flex-shrink-0 mt-2">
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                disabled={options.length <= 2}
                className="text-theme-text-danger hover:text-theme-text-danger disabled:text-theme-text-tertiary disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-danger rounded"
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
      <AddItemButton onClick={addOption} itemType="Option" />

      {/* Instructions */}
      <InstructionsModal title="Instructions">
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
      </InstructionsModal>
    </div>
  );
};

export default McqQuestionEditor; 
