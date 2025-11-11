// ---------------------------------------------------------------------------
// FillGapEditor.tsx - Fill in the blank question editor
// Based on FillGapContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { FillGapContent } from '@/types';
import { InstructionsModal } from '@/components';

interface FillGapEditorProps {
  content: FillGapContent;
  onChange: (content: FillGapContent) => void;
  className?: string;
  showPreview?: boolean;
}

const FillGapEditor: React.FC<FillGapEditorProps> = ({
  content,
  onChange,
  className = '',
  showPreview = true
}) => {
  const [text, setText] = useState<string>(content?.text || '');
  const [gaps, setGaps] = useState<Array<{id: number; answer: string}>>(content?.gaps || []);

  // Update parent when content changes
  useEffect(() => {
    onChange({ text, gaps });
  }, [text, gaps, onChange]);

  const addGap = () => {
    const newGapId = gaps.length + 1;
    setGaps(prev => [...prev, { id: newGapId, answer: '' }]);
  };

  const removeGap = (gapId: number) => {
    setGaps(prev => prev.filter(gap => gap.id !== gapId));
  };

  const updateGapAnswer = (gapId: number, answer: string) => {
    setGaps(prev => prev.map(gap => 
      gap.id === gapId ? { ...gap, answer } : gap
    ));
  };

  const insertGapMarker = () => {
    const gapId = gaps.length + 1;
    const gapMarker = `{${gapId}}`;
    setText(prev => prev + gapMarker);
    setGaps(prev => [...prev, { id: gapId, answer: '' }]);
  };

  const getGapCount = () => gaps.length;

  const getGapAnswers = () => {
    return gaps.map(gap => gap.answer).filter(answer => answer.trim() !== '');
  };

  const getMissingAnswers = () => {
    return gaps.filter(gap => !gap.answer.trim());
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium text-theme-text-primary">Fill in the Blank Question</h4>
          <p className="text-sm text-theme-text-tertiary">Create text with gaps for students to fill</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-theme-text-tertiary">
            {getGapCount()} gap{getGapCount() !== 1 ? 's' : ''}
          </span>
          {getMissingAnswers().length > 0 && (
            <span className="text-xs text-theme-text-danger">
              {getMissingAnswers().length} answer{getMissingAnswers().length !== 1 ? 's' : ''} missing
            </span>
          )}
        </div>
      </div>

      {/* Text Editor */}
      <div className="bg-theme-bg-secondary rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="gap-text" className="block text-sm font-medium text-theme-text-secondary mb-2">
              Question Text <span className="text-theme-text-danger">*</span>
            </label>
            <div className="relative">
              <textarea
                id="gap-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your question text. Use the 'Add Gap' button to insert gaps marked with {1}, {2}, etc."
                className="block w-full border-theme-border-primary rounded-md shadow-sm bg-theme-bg-primary text-theme-text-primary focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm resize-none bg-theme-bg-primary text-theme-text-primary"
                rows={6}
                required
              />
              <button
                type="button"
                onClick={insertGapMarker}
                className="absolute top-2 right-2 inline-flex items-center px-2 py-1 border border-theme-border-primary rounded-md shadow-sm text-xs font-medium text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary"
                title="Insert gap marker"
              >
                Add Gap
              </button>
            </div>
            <p className="mt-1 text-sm text-theme-text-tertiary">
              Use {'{1}'}, {'{2}'}, etc. to mark gaps. Each gap will appear as a blank field for students.
            </p>
          </div>

          {/* Gap Instructions */}
          <InstructionsModal title="How to Create Gaps">
            <div className="space-y-1">
              <p>Example text with gaps:</p>
              <div className="bg-theme-bg-primary p-3 rounded border font-mono text-sm">
                "The capital of France is {'{1}'}. The Eiffel Tower is located in {'{2}'}."
              </div>
              <p className="mt-2">Click "Add Gap" to automatically insert gap markers, or type them manually.</p>
            </div>
          </InstructionsModal>
        </div>
      </div>

      {/* Gap Answers */}
      {gaps.length > 0 && (
        <div className="bg-theme-bg-secondary rounded-lg p-6">
          <h5 className="text-sm font-medium text-theme-text-secondary mb-4">Gap Answers</h5>
          <div className="space-y-3">
            {gaps.map((gap) => (
              <div key={gap.id} className="flex items-center space-x-3 p-3 border border-theme-border-primary rounded-lg bg-theme-bg-primary bg-theme-bg-primary text-theme-text-primary">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-theme-text-secondary bg-theme-bg-tertiary rounded-full">
                    {gap.id}
                  </span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={gap.answer}
                    onChange={(e) => updateGapAnswer(gap.id, e.target.value)}
                    placeholder="Enter correct answer..."
                    className="block w-full border-theme-border-primary rounded-md shadow-sm bg-theme-bg-primary text-theme-text-primary focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm bg-theme-bg-primary text-theme-text-primary"
                  />
                </div>
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => removeGap(gap.id)}
                    className="text-theme-text-danger hover:text-theme-text-danger focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-danger rounded"
                    title="Remove gap"
                    aria-label={`Remove gap ${gap.id}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <InstructionsModal title="Instructions">
        <ul className="list-disc list-inside space-y-1">
          <li>Write your question text with gaps marked as {'{1}'}, {'{2}'}, etc.</li>
          <li>Use the "Add Gap" button to automatically insert gap markers</li>
          <li>Provide the correct answer for each gap</li>
          <li>Maximum 3 gaps per question</li>
        </ul>
      </InstructionsModal>

      {showPreview && (
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-4 bg-theme-bg-primary text-theme-text-primary">
          <h5 className="text-sm font-medium text-theme-text-secondary mb-2">Preview</h5>
          <div className="text-sm text-theme-text-secondary">
            <p>Students will see:</p>
            <div className="mt-2 bg-theme-bg-primary p-3 rounded border">
              {text ? (
                <div className="space-y-2">
                  {text.split(/(\{\d+\})/).map((part, index) => {
                    const gapMatch = part.match(/\{(\d+)\}/);
                    if (gapMatch) {
                      return (
                        <input
                          key={index}
                          type="text"
                          placeholder=""
                          disabled
                          className="inline-block min-w-[60px] w-20 border-theme-border-primary rounded-md shadow-sm bg-theme-bg-tertiary text-theme-text-tertiary text-sm bg-theme-bg-primary text-theme-text-primary text-center"
                        />
                      );
                    }
                    return <span key={index}>{part}</span>;
                  })}
                </div>
              ) : (
                <p className="text-theme-text-tertiary italic">No text provided</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Answer Summary */}
      {gaps.length > 0 && (
        <div className="bg-theme-bg-tertiary border border-theme-border-primary rounded-md p-4 bg-theme-bg-primary text-theme-text-primary">
          <h5 className="text-sm font-medium text-theme-text-primary mb-2">Answer Summary</h5>
          <div className="text-sm text-theme-text-secondary">
            <p>Correct answers:</p>
            <div className="mt-2 space-y-1">
              {gaps.map((gap) => (
                <div key={gap.id} className="flex items-center space-x-2">
                  <span className="font-medium">Gap {gap.id}:</span>
                  <span className={gap.answer ? 'text-theme-interactive-success' : 'text-theme-text-danger'}>
                    {gap.answer || 'No answer provided'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FillGapEditor; 
