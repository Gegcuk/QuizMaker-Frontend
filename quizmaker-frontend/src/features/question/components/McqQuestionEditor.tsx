// ---------------------------------------------------------------------------
// McqQuestionEditor.tsx - Multiple choice question editor
// Based on McqSingleContent/McqMultiContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { McqOption, McqSingleContent, McqMultiContent, MediaRefDto } from '@/types';
import { InstructionsModal, AddItemButton, Textarea, Button } from '@/components';
import { MediaPicker } from '@/features/media';
// No specific content types - API uses JsonNode

const MIN_MCQ_OPTIONS = 4;
const MAX_MCQ_SINGLE_OPTIONS = 4;
const MAX_MCQ_MULTI_OPTIONS = 6;

interface McqQuestionEditorProps {
  content: McqSingleContent | McqMultiContent;
  onChange: (content: McqSingleContent | McqMultiContent) => void;
  isMultiSelect?: boolean;
  className?: string;
}

const getOptionId = (index: number) => String.fromCharCode(97 + index);

const createBlankOption = (index: number): McqOption => ({
  id: getOptionId(index),
  text: '',
  correct: false
});

const normalizeOptions = (
  options: McqOption[] | undefined,
  isMultiSelect: boolean,
): McqOption[] => {
  const maxOptions = isMultiSelect ? MAX_MCQ_MULTI_OPTIONS : MAX_MCQ_SINGLE_OPTIONS;
  const normalized = (options || [])
    .slice(0, maxOptions)
    .map((option, index) => ({
      ...option,
      id: option.id || getOptionId(index),
      correct: Boolean(option.correct)
    }));

  while (normalized.length < MIN_MCQ_OPTIONS) {
    normalized.push(createBlankOption(normalized.length));
  }

  return normalized;
};

const McqQuestionEditor: React.FC<McqQuestionEditorProps> = ({
  content,
  onChange,
  isMultiSelect = false,
  className = ''
}) => {
  const [options, setOptions] = useState<McqOption[]>(() =>
    normalizeOptions(content.options, isMultiSelect)
  );
  const maxOptions = isMultiSelect ? MAX_MCQ_MULTI_OPTIONS : MAX_MCQ_SINGLE_OPTIONS;
  const canAddOption = options.length < maxOptions;
  const canRemoveOption = options.length > MIN_MCQ_OPTIONS;

  // Update parent when options change
  useEffect(() => {
    onChange({ options } as McqSingleContent | McqMultiContent);
  }, [options, onChange]);

  // Auto-resize all textareas on mount and when options change
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea[data-mcq-option]');
    textareas.forEach((textarea) => {
      const element = textarea as HTMLTextAreaElement;
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    });
  }, [options]);

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

  const handleOptionMediaChange = (id: string, media: MediaRefDto | null) => {
    setOptions(prev => prev.map(option => 
      option.id === id ? { ...option, media: media ?? undefined } : option
    ));
  };

  const addOption = () => {
    if (!canAddOption) return;
    setOptions(prev => [...prev, createBlankOption(prev.length)]);
  };

  const removeOption = (id: string) => {
    if (!canRemoveOption) return;
    setOptions(prev => prev.filter(option => option.id !== id));
  };

  const getCorrectCount = () => options.filter(option => option.correct).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header - Validation Only */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-theme-text-tertiary">
          {isMultiSelect 
            ? 'Select all correct answers' 
            : 'Select the one correct answer'
          }
        </p>
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
        {options.map((option) => (
          <div key={option.id} className="flex items-start space-x-3 p-3 border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
            {/* Correct Answer Checkbox */}
            <div className="flex-shrink-0 mt-2">
              <input
                type={isMultiSelect ? 'checkbox' : 'radio'}
                name={isMultiSelect ? 'multi-correct' : 'single-correct'}
                checked={option.correct}
                onChange={(e) => handleOptionCorrectChange(option.id, e.target.checked)}
                aria-label={`Mark option ${option.id.toUpperCase()} as correct`}
                className={`h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary ${
                  isMultiSelect ? 'rounded' : ''
                }`}
              />
            </div>

            {/* Option Text + Media */}
            <div className="flex-1 space-y-3">
              <Textarea
                data-mcq-option
                value={option.text || ''}
                onChange={(e) => {
                  handleOptionTextChange(option.id, e.target.value);
                }}
                placeholder={`Option text...`}
                rows={1}
                fullWidth
                className="!min-h-[38px]"
              />
              <MediaPicker
                value={(option.media as MediaRefDto) || null}
                onChange={(value) => handleOptionMediaChange(option.id, value)}
                label="Option image (optional)"
                helperText="Images only. Max 10 MB."
                showPreview
              />
            </div>

            {/* Remove Button */}
            <div className="flex-shrink-0 mt-2">
              <Button
                type="button"
                onClick={() => removeOption(option.id)}
                disabled={!canRemoveOption}
                variant="ghost"
                size="sm"
                className="!p-1 !min-w-0 !text-theme-interactive-danger hover:!text-theme-interactive-danger disabled:!text-theme-text-tertiary"
                title="Remove option"
                aria-label={`Remove option ${option.id.toUpperCase()}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Option Button */}
      <AddItemButton onClick={addOption} itemType="Option" disabled={!canAddOption} />

      {/* Instructions */}
      <InstructionsModal title="Instructions">
        <ul className="list-disc list-inside space-y-1">
          <li>Enter the text for each option</li>
          <li>Option text can be empty if you upload an image</li>
          <li>Mark the correct answer(s) using the checkbox/radio button</li>
          {isMultiSelect && <li>Multiple correct answers allowed</li>}
        </ul>
      </InstructionsModal>
    </div>
  );
};

export default McqQuestionEditor; 
