import type { FillGapContent } from '../types/question.types';

export const FILL_GAP_MIN_OPTIONS = 7;
export const FILL_GAP_MAX_OPTIONS = 10;
export const FILL_GAP_MIN_DISTRACTORS = 6;

export const normalizeFillGapOption = (value: unknown): string => (
  typeof value === 'string' ? value.trim() : ''
);
export const getFillGapOptionKey = (value: unknown): string => (
  normalizeFillGapOption(value).toLowerCase()
);

export interface FillGapPoolValidation {
  isConfigured: boolean;
  isValid: boolean;
  optionCount: number;
  uniqueOptionCount: number;
  minimumOptionCount: number;
  maximumOptionCount: number;
  maxDistractorSlots: number;
  distractorCount: number;
  duplicateOptions: string[];
  missingAnswers: string[];
  errors: string[];
}

export const validateFillGapPool = (
  content: Pick<FillGapContent, 'gaps' | 'options'>,
): FillGapPoolValidation => {
  const rawOptions = Array.isArray(content.options) ? content.options : [];
  const isConfigured = rawOptions.length > 0;
  const normalizedOptions = rawOptions.map(normalizeFillGapOption).filter(Boolean);
  const uniqueOptions: string[] = [];
  const duplicateOptions: string[] = [];
  const optionKeys = new Set<string>();

  normalizedOptions.forEach((option) => {
    const key = getFillGapOptionKey(option);
    if (optionKeys.has(key)) {
      if (!duplicateOptions.some((duplicate) => getFillGapOptionKey(duplicate) === key)) {
        duplicateOptions.push(option);
      }
      return;
    }
    optionKeys.add(key);
    uniqueOptions.push(option);
  });

  const gapAnswers = content.gaps
    .map((gap) => normalizeFillGapOption(gap.answer || ''))
    .filter(Boolean);
  const correctAnswerKeys = new Set(gapAnswers.map(getFillGapOptionKey));
  const missingAnswers = gapAnswers.filter((answer, index) => (
    !optionKeys.has(getFillGapOptionKey(answer))
    && gapAnswers.findIndex((candidate) => getFillGapOptionKey(candidate) === getFillGapOptionKey(answer)) === index
  ));
  const minimumOptionCount = Math.max(
    FILL_GAP_MIN_OPTIONS,
    content.gaps.length + FILL_GAP_MIN_DISTRACTORS,
  );
  const distractorCount = uniqueOptions.filter(
    (option) => !correctAnswerKeys.has(getFillGapOptionKey(option)),
  ).length;
  const maxDistractorSlots = Math.max(0, FILL_GAP_MAX_OPTIONS - correctAnswerKeys.size);
  const errors: string[] = [];

  if (isConfigured && duplicateOptions.length > 0) {
    errors.push('Fill-in-the-gap answer pool options must be unique after trimming, ignoring letter case.');
  }
  if (isConfigured && missingAnswers.length > 0) {
    errors.push('Fill-in-the-gap answer pool must include every correct gap answer.');
  }
  if (isConfigured && uniqueOptions.length < minimumOptionCount) {
    errors.push(
      `Fill-in-the-gap answer pool must contain at least ${minimumOptionCount} total options, including every correct answer and at least 6 distractors.`,
    );
  }
  if (isConfigured && normalizedOptions.length > FILL_GAP_MAX_OPTIONS) {
    errors.push(`Fill-in-the-gap answer pool must contain no more than ${FILL_GAP_MAX_OPTIONS} total options.`);
  }

  return {
    isConfigured,
    isValid: !isConfigured || errors.length === 0,
    optionCount: normalizedOptions.length,
    uniqueOptionCount: uniqueOptions.length,
    minimumOptionCount,
    maximumOptionCount: FILL_GAP_MAX_OPTIONS,
    maxDistractorSlots,
    distractorCount,
    duplicateOptions,
    missingAnswers,
    errors,
  };
};
