// Category-related type definitions
// Used for quiz category management as documented in the API specification

import { BaseEntity } from './common.types';

/**
 * Category data transfer object
 * Matches CategoryDto from API documentation
 */
export interface CategoryDto extends BaseEntity {
  name: string;                    // Category name (3-100 characters)
  description?: string;            // Category description (max 1000 characters)
}

/**
 * Create category request
 * Matches CreateCategoryRequest from API documentation
 */
export interface CreateCategoryRequest {
  name: string;                    // Required: Category name (3-100 characters)
  description?: string;            // Optional: Category description (max 1000 characters)
}

/**
 * Update category request
 * Matches UpdateCategoryRequest from API documentation
 */
export interface UpdateCategoryRequest {
  name: string;                    // Required: Updated category name (3-100 characters)
  description?: string;            // Optional: Updated description (max 1000 characters)
} 