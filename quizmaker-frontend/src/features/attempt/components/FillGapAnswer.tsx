// src/components/attempt/FillGapAnswer.tsx
// ---------------------------------------------------------------------------
// Component for fill-in-the-blank question answers
// Handles multiple input fields for gap filling
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useMemo } from 'react';
import { QuestionForAttemptDto } from '@/types';
import { Button } from '@/components';

interface FillGapAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer?: FillGapCurrentAnswer;
  onAnswerChange: (answer: Record<number, string>) => void;
  disabled?: boolean;
  className?: string;
  showFeedback?: boolean;
  isCorrect?: boolean;
  correctAnswer?: SubmittedFillGapAnswer;
}

interface GapAnswer {
  id: number;
  gapId?: number;
  answer: string;
}

interface FillGapOption {
  key: string;
  value: string;
}

interface SubmittedGapAnswer {
  id?: number;
  gapId?: number;
  answer?: string;
  text?: string;
}

interface SubmittedFillGapAnswer {
  answers?: SubmittedGapAnswer[];
}

type FillGapCurrentAnswer = Record<number, string> | SubmittedFillGapAnswer | null | undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const normalizeOptionValue = (value: string) => value.trim().toLowerCase();

const normalizeOptions = (options: unknown): FillGapOption[] => {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option, index) => ({
      key: `${index}-${normalizeOptionValue(String(option ?? ''))}`,
      value: String(option ?? '').trim(),
    }))
    .filter((option) => option.value.length > 0);
};

const normalizeGapAnswers = (answer: FillGapCurrentAnswer): Record<number, string> => {
  if (!isRecord(answer)) {
    return {};
  }

  const submittedAnswer = answer as SubmittedFillGapAnswer;
  if (Array.isArray(submittedAnswer.answers)) {
    return submittedAnswer.answers.reduce<Record<number, string>>((acc, item) => {
      const gapId = item.gapId ?? item.id;
      const value = item.answer ?? item.text;

      if (typeof gapId === 'number' && typeof value === 'string') {
        acc[gapId] = value;
      }

      return acc;
    }, {});
  }

  return Object.entries(answer).reduce<Record<number, string>>((acc, [gapId, value]) => {
    const parsedGapId = Number(gapId);

    if (Number.isFinite(parsedGapId) && typeof value === 'string') {
      acc[parsedGapId] = value;
    }

    return acc;
  }, {});
};

