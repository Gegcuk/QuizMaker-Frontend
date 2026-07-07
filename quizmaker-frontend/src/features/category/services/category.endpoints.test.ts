import { describe, expect, it } from 'vitest';
import { CATEGORY_ENDPOINTS } from './category.endpoints';

describe('CATEGORY_ENDPOINTS', () => {
  it('matches the deployed category paths', () => {
    expect(CATEGORY_ENDPOINTS.CATEGORIES).toBe('/v1/categories');
    expect(CATEGORY_ENDPOINTS.CATEGORY_BY_ID('category-1')).toBe(
      '/v1/categories/category-1',
    );
  });
});
