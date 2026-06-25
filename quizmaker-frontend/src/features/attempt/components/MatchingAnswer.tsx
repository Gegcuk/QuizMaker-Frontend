// ---------------------------------------------------------------------------
// MatchingAnswer.tsx - Matching question answer component for attempts
// Based on MATCHING content from API documentation
// ---------------------------------------------------------------------------

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { QuestionForAttemptDto } from '../types/attempt.types';

interface MatchingPair {
  leftId: number;
  rightId: number;
}

interface MatchingAnswerValue {
  matches: MatchingPair[];
}

interface MatchingItem {
  id: number;
  text: string;
}

interface MatchingCorrectAnswer {
  pairs?: MatchingPair[];
  matches?: MatchingPair[];
}

interface ConnectionLine extends MatchingPair {
  key: string;
}

interface MeasuredConnectionLine extends ConnectionLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface ChosenPair {
  match: MatchingPair;
  leftItem: MatchingItem;
  rightItem: MatchingItem;
}

interface PairStyle {
  borderColor: string;
  bgColor: string;
  badgeColor: string;
}

interface MatchingAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer: MatchingAnswerValue | null;
  onAnswerChange: (answer: MatchingAnswerValue) => void;
  disabled?: boolean;
  className?: string;
  showFeedback?: boolean;
  isCorrect?: boolean;
  correctAnswer?: MatchingCorrectAnswer | null;
}

const PAIR_STYLES: PairStyle[] = [
  {
    borderColor: 'border-theme-matching-pair-1-border',
    bgColor: 'bg-theme-matching-pair-1-bg',
    badgeColor: 'bg-theme-matching-pair-1-badge text-theme-text-inverse',
  },
  {
    borderColor: 'border-theme-matching-pair-2-border',
    bgColor: 'bg-theme-matching-pair-2-bg',
    badgeColor: 'bg-theme-matching-pair-2-badge text-theme-text-inverse',
  },
  {
    borderColor: 'border-theme-matching-pair-3-border',
    bgColor: 'bg-theme-matching-pair-3-bg',
    badgeColor: 'bg-theme-matching-pair-3-badge text-theme-text-inverse',
  },
  {
    borderColor: 'border-theme-matching-pair-4-border',
    bgColor: 'bg-theme-matching-pair-4-bg',
    badgeColor: 'bg-theme-matching-pair-4-badge text-theme-text-inverse',
  },
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const normalizeItems = (items: unknown): MatchingItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.reduce<MatchingItem[]>((acc, item) => {
    if (!isRecord(item)) {
      return acc;
    }

    const id = Number(item.id);
    if (!Number.isFinite(id)) {
      return acc;
    }

    acc.push({
      id,
      text: String(item.text ?? ''),
    });

    return acc;
  }, []);
};

const normalizePairs = (pairs: unknown): MatchingPair[] => {
  if (!Array.isArray(pairs)) {
    return [];
  }

  return pairs.reduce<MatchingPair[]>((acc, pair) => {
    if (!isRecord(pair)) {
      return acc;
    }

    const leftId = Number(pair.leftId);
    const rightId = Number(pair.rightId);

    if (Number.isFinite(leftId) && Number.isFinite(rightId)) {
      acc.push({ leftId, rightId });
    }

    return acc;
  }, []);
};

const getPairKey = ({ leftId, rightId }: MatchingPair) => `${leftId}:${rightId}`;

const pairExists = (pairs: MatchingPair[], leftId: number, rightId: number) =>
  pairs.some((pair) => pair.leftId === leftId && pair.rightId === rightId);

const getPairStyle = (index: number) => PAIR_STYLES[index % PAIR_STYLES.length];

const getOptionLabel = (index: number) => String.fromCharCode(65 + index);

const getConnectionPath = ({ x1, y1, x2, y2 }: MeasuredConnectionLine) => {
  const horizontalDistance = Math.abs(x2 - x1);
  const verticalDistance = Math.abs(y2 - y1);

  if (horizontalDistance >= verticalDistance) {
    const curve = Math.max(48, horizontalDistance * 0.4);
    const direction = x2 >= x1 ? 1 : -1;
    return `M ${x1} ${y1} C ${x1 + curve * direction} ${y1}, ${x2 - curve * direction} ${y2}, ${x2} ${y2}`;
  }

  const curve = Math.max(36, verticalDistance * 0.4);
  const direction = y2 >= y1 ? 1 : -1;
  return `M ${x1} ${y1} C ${x1} ${y1 + curve * direction}, ${x2} ${y2 - curve * direction}, ${x2} ${y2}`;
};

