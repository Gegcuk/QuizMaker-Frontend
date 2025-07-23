// ---------------------------------------------------------------------------
// FillGapEditor.tsx - Fill in the blank question editor
// Based on FillGapContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { FillGapContent, GapAnswer } from '../../types/question.types';

interface FillGapEditorProps {
  content: FillGapContent;
  onChange: (content: FillGapContent) => void;
  className?: string;
}

const FillGapEditor: React.FC<FillGapEditorProps> = ({
  content,
  onChange,
  className = ''
}) => {
  const [text, setText] = useState<string>(content.text || '');
  const [gaps, setGaps] = useState<GapAnswer[]>(content.gaps || []);

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
    const gapMarker = `___${gapId}___`;
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
          <h4 className="text-lg font-medium text-gray-900">Fill in the Blank Question</h4>
          <p className="text-sm text-gray-500">Create text with gaps for students to fill</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {getGapCount()} gap{getGapCount() !== 1 ? 's' : ''}
          </span>
          {getMissingAnswers().length > 0 && (
            <span className="text-xs text-red-500">
              {getMissingAnswers().length} answer{getMissingAnswers().length !== 1 ? 's' : ''} missing
            </span>
          )}
        </div>
      </div>

      {/* Text Editor */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="gap-text" className="block text-sm font-medium text-gray-700 mb-2">
              Question Text <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <textarea
                id="gap-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your question text. Use the 'Add Gap' button to insert gaps marked with ___..."
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
                rows={6}
                required
              />
              <button
                type="button"
                onClick={insertGapMarker}
                className="absolute top-2 right-2 inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Insert gap marker"
              >
                Add Gap
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Use ___1___, ___2___, etc. to mark gaps. Each gap will appear as a blank field for students.
            </p>
          </div>

          {/* Gap Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h5 className="text-sm font-medium text-blue-800 mb-2">How to Create Gaps</h5>
            <div className="text-sm text-blue-700 space-y-1">
              <p>Example text with gaps:</p>
              <div className="bg-white p-3 rounded border font-mono text-sm">
                "The capital of France is ___1___. The Eiffel Tower is located in ___2___."
              </div>
              <p className="mt-2">Click "Add Gap" to automatically insert gap markers, or type them manually.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gap Answers */}
      {gaps.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h5 className="text-sm font-medium text-gray-700 mb-4">Gap Answers</h5>
          <div className="space-y-3">
            {gaps.map((gap) => (
              <div key={gap.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-white">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-gray-700 bg-gray-100 rounded-full">
                    {gap.id}
                  </span>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={gap.answer}
                    onChange={(e) => updateGapAnswer(gap.id, e.target.value)}
                    placeholder={`Answer for gap ${gap.id}...`}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => removeGap(gap.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Remove gap"
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
                <li>Write your question text with gaps marked as ___1___, ___2___, etc.</li>
                <li>Use the "Add Gap" button to automatically insert gap markers</li>
                <li>Provide the correct answer for each gap</li>
                <li>Consider multiple acceptable answers for each gap</li>
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
          <div className="mt-2 bg-white p-3 rounded border">
            {text ? (
              <div className="space-y-2">
                {text.split(/(___\d+___)/).map((part, index) => {
                  const gapMatch = part.match(/___(\d+)___/);
                  if (gapMatch) {
                    const gapId = parseInt(gapMatch[1]);
                    return (
                      <input
                        key={index}
                        type="text"
                        placeholder={`Gap ${gapId}`}
                        disabled
                        className="inline-block w-24 border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 text-sm"
                      />
                    );
                  }
                  return <span key={index}>{part}</span>;
                })}
              </div>
            ) : (
              <p className="text-gray-400 italic">No text provided</p>
            )}
          </div>
        </div>
      </div>

      {/* Answer Summary */}
      {gaps.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h5 className="text-sm font-medium text-green-800 mb-2">Answer Summary</h5>
          <div className="text-sm text-green-700">
            <p>Correct answers:</p>
            <div className="mt-2 space-y-1">
              {gaps.map((gap) => (
                <div key={gap.id} className="flex items-center space-x-2">
                  <span className="font-medium">Gap {gap.id}:</span>
                  <span className={gap.answer ? 'text-green-800' : 'text-red-600'}>
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