const FillGapAnswer: React.FC<FillGapAnswerProps> = ({
  question,
  currentAnswer = {},
  onAnswerChange,
  disabled = false,
  className = '',
  showFeedback = false,
  isCorrect,
  correctAnswer
}) => {
  const [gapAnswers, setGapAnswers] = useState<Record<number, string>>(
    normalizeGapAnswers(currentAnswer)
  );
  const [activeGapId, setActiveGapId] = useState<number | null>(null);

  useEffect(() => {
    setGapAnswers(normalizeGapAnswers(currentAnswer));
  }, [currentAnswer]);

  const handleGapChange = (gapId: number, value: string) => {
    if (disabled) return;

    const newAnswers = { ...(gapAnswers || {}), [gapId]: value };
    console.log("FillGapAnswer gap change:", { gapId, value, newAnswers });
    setGapAnswers(newAnswers);
    onAnswerChange(newAnswers);
  };

  const handleClearAll = () => {
    const emptyAnswers: Record<number, string> = {};
    console.log("FillGapAnswer clear all:", emptyAnswers);
    setActiveGapId(orderedGapIds[0] ?? null);
    setGapAnswers(emptyAnswers);
    onAnswerChange(emptyAnswers);
  };

  // Extract text and gaps from safe content
  const text = question.safeContent?.text || '';
  const gaps = useMemo<GapAnswer[]>(
    () => Array.isArray(question.safeContent?.gaps) ? question.safeContent.gaps : [],
    [question.safeContent?.gaps]
  );
  const options = normalizeOptions(question.safeContent?.options);
  const hasOptions = options.length > 0;
  const orderedGapIds = useMemo(() => {
    const seenGapIds = new Set<number>();
    const ids: number[] = [];
    const gapRegex = /\{(\d+)\}/g;
    let match;

    while ((match = gapRegex.exec(text)) !== null) {
      const gapId = Number(match[1]);
      const gapExists = gaps.some((gap: GapAnswer) => (gap.id ?? gap.gapId) === gapId);

      if (gapExists && !seenGapIds.has(gapId)) {
        seenGapIds.add(gapId);
        ids.push(gapId);
      }
    }

    gaps.forEach((gap: GapAnswer) => {
      const gapId = gap.id ?? gap.gapId;

      if (typeof gapId === 'number' && !seenGapIds.has(gapId)) {
        seenGapIds.add(gapId);
        ids.push(gapId);
      }
    });

    return ids;
  }, [text, gaps]);
  const orderedGapKey = orderedGapIds.join('|');
  const firstOrderedGapId = orderedGapIds[0] ?? null;

  useEffect(() => {
    setActiveGapId(hasOptions ? firstOrderedGapId : null);
  }, [question.id, hasOptions, firstOrderedGapId, orderedGapKey]);

  const getNextActiveGapId = (currentGapId: number, answers: Record<number, string>) => {
    if (orderedGapIds.length === 0) return null;

    const currentIndex = orderedGapIds.indexOf(currentGapId);
    const nextEmptyGapId = orderedGapIds
      .slice(currentIndex + 1)
      .find((gapId) => !answers[gapId]?.trim());

    if (nextEmptyGapId !== undefined) {
      return nextEmptyGapId;
    }

    const firstEmptyGapId = orderedGapIds.find((gapId) => !answers[gapId]?.trim());
    return firstEmptyGapId ?? null;
  };

  const isOptionUsed = (optionValue: string) =>
    Object.values(gapAnswers || {}).some(
      (answer) => normalizeOptionValue(answer) === normalizeOptionValue(optionValue)
    );

  const isOptionUsedByOtherGap = (optionValue: string, targetGapId: number | null) =>
    Object.entries(gapAnswers || {}).some(([gapId, answer]) => {
      if (targetGapId !== null && Number(gapId) === targetGapId) {
        return false;
      }

      return normalizeOptionValue(answer) === normalizeOptionValue(optionValue);
    });

  const assignOptionToGap = (gapId: number, optionKey: string) => {
    if (disabled) return;

    const option = options.find((item) => item.key === optionKey);
    if (!option) return;

    const newAnswers = { ...(gapAnswers || {}), [gapId]: option.value };
    console.log("FillGapAnswer option assignment:", { gapId, option: option.value, newAnswers });
    setGapAnswers(newAnswers);
    onAnswerChange(newAnswers);
    setActiveGapId(getNextActiveGapId(gapId, newAnswers));
  };

  const handleGapSelection = (gapId: number) => {
    if (disabled) return;
    setActiveGapId(gapId);
  };

  const handleOptionClick = (option: FillGapOption) => {
    const targetGapId = activeGapId ?? orderedGapIds[0] ?? null;

    if (
      disabled ||
      targetGapId === null ||
      isOptionUsedByOtherGap(option.value, targetGapId)
    ) {
      return;
    }

    assignOptionToGap(targetGapId, option.key);
  };

  // Debug logging
  console.log("FillGapAnswer data:", {
    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    textLength: text.length,
    gapsCount: gaps.length,
    gaps: gaps,
    currentAnswer: currentAnswer,
    hasGapMarkers: text.includes('{'),
    gapMarkerCount: (text.match(/\{\d+\}/g) || []).length
  });

  const renderTextWithGaps = () => {
    if (!text || gaps.length === 0) {
      return (
        <div className="p-4 bg-theme-bg-secondary border border-theme-border-primary rounded-md bg-theme-bg-primary text-theme-text-primary">
          <div className="text-theme-text-tertiary text-center">No text with gaps available</div>
        </div>
      );
    }

    // Split text by gaps and render with input fields
    const parts: React.ReactNode[] = [];
    const currentText = text;

    // Find all gaps marked with {N} and replace them with input fields
    const gapRegex = /\{(\d+)\}/g;
    let match;
    let lastIndex = 0;
    let matchIndex = 0; // For unique keys when same gap ID appears multiple times
    
    console.log("FillGapAnswer parsing:", {
      textLength: currentText.length,
      gapMatches: currentText.match(/\{\d+\}/g) || [],
      gapsArrayLength: gaps.length
    });

    while ((match = gapRegex.exec(currentText)) !== null) {
      // Add text before the gap
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${matchIndex}`} className="text-theme-text-primary">
            {currentText.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Extract gap ID from the match (e.g., {1} -> 1)
      const gapId = parseInt(match[1], 10);
      
      // Find the gap object with this ID
      const gap = gaps.find((g: GapAnswer) => (g.id ?? g.gapId) === gapId);
      
      if (gap) {
        // All instances of the same gap ID share the same value
        const currentValue = gapAnswers?.[gapId] || '';
        // Calculate dynamic width: minimum 60px, grows with content (roughly 8px per character)
        const inputWidth = Math.max(60, Math.min(currentValue.length * 8 + 20, 400));
        
        // Determine if this gap answer is correct
        let gapIsCorrect = false;
        let correctAnswerText = '';
        if (showFeedback && correctAnswer && Array.isArray(correctAnswer.answers)) {
          const correctGap = correctAnswer.answers.find((answer) => answer.id === gapId || answer.gapId === gapId);
          if (correctGap) {
            correctAnswerText = correctGap.text || correctGap.answer || '';
            gapIsCorrect = currentValue.trim().toLowerCase() === correctAnswerText.trim().toLowerCase();
          }
        }

        // Get styling based on feedback
        let borderColor = 'border-theme-border-primary';
        let bgColor = 'bg-theme-bg-primary';
        if (showFeedback && isCorrect !== undefined) {
          if (gapIsCorrect) {
            borderColor = 'border-theme-interactive-success';
            bgColor = 'bg-theme-bg-success';
          } else if (currentValue.trim()) {
            borderColor = 'border-theme-interactive-danger';
            bgColor = 'bg-theme-bg-danger';
          }
        } else if (hasOptions && activeGapId === gapId) {
          borderColor = 'border-theme-interactive-primary';
          bgColor = 'bg-theme-bg-info';
        }
        
        // Use matchIndex for unique key when same gap ID appears multiple times
        parts.push(
          <span key={`gap-${gapId}-${matchIndex}`} className="inline-block">
            {hasOptions ? (
              <button
                type="button"
                onClick={() => handleGapSelection(gapId)}
                onDragOver={(event) => {
                  if (!disabled) {
                    event.preventDefault();
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  assignOptionToGap(gapId, event.dataTransfer.getData('text/plain'));
                }}
                disabled={disabled}
                className={`mx-1 min-w-24 min-h-8 px-2 py-1 my-1 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary disabled:opacity-70 text-center transition-all duration-150 ${borderColor} ${bgColor} text-theme-text-primary`}
                aria-label={`Gap ${gapId}${currentValue ? `: ${currentValue}` : ''}`}
                aria-pressed={activeGapId === gapId}
              >
                {currentValue}
              </button>
            ) : (
              <input
                type="text"
                value={currentValue}
                onChange={(e) => handleGapChange(gapId, e.target.value)}
                disabled={disabled}
                placeholder=""
                style={{ width: `${inputWidth}px` }}
                className={`mx-1 px-2 py-1 my-1 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary disabled:opacity-70 text-center transition-all duration-150 ${borderColor} ${bgColor} text-theme-text-primary`}
              />
            )}
            {showFeedback && !gapIsCorrect && correctAnswerText && (
              <span className="ml-1 text-xs text-theme-interactive-primary" title={`Correct: ${correctAnswerText}`}>
                (✓ {correctAnswerText})
              </span>
            )}
          </span>
        );
      } else {
        // Gap ID not found in gaps array, just show the placeholder text
        parts.push(
          <span key={`gap-missing-${matchIndex}`} className="text-theme-text-tertiary">
            {match[0]}
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
      matchIndex++;
    }

    // Add remaining text after the last gap
    if (lastIndex < currentText.length) {
      parts.push(
        <span key="text-end" className="text-theme-text-primary">
          {currentText.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  const filledGaps = gapAnswers ? Object.values(gapAnswers).filter(answer => answer && answer.trim().length > 0).length : 0;
  const totalGaps = gaps.length;
  const completionPercentage = totalGaps > 0 ? (filledGaps / totalGaps) * 100 : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      <div className="text-sm text-theme-text-secondary mb-4">
        <p className="font-medium mb-2">
          {hasOptions ? 'Choose one answer for each blank:' : 'Fill in the blanks with the correct words or phrases:'}
        </p>
      </div>

      {/* Text with Gaps */}
      <div className="p-6 bg-theme-bg-secondary border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
        <div className="text-lg leading-relaxed">
          {renderTextWithGaps()}
        </div>
      </div>

      {hasOptions && (
        <div className="p-4 bg-theme-bg-secondary border border-theme-border-primary rounded-lg">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-3">
            <p className="text-sm font-medium text-theme-text-secondary">Answer pool</p>
            {activeGapId !== null && !disabled && (
              <p className="text-xs text-theme-text-tertiary">
                Active gap: {activeGapId}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const isUsed = isOptionUsed(option.value);
              const isUsedByOtherGap = isOptionUsedByOtherGap(option.value, activeGapId);
              const activeGapValue = activeGapId !== null ? gapAnswers?.[activeGapId] : '';
              const isActiveGapValue = normalizeOptionValue(activeGapValue || '') === normalizeOptionValue(option.value);
              const isUnavailable = isUsed || activeGapId === null;

              return (
                <Button
                  key={option.key}
                  type="button"
                  variant={isActiveGapValue && !isUsed ? 'primary' : 'outline'}
                  size="sm"
                  rounded
                  draggable={!disabled && !isUnavailable}
                  disabled={disabled || isUnavailable || isUsedByOtherGap}
                  onClick={() => handleOptionClick(option)}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', option.key);
                  }}
                  className={`${isUnavailable ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                  aria-pressed={isActiveGapValue}
                >
                  {option.value}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-theme-text-secondary">
            {filledGaps} of {totalGaps} gaps filled
          </div>
        </div>

        {gapAnswers && Object.keys(gapAnswers).length > 0 && (
          <Button
            type="button"
            onClick={handleClearAll}
            disabled={disabled}
            variant="outline"
            size="sm"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
        <div
          className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

    </div>
  );
};

export default FillGapAnswer; 