export const MatchingAnswer: React.FC<MatchingAnswerProps> = ({
  question,
  currentAnswer = { matches: [] },
  onAnswerChange,
  disabled = false,
  className = '',
  showFeedback = false,
  isCorrect,
  correctAnswer = null
}) => {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [measuredLines, setMeasuredLines] = useState<MeasuredConnectionLine[]>([]);
  const connectorContainerRef = useRef<HTMLDivElement | null>(null);
  const leftItemRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const rightItemRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const leftItems = useMemo(
    () => normalizeItems(question.safeContent?.left),
    [question.safeContent?.left]
  );
  const rightItems = useMemo(
    () => normalizeItems(question.safeContent?.right),
    [question.safeContent?.right]
  );
  const currentMatches = useMemo(
    () => normalizePairs(currentAnswer?.matches),
    [currentAnswer?.matches]
  );
  const correctPairs = useMemo(
    () => normalizePairs(correctAnswer?.pairs ?? correctAnswer?.matches),
    [correctAnswer]
  );
  const canShowPairFeedback = showFeedback && correctPairs.length > 0;
  const matchedLeftIds = useMemo(
    () => new Set(currentMatches.map((match) => match.leftId)),
    [currentMatches]
  );
  const matchedRightIds = useMemo(
    () => new Set(currentMatches.map((match) => match.rightId)),
    [currentMatches]
  );
  const availableLeftItems = useMemo(
    () => leftItems.filter((item) => !matchedLeftIds.has(item.id)),
    [leftItems, matchedLeftIds]
  );
  const availableRightItems = useMemo(
    () => rightItems.filter((item) => !matchedRightIds.has(item.id)),
    [rightItems, matchedRightIds]
  );
  const chosenPairs = useMemo(
    () => currentMatches
      .map((match) => ({
        match,
        leftItem: leftItems.find((item) => item.id === match.leftId),
        rightItem: rightItems.find((item) => item.id === match.rightId),
      }))
      .filter((pair): pair is ChosenPair => Boolean(pair.leftItem && pair.rightItem)),
    [currentMatches, leftItems, rightItems]
  );
  const connectionLines = useMemo<ConnectionLine[]>(
    () => canShowPairFeedback
      ? correctPairs.map((pair) => ({
        ...pair,
        key: `correct-${getPairKey(pair)}`,
      }))
      : [],
    [canShowPairFeedback, correctPairs]
  );

  useLayoutEffect(() => {
    const container = connectorContainerRef.current;

    if (!container || connectionLines.length === 0) {
      setMeasuredLines([]);
      return;
    }

    const updateMeasuredLines = () => {
      const containerRect = container.getBoundingClientRect();
      const nextLines = connectionLines.reduce<MeasuredConnectionLine[]>((acc, line) => {
        const leftElement = leftItemRefs.current[line.leftId];
        const rightElement = rightItemRefs.current[line.rightId];

        if (!leftElement || !rightElement) {
          return acc;
        }

        const leftRect = leftElement.getBoundingClientRect();
        const rightRect = rightElement.getBoundingClientRect();
        const isSideBySide = leftRect.right <= rightRect.left;

        acc.push({
          ...line,
          x1: isSideBySide
            ? leftRect.right - containerRect.left
            : leftRect.left + leftRect.width / 2 - containerRect.left,
          y1: isSideBySide
            ? leftRect.top + leftRect.height / 2 - containerRect.top
            : leftRect.bottom - containerRect.top,
          x2: isSideBySide
            ? rightRect.left - containerRect.left
            : rightRect.left + rightRect.width / 2 - containerRect.left,
          y2: isSideBySide
            ? rightRect.top + rightRect.height / 2 - containerRect.top
            : rightRect.top - containerRect.top,
        });

        return acc;
      }, []);

      setMeasuredLines(nextLines);
    };

    updateMeasuredLines();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateMeasuredLines);
      return () => window.removeEventListener('resize', updateMeasuredLines);
    }

    const resizeObserver = new ResizeObserver(updateMeasuredLines);
    const observedElements = [
      container,
      ...leftItems.map((item) => leftItemRefs.current[item.id]),
      ...rightItems.map((item) => rightItemRefs.current[item.id]),
    ].filter((element): element is HTMLButtonElement | HTMLDivElement => Boolean(element));

    observedElements.forEach((element) => resizeObserver.observe(element));
    window.addEventListener('resize', updateMeasuredLines);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateMeasuredLines);
    };
  }, [connectionLines, leftItems, rightItems]);

  const getMatchedRightId = (leftId: number) => {
    const match = currentMatches.find((item) => item.leftId === leftId);
    return match?.rightId ?? null;
  };

  const getMatchedLeftId = (rightId: number) => {
    const match = currentMatches.find((item) => item.rightId === rightId);
    return match?.leftId ?? null;
  };

  const getLeftNumber = (leftId: number) => {
    const index = leftItems.findIndex((item) => item.id === leftId);
    return index >= 0 ? index + 1 : leftId;
  };

  const getRightOptionLabel = (rightId: number) => {
    const index = rightItems.findIndex((item) => item.id === rightId);
    return index >= 0 ? getOptionLabel(index) : String(rightId);
  };

  const isMatchCorrect = (leftId: number, rightId: number): boolean =>
    canShowPairFeedback && pairExists(correctPairs, leftId, rightId);

  const getCorrectRightId = (leftId: number): number | null => {
    if (!canShowPairFeedback) return null;
    const correctPair = correctPairs.find((pair) => pair.leftId === leftId);
    return correctPair?.rightId ?? null;
  };

  const isCorrectRightItem = (rightId: number): boolean =>
    canShowPairFeedback && correctPairs.some((pair) => pair.rightId === rightId);

  const handleLeftItemClick = (leftId: number) => {
    if (disabled) return;

    const matchedRightId = getMatchedRightId(leftId);

    if (matchedRightId) {
      const newMatches = currentMatches.filter((match) => match.leftId !== leftId);
      onAnswerChange({ matches: newMatches });
      setSelectedLeft(null);
    } else if (selectedLeft === leftId) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftId);
    }
  };

  const handleRightItemClick = (rightId: number) => {
    if (disabled) return;

    const matchedLeftId = getMatchedLeftId(rightId);

    if (matchedLeftId) {
      const newMatches = currentMatches.filter((match) => match.rightId !== rightId);
      onAnswerChange({ matches: newMatches });
      setSelectedLeft(null);
    } else if (selectedLeft === null) {
      return;
    } else {
      const newMatches = [
        ...currentMatches.filter((match) => match.leftId !== selectedLeft),
        { leftId: selectedLeft, rightId },
      ];
      onAnswerChange({ matches: newMatches });
      setSelectedLeft(null);
    }
  };

  const renderLeftCard = (item: MatchingItem, pairIndex: number | null = null) => {
    const isSelected = selectedLeft === item.id;
    const matchedRightId = getMatchedRightId(item.id);
    const isMatched = matchedRightId !== null;
    const matchIsCorrect = matchedRightId !== null ? isMatchCorrect(item.id, matchedRightId) : false;
    const correctRightId = getCorrectRightId(item.id);

    let borderColor = 'border-theme-border-primary';
    let bgColor = 'bg-theme-bg-primary';
    let badgeColor = 'bg-theme-bg-tertiary text-theme-text-secondary';

    if (canShowPairFeedback) {
      if (matchIsCorrect) {
        borderColor = 'border-theme-interactive-success';
        bgColor = 'bg-theme-bg-success';
        badgeColor = 'bg-theme-interactive-success text-theme-text-inverse';
      } else if (isMatched) {
        borderColor = 'border-theme-interactive-danger';
        bgColor = 'bg-theme-bg-danger';
        badgeColor = 'bg-theme-interactive-danger text-theme-text-inverse';
      } else if (isCorrect === false && correctRightId !== null) {
        borderColor = 'border-theme-interactive-success';
        bgColor = 'bg-theme-bg-success';
        badgeColor = 'bg-theme-interactive-success text-theme-text-inverse';
      }
    } else if (pairIndex !== null) {
      const pairStyle = getPairStyle(pairIndex);
      borderColor = pairStyle.borderColor;
      bgColor = pairStyle.bgColor;
      badgeColor = pairStyle.badgeColor;
    } else if (isSelected) {
      borderColor = 'border-theme-interactive-primary';
      bgColor = 'bg-theme-bg-tertiary';
      badgeColor = 'bg-theme-interactive-primary text-theme-text-inverse';
    }

    return (
      <button
        key={item.id}
        ref={(element) => {
          leftItemRefs.current[item.id] = element;
        }}
        type="button"
        onClick={() => handleLeftItemClick(item.id)}
        disabled={disabled}
        title={isMatched && !disabled ? 'Click to remove this match' : undefined}
        className={`w-full p-3 text-left border-2 rounded-lg transition-colors ${
          disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
        } ${borderColor} ${bgColor} ${!isSelected && !isMatched && !showFeedback ? 'hover:bg-theme-bg-secondary' : ''}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${badgeColor}`}>
              {getLeftNumber(item.id)}
            </span>
            <span className="text-sm text-theme-text-primary">{item.text}</span>
          </div>
          {canShowPairFeedback && matchIsCorrect && (
            <span className="text-theme-interactive-success">✓</span>
          )}
          {canShowPairFeedback && isMatched && !matchIsCorrect && (
            <span className="text-theme-interactive-danger">✗</span>
          )}
          {!showFeedback && isSelected && (
            <span className="text-xs bg-theme-bg-tertiary text-theme-interactive-primary px-2 py-1 rounded">
              Selected
            </span>
          )}
        </div>
      </button>
    );
  };

  const renderRightCard = (item: MatchingItem, pairIndex: number | null = null) => {
    const matchedLeftId = getMatchedLeftId(item.id);
    const isMatched = matchedLeftId !== null;
    const matchIsCorrect = matchedLeftId !== null ? isMatchCorrect(matchedLeftId, item.id) : false;
    const correctRightItem = isCorrectRightItem(item.id);

    let borderColor = 'border-theme-border-primary';
    let bgColor = selectedLeft !== null ? 'bg-theme-bg-primary' : 'bg-theme-bg-secondary';
    let badgeColor = 'bg-theme-bg-tertiary text-theme-text-secondary';

    if (canShowPairFeedback) {
      if (matchIsCorrect) {
        borderColor = 'border-theme-interactive-success';
        bgColor = 'bg-theme-bg-success';
        badgeColor = 'bg-theme-interactive-success text-theme-text-inverse';
      } else if (isMatched) {
        borderColor = 'border-theme-interactive-danger';
        bgColor = 'bg-theme-bg-danger';
        badgeColor = 'bg-theme-interactive-danger text-theme-text-inverse';
      } else if (isCorrect === false && correctRightItem) {
        borderColor = 'border-theme-interactive-success';
        bgColor = 'bg-theme-bg-success';
        badgeColor = 'bg-theme-interactive-success text-theme-text-inverse';
      }
    } else if (pairIndex !== null) {
      const pairStyle = getPairStyle(pairIndex);
      borderColor = pairStyle.borderColor;
      bgColor = pairStyle.bgColor;
      badgeColor = pairStyle.badgeColor;
    }

    return (
      <button
        key={item.id}
        ref={(element) => {
          rightItemRefs.current[item.id] = element;
        }}
        type="button"
        onClick={() => handleRightItemClick(item.id)}
        disabled={disabled || (!showFeedback && selectedLeft === null && !isMatched)}
        title={isMatched && !disabled ? 'Click to remove this match' : undefined}
        className={`w-full p-3 text-left border-2 rounded-lg transition-colors ${
          disabled || (!showFeedback && selectedLeft === null && !isMatched) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
        } ${borderColor} ${bgColor} ${!isMatched && selectedLeft !== null && !showFeedback ? 'hover:bg-theme-bg-secondary' : ''}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${badgeColor}`}>
              {getRightOptionLabel(item.id)}
            </span>
            <span className="text-sm text-theme-text-primary">{item.text}</span>
          </div>
          {canShowPairFeedback && matchIsCorrect && (
            <span className="text-theme-interactive-success">✓</span>
          )}
          {canShowPairFeedback && isMatched && !matchIsCorrect && (
            <span className="text-theme-interactive-danger">✗</span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-sm text-theme-text-secondary mb-4">
        Click a number on the left, then click its matching option on the right. Matched items share a color and move to the bottom.
      </div>

      <div ref={connectorContainerRef} className="relative">
        {measuredLines.length > 0 && (
          <svg
            className="pointer-events-none absolute inset-0 z-10 hidden h-full w-full overflow-visible md:block"
            aria-hidden="true"
          >
            {measuredLines.map((line) => (
              <path
                key={line.key}
                d={getConnectionPath(line)}
                className="text-theme-interactive-success stroke-current stroke-2"
                fill="none"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        )}

        <div className="relative z-20 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-theme-text-secondary mb-3">Numbers</h4>
            <div className="space-y-2">
              {availableLeftItems.map((item) => renderLeftCard(item))}
              {chosenPairs.map(({ leftItem }, index) => renderLeftCard(leftItem, index))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-theme-text-secondary mb-3">Options</h4>
            <div className="space-y-2">
              {availableRightItems.map((item) => renderRightCard(item))}
              {chosenPairs.map(({ rightItem }, index) => renderRightCard(rightItem, index))}
            </div>
          </div>
        </div>
      </div>

      {canShowPairFeedback && (
        <div className="p-3 bg-theme-bg-success border border-theme-border-success rounded-md">
          <p className="text-sm font-medium text-theme-text-primary mb-2">Correct answers</p>
          <div className="flex flex-wrap gap-2">
            {correctPairs.map((pair) => {
              return (
                <span
                  key={`answer-${getPairKey(pair)}`}
                  className="text-xs bg-theme-bg-primary border border-theme-border-success rounded-full px-3 py-1 text-theme-text-primary"
                >
                  {getLeftNumber(pair.leftId)} → {getRightOptionLabel(pair.rightId)}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {selectedLeft !== null && (
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-md p-3">
          <p className="text-sm text-theme-text-primary">
            Now click the matching option on the right, or click the selected number again to cancel.
          </p>
        </div>
      )}

      <div className="text-sm text-theme-text-secondary">
        {currentMatches.length} of {leftItems.length} matches completed
      </div>
    </div>
  );
};
