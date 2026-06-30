import { describe, expect, it } from 'vitest';
import type { QuestionForAttemptDto } from '../types/attempt.types';
import {
  buildFillGapResponse,
  buildQuestionResponse,
  isQuestionAnswerProvided,
} from './answerResponse';

const question = (
  type: QuestionForAttemptDto['type'],
  safeContent: QuestionForAttemptDto['safeContent'] = {},
): Pick<QuestionForAttemptDto, 'type' | 'safeContent'> => ({
  type,
  safeContent,
});

describe('buildQuestionResponse', () => {
  it.each([
    ['MCQ_SINGLE', 'b', { selectedOptionId: 'b' }],
    ['MCQ_MULTI', ['a', 'c'], { selectedOptionIds: ['a', 'c'] }],
    ['TRUE_FALSE', false, { answer: false }],
    ['OPEN', 'A typed answer', { answer: 'A typed answer' }],
    ['COMPLIANCE', [1, 3], { selectedStatementIds: [1, 3] }],
    ['HOTSPOT', 4, { selectedRegionId: 4 }],
    ['ORDERING', [3, 1, 2], { orderedItemIds: [3, 1, 2] }],
    [
      'MATCHING',
      { matches: [{ leftId: 1, rightId: 10 }] },
      { matches: [{ leftId: 1, rightId: 10 }] },
    ],
  ] as const)('maps %s component state to its backend response', (type, answer, expected) => {
    expect(buildQuestionResponse(question(type), answer)).toEqual(expected);
  });

  it('maps fill-gap records to sorted, trimmed answer entries', () => {
    expect(
      buildQuestionResponse(question('FILL_GAP'), {
        2: ' ATP ',
        invalid: 'ignored',
        1: ' mitochondria ',
        3: '   ',
      }),
    ).toEqual({
      answers: [
        { gapId: 1, answer: 'mitochondria' },
        { gapId: 2, answer: 'ATP' },
      ],
    });
  });

  it('uses empty contract-safe values for malformed collection answers', () => {
    expect(buildQuestionResponse(question('MCQ_MULTI'), 'a')).toEqual({
      selectedOptionIds: [],
    });
    expect(buildQuestionResponse(question('COMPLIANCE'), null)).toEqual({
      selectedStatementIds: [],
    });
    expect(buildQuestionResponse(question('ORDERING'), null)).toEqual({
      orderedItemIds: [],
    });
    expect(buildQuestionResponse(question('MATCHING'), [])).toEqual({ matches: [] });
    expect(buildQuestionResponse(question('HOTSPOT'), { id: 4 })).toEqual({
      selectedRegionId: null,
    });
  });
});

describe('buildFillGapResponse', () => {
  it('preserves an already-shaped response', () => {
    const response = { answers: [{ gapId: 1, answer: 'Paris' }] };

    expect(buildFillGapResponse(response)).toBe(response);
  });

  it('returns an empty answer list for non-record input', () => {
    expect(buildFillGapResponse(null)).toEqual({ answers: [] });
    expect(buildFillGapResponse([])).toEqual({ answers: [] });
  });
});

describe('isQuestionAnswerProvided', () => {
  it.each([
    ['MCQ_SINGLE', 'a', true],
    ['MCQ_SINGLE', '', false],
    ['MCQ_MULTI', ['a'], true],
    ['MCQ_MULTI', [], false],
    ['TRUE_FALSE', false, true],
    ['TRUE_FALSE', 'false', false],
    ['OPEN', '  ', false],
    ['COMPLIANCE', [2], true],
    ['HOTSPOT', 0, true],
    ['HOTSPOT', null, false],
    ['ORDERING', [1, 2], true],
  ] as const)('recognizes %s answer state', (type, answer, expected) => {
    expect(isQuestionAnswerProvided(question(type), answer)).toBe(expected);
  });

  it('requires one non-empty answer for every fill-gap entry', () => {
    const fillGapQuestion = question('FILL_GAP', {
      gaps: [{ id: 1 }, { id: 2 }],
    });

    expect(isQuestionAnswerProvided(fillGapQuestion, { 1: 'Paris' })).toBe(false);
    expect(
      isQuestionAnswerProvided(fillGapQuestion, { 1: 'Paris', 2: 'France' }),
    ).toBe(true);
  });

  it('requires a matching pair for every left-side item', () => {
    const matchingQuestion = question('MATCHING', {
      left: [{ id: 1 }, { id: 2 }],
    });

    expect(isQuestionAnswerProvided(matchingQuestion, { matches: [] })).toBe(false);
    expect(
      isQuestionAnswerProvided(matchingQuestion, {
        matches: [{ leftId: 1, rightId: 10 }],
      }),
    ).toBe(false);
    expect(
      isQuestionAnswerProvided(matchingQuestion, {
        matches: [
          { leftId: 1, rightId: 10 },
          { leftId: 2, rightId: 20 },
        ],
      }),
    ).toBe(true);
  });
});
