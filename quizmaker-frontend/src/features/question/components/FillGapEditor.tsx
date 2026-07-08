// ---------------------------------------------------------------------------
// FillGapEditor.tsx - Fill in the blank question editor
// Based on FillGapContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { FillGapContent } from '@/types';
import { InstructionsModal, Hint, Textarea, Input, Button, Switch, Chip } from '@/components';
import { dedupeFillGapOptions } from '../utils/contentSanitizer';

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
  const [answerPoolEnabled, setAnswerPoolEnabled] = useState<boolean>(
    Array.isArray(content?.options) && content.options.length > 0
  );
  const [distractors, setDistractors] = useState<string[]>(() =>
    getDistractorsFromOptions(content?.options || [], content?.gaps || [])
  );

  // Update parent when content changes
  useEffect(() => {
    const options = answerPoolEnabled ? buildFillGapOptions(gaps, distractors) : [];
    onChange(options.length > 0 ? { text, gaps, options } : { text, gaps });
  }, [text, gaps, distractors, answerPoolEnabled, onChange]);

  const handleAnswerPoolToggle = (enabled: boolean) => {
    setAnswerPoolEnabled(enabled);

    if (enabled && distractors.length === 0) {
      setDistractors(Array.from({ length: MIN_FILL_GAP_DISTRACTORS }, () => ''));
    }
  };

  const removeGap = (gapId: number) => {
    setGaps(prev => prev.filter(gap => gap.id !== gapId));
  };

  const updateGapAnswer = (gapId: number, answer: string) => {
    setGaps(prev => prev.map(gap => 
      gap.id === gapId ? { ...gap, answer } : gap
    ));
  };

  const addDistractor = () => {
    setDistractors(prev => [...prev, '']);
  };

  const updateDistractor = (index: number, value: string) => {
    setDistractors(prev => prev.map((option, optionIndex) => (
      optionIndex === index ? value : option
    )));
  };

  const removeDistractor = (index: number) => {
    setDistractors(prev => prev.filter((_, optionIndex) => optionIndex !== index));
  };

  const insertGapMarker = () => {
    if (gaps.length >= 3) return; // Maximum 3 gaps allowed
    const gapId = gaps.length + 1;
    const gapMarker = `{${gapId}}`;
    setText(prev => prev + gapMarker);
    setGaps(prev => [...prev, { id: gapId, answer: '' }]);
  };

  const getGapCount = () => gaps.length;

  const getCurrentGapAnswers = () => {
    return gaps.map(gap => gap.answer).filter(answer => answer.trim() !== '');
  };

  const getMissingAnswers = () => {
    return gaps.filter(gap => !gap.answer.trim());
  };

  const answerPoolOptions = answerPoolEnabled ? buildFillGapOptions(gaps, distractors) : [];
  const answerPoolCount = answerPoolOptions.length;
  const answerPoolRequirements = getAnswerPoolRequirements(gaps, distractors);
  const answerPoolIsSchemaSized = !answerPoolEnabled || answerPoolRequirements.isValid;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-theme-text-tertiary">Create text with gaps to fill</p>
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${getGapCount() >= 3 ? 'text-theme-interactive-warning font-medium' : 'text-theme-text-tertiary'}`}>
            {getGapCount()}/3 gap{getGapCount() !== 1 ? 's' : ''}
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
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="gap-text" className="block text-sm font-medium text-theme-text-secondary">
                Question Text <span className="text-theme-text-danger">*</span>
              </label>
              <Button
                variant="secondary"
                size="sm"
                onClick={insertGapMarker}
                disabled={gaps.length >= 3}
                title={gaps.length >= 3 ? 'Maximum 3 gaps allowed' : 'Insert gap marker'}
              >
                Add Gap
              </Button>
            </div>
            <Textarea
              id="gap-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your question text. Use the 'Add Gap' button to insert gaps marked with {1}, {2}, etc."
              rows={6}
              required
              fullWidth
            />
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-theme-text-tertiary flex-1">
                Use {'{1}'}, {'{2}'}, etc. to mark gaps. Each gap will appear as a blank input field.
              </p>
              <Hint
                position="left"
                size="sm"
                content={
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium mb-1">Example:</p>
                      <div className="bg-theme-bg-secondary p-2 rounded text-xs font-mono">
                        "The capital of France is {'{1}'}. The Eiffel Tower is located in {'{2}'}."
                      </div>
                    </div>
                    <p className="text-xs">Click "Add Gap" to automatically insert gap markers, or type them manually.</p>
                  </div>
                }
              />
            </div>
          </div>
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
                  <Input
                    type="text"
                    value={gap.answer}
                    onChange={(e) => updateGapAnswer(gap.id, e.target.value)}
                    placeholder="Enter correct answer..."
                    fullWidth
                  />
                </div>
                <div className="flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGap(gap.id)}
                    className="!text-theme-interactive-danger hover:!text-theme-interactive-danger"
                    title="Remove gap"
                    aria-label={`Remove gap ${gap.id}`}
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-theme-bg-secondary rounded-lg p-6">
        <Switch
          checked={answerPoolEnabled}
          onChange={handleAnswerPoolToggle}
          label="Answer pool"
          description="Enable selectable answer chips for this fill-gap question."
        />

        {answerPoolEnabled && (
          <div className="mt-5 space-y-4">
            <div className="p-3 border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h5 className="text-sm font-medium text-theme-text-secondary">Included gap answers</h5>
                <span className="text-xs text-theme-text-tertiary">
                  {getCurrentGapAnswers().length} answer{getCurrentGapAnswers().length !== 1 ? 's' : ''}
                </span>
              </div>
              {getCurrentGapAnswers().length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {getCurrentGapAnswers().map((answer) => (
                    <Chip key={answer} label={answer} variant="success" size="sm" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-theme-text-tertiary">Add gap answers to include them in the pool.</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h5 className="text-sm font-medium text-theme-text-secondary">Distractors</h5>
                  <p className="text-xs text-theme-text-tertiary">
                    Add 6-7 plausible wrong answers.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addDistractor}
                  disabled={answerPoolRequirements.distractorCount >= MAX_FILL_GAP_DISTRACTORS}
                >
                  Add Distractor
                </Button>
              </div>

              {distractors.map((option, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
                  <Input
                    type="text"
                    value={option}
                    onChange={(e) => updateDistractor(index, e.target.value)}
                    placeholder="Enter distractor..."
                    fullWidth
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDistractor(index)}
                    className="!text-theme-interactive-danger hover:!text-theme-interactive-danger"
                  >
                    Remove
                  </Button>
                </div>
              ))}

              {distractors.length === 0 && (
                <div className="p-3 border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
                  <p className="text-sm text-theme-text-tertiary">No distractors added yet.</p>
                </div>
              )}
            </div>

            <div className={`p-3 border rounded-md ${
              answerPoolIsSchemaSized
                ? 'border-theme-border-primary bg-theme-bg-primary'
                : 'border-theme-border-warning bg-theme-bg-warning'
            }`}>
              <p className={`text-sm ${
                answerPoolIsSchemaSized ? 'text-theme-text-secondary' : 'text-theme-interactive-warning'
              }`}>
                Pool total: {answerPoolCount} option{answerPoolCount !== 1 ? 's' : ''}.
                {answerPoolIsSchemaSized
                  ? ' Ready for drag-option mode.'
                  : ` Add ${answerPoolRequirements.minDistractorCount}-${answerPoolRequirements.maxDistractorCount} unique distractors for ${answerPoolRequirements.correctAnswerCount} correct answer${answerPoolRequirements.correctAnswerCount !== 1 ? 's' : ''}.`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <InstructionsModal title="Instructions">
        <ul className="list-disc list-inside space-y-1">
          <li>Provide the correct answer for each gap</li>
          <li>Answer pool is optional; leave it disabled for typed-answer questions</li>
          <li>If enabled, include every correct answer plus 6-7 distractors</li>
          <li>Maximum 3 gaps per question</li>
        </ul>
      </InstructionsModal>

      {showPreview && (
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-4 bg-theme-bg-primary text-theme-text-primary">
          <h5 className="text-sm font-medium text-theme-text-secondary mb-2">Preview</h5>
          <div className="text-sm text-theme-text-secondary">
            <p>How it will appear:</p>
            <div className="mt-2 bg-theme-bg-primary p-3 rounded border">
              {text ? (
                <div className="space-y-2">
                  {text.split(/(\{\d+\})/).map((part, index) => {
                    const gapMatch = part.match(/\{(\d+)\}/);
                    if (gapMatch) {
                      return (
                        <Input
                          key={index}
                          type="text"
                          placeholder=""
                          disabled
                          className="!inline-block !min-w-[60px] !w-20 !text-center"
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

const normalizeOptionKey = (value: string) => value.trim().toLowerCase();

const MIN_FILL_GAP_DISTRACTORS = 6;
const MAX_FILL_GAP_DISTRACTORS = 7;

const getGapAnswerValues = (gaps: Array<{ id: number; answer: string }>): string[] =>
  dedupeFillGapOptions(gaps.map(gap => gap.answer));

const getDistractorsFromOptions = (
  options: string[],
  gaps: Array<{ id: number; answer: string }>
): string[] => {
  const gapAnswerKeys = new Set(getGapAnswerValues(gaps).map(normalizeOptionKey));
  return dedupeFillGapOptions(options).filter(option => !gapAnswerKeys.has(normalizeOptionKey(option)));
};

const buildFillGapOptions = (
  gaps: Array<{ id: number; answer: string }>,
  distractors: string[]
): string[] => dedupeFillGapOptions([...getGapAnswerValues(gaps), ...distractors]);

const getAnswerPoolRequirements = (
  gaps: Array<{ id: number; answer: string }>,
  distractors: string[]
) => {
  const correctAnswerCount = getGapAnswerValues(gaps).length;
  const distractorCount = getDistractorsFromOptions(distractors, gaps).length;

  return {
    correctAnswerCount,
    distractorCount,
    minDistractorCount: MIN_FILL_GAP_DISTRACTORS,
    maxDistractorCount: MAX_FILL_GAP_DISTRACTORS,
    isValid:
      correctAnswerCount > 0 &&
      distractorCount >= MIN_FILL_GAP_DISTRACTORS &&
      distractorCount <= MAX_FILL_GAP_DISTRACTORS,
  };
};

export default FillGapEditor;
