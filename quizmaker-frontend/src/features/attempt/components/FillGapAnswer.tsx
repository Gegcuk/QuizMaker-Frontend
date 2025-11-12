// src/components/attempt/FillGapAnswer.tsx
// ---------------------------------------------------------------------------
// Component for fill-in-the-blank question answers
// Handles multiple input fields for gap filling
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionForAttemptDto } from '@/types';
import { Button } from '@/components';

interface FillGapAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer?: Record<number, string>;
  onAnswerChange: (answer: Record<number, string>) => void;
  disabled?: boolean;
  className?: string;
}

interface GapAnswer {
  id: number;
  answer: string;
}

const FillGapAnswer: React.FC<FillGapAnswerProps> = ({
  question,
  currentAnswer = {},
  onAnswerChange,
  disabled = false,
  className = ''
}) => {
  const [gapAnswers, setGapAnswers] = useState<Record<number, string>>(currentAnswer || {});

  useEffect(() => {
    setGapAnswers(currentAnswer || {});
  }, [currentAnswer]);

  const handleGapChange = (gapId: number, value: string) => {
    const newAnswers = { ...(gapAnswers || {}), [gapId]: value };
    console.log("FillGapAnswer gap change:", { gapId, value, newAnswers });
    setGapAnswers(newAnswers);
    onAnswerChange(newAnswers);
  };

  const handleClearAll = () => {
    const emptyAnswers: Record<number, string> = {};
    console.log("FillGapAnswer clear all:", emptyAnswers);
    setGapAnswers(emptyAnswers);
    onAnswerChange(emptyAnswers);
  };

  // Extract text and gaps from safe content
  const text = question.safeContent?.text || '';
  const gaps = question.safeContent?.gaps || [];

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
    let currentText = text;
    let gapIndex = 0;

    // Find all gaps marked with {N} and replace them with input fields
    const gapRegex = /\{\d+\}/g;
    let match;
    let lastIndex = 0;
    const matches = currentText.match(gapRegex) || [];
    
    console.log("FillGapAnswer parsing:", {
      textLength: currentText.length,
      gapMatches: matches,
      gapMatchesCount: matches.length,
      gapsArrayLength: gaps.length,
      gapIndex
    });

    while ((match = gapRegex.exec(currentText)) !== null && gapIndex < gaps.length) {
      // Add text before the gap
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${gapIndex}`} className="text-theme-text-primary">
            {currentText.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add gap input
      const gap = gaps[gapIndex];
      const currentValue = gapAnswers?.[gap.id] || '';
      // Calculate dynamic width: minimum 60px, grows with content (roughly 8px per character)
      const inputWidth = Math.max(60, Math.min(currentValue.length * 8 + 20, 400));
      
      parts.push(
        <input
          key={`gap-${gap.id}`}
          type="text"
          value={currentValue}
          onChange={(e) => handleGapChange(gap.id, e.target.value)}
          disabled={disabled}
          placeholder=""
          style={{ width: `${inputWidth}px` }}
          className="mx-1 px-2 py-1 my-1 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary disabled:opacity-50 text-center bg-theme-bg-primary text-theme-text-primary transition-all duration-150"
        />
      );

      lastIndex = match.index + match[0].length;
      gapIndex++;
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
        <p className="font-medium mb-2">Fill in the blanks with the correct words or phrases:</p>
      </div>

      {/* Text with Gaps */}
      <div className="p-6 bg-theme-bg-secondary border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
        <div className="text-lg leading-relaxed">
          {renderTextWithGaps()}
        </div>
      </div>

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
