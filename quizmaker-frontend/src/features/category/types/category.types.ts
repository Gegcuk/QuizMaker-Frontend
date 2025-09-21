// Category-related type definitions
// Based on category_controller.md API specification

/**
 * Category data transfer object
 * Matches CategoryDto from API documentation
 */
export interface CategoryDto {
  id: string;         // UUID
  name: string;
  description?: string; // nullable in Java
}

/**
 * Create category request
 * Matches CreateCategoryRequest from API documentation
 */
export interface CreateCategoryRequest {
  name: string;        // 3-100 chars (@Size only, allows null)
  description?: string; // <= 1000 chars (@Size only)
}

/**
 * Update category request
 * Matches UpdateCategoryRequest from API documentation
 */
export interface UpdateCategoryRequest {
  name?: string;        // 3-100 chars (@Size only, allows null)
  description?: string; // <= 1000 chars (@Size only)
}

/**
 * Paginated response for categories
 */
export interface CategoryPage {
  content: CategoryDto[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  empty: boolean;
}

/**
 * Category creation response
 */
export interface CreateCategoryResponse {
  categoryId: string; // UUID
}
