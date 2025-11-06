/**
 * Category endpoints
 * Based on CategoryController API specification from OpenAPI
 */
export const CATEGORY_ENDPOINTS = {
  // Category CRUD operations
  CATEGORIES: '/v1/categories',
  CATEGORY_BY_ID: (id: string) => `/v1/categories/${id}`,
} as const;
