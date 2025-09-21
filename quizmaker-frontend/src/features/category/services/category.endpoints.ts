/**
 * Category endpoints
 * Based on category_controller.md API specification
 */
export const CATEGORY_ENDPOINTS = {
  // Category CRUD operations
  CATEGORIES: '/v1/categories',
  CATEGORY_BY_ID: (id: string) => `/v1/categories/${id}`,
  
  // Analytics (if needed for future expansion)
  ANALYTICS: (id: string) => `/v1/categories/${id}/analytics`,
} as const;
