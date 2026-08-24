import { describe, expect, it } from 'vitest';
import type { McqOption } from '../types/question.types';
import {
  ensureUniqueMcqOptionIds,
  getNextMcqOptionId,
  hasUniqueMcqOptionIds,
} from './mcqOptionIdentity';

const option = (id: string): McqOption => ({ id, text: id, correct: false });

describe('MCQ option identity', () => {
  it('finds a free identifier without renumbering surviving options', () => {
    const options = [option('a'), option('c'), option('d'), option('e')];

    expect(getNextMcqOptionId(options)).toBe('b');
    expect(options.map(({ id }) => id)).toEqual(['a', 'c', 'd', 'e']);
  });

  it('preserves valid legacy identifiers and repairs only missing or duplicate values', () => {
    const options = [option('legacy-a'), option('legacy-b'), option('legacy-b'), option('')];

    expect(ensureUniqueMcqOptionIds(options).map(({ id }) => id)).toEqual([
      'legacy-a',
      'legacy-b',
      'a',
      'b',
    ]);
  });

  it('treats blank, whitespace, and case-only duplicates as invalid', () => {
    expect(hasUniqueMcqOptionIds([option('a'), option(' b ')])).toBe(true);
    expect(hasUniqueMcqOptionIds([option('a'), option('A')])).toBe(false);
    expect(hasUniqueMcqOptionIds([option('a'), option('   ')])).toBe(false);
    expect(hasUniqueMcqOptionIds([{ id: 'a' }, { id: 2 }])).toBe(false);
  });
});
