import { describe, expect, it } from 'vitest';
import { TAG_ENDPOINTS } from '@/api/endpoints';

describe('TAG_ENDPOINTS', () => {
  it('matches the deployed tag paths', () => {
    expect(TAG_ENDPOINTS.TAGS).toBe('/v1/tags');
    expect(TAG_ENDPOINTS.TAG_BY_ID('tag-1')).toBe('/v1/tags/tag-1');
  });
});
