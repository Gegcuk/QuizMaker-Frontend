import { describe, expect, it } from 'vitest';
import type { FillGapContent } from '../types/question.types';
import { validateFillGapPool } from './fillGapPoolValidation';

const createContent = (gapCount: number, optionCount: number): FillGapContent => {
  const gaps = Array.from({ length: gapCount }, (_, index) => ({
    id: index + 1,
    answer: `answer-${index + 1}`,
  }));
  const distractors = Array.from(
    { length: Math.max(0, optionCount - gapCount) },
    (_, index) => `distractor-${index + 1}`,
  );

  return {
    text: gaps.map((gap) => `{${gap.id}}`).join(' '),
    gaps,
    options: [...gaps.map((gap) => gap.answer), ...distractors],
  };
};

describe('fill-gap answer pool validation', () => {
  it('keeps legacy typed-answer content valid without an options pool', () => {
    const result = validateFillGapPool({
      gaps: [{ id: 1, answer: 'ATP' }],
    });

    expect(result.isConfigured).toBe(false);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it.each([
    [1, 7],
    [1, 8],
    [1, 9],
    [1, 10],
    [2, 8],
    [2, 9],
    [2, 10],
    [3, 9],
    [3, 10],
  ])('accepts %i gaps with a unique %i-option pool', (gapCount, optionCount) => {
    const result = validateFillGapPool(createContent(gapCount, optionCount));

    expect(result.isValid).toBe(true);
    expect(result.optionCount).toBe(optionCount);
  });

  it('rejects totals below the gap-specific minimum and above ten', () => {
    expect(validateFillGapPool(createContent(3, 8)).errors).toContain(
      'Fill-in-the-gap answer pool must contain at least 9 total options, including every correct answer and at least 6 distractors.',
    );
    expect(validateFillGapPool(createContent(1, 11)).errors).toContain(
      'Fill-in-the-gap answer pool must contain no more than 10 total options.',
    );
  });

  it('rejects missing answers and case-insensitive duplicates after trimming', () => {
    const missingAnswer = createContent(1, 7);
    missingAnswer.options = [
      'not-atp',
      'distractor-1',
      'distractor-2',
      'distractor-3',
      'distractor-4',
      'distractor-5',
      'distractor-6',
    ];
    missingAnswer.gaps = [{ id: 1, answer: 'ATP' }];

    expect(validateFillGapPool(missingAnswer).errors).toContain(
      'Fill-in-the-gap answer pool must include every correct gap answer.',
    );

    const duplicate = createContent(1, 7);
    duplicate.options = ['answer-1', 'ATP', ' atp ', 'one', 'two', 'three', 'four'];
    const duplicateResult = validateFillGapPool(duplicate);

    expect(duplicateResult.duplicateOptions).toEqual(['atp']);
    expect(duplicateResult.errors).toContain(
      'Fill-in-the-gap answer pool options must be unique after trimming, ignoring letter case.',
    );
  });
});
