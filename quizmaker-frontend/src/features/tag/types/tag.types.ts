// Tag-related type definitions
// Used for quiz tag management as documented in the API specification

import { BaseEntity } from '@/types';

/**
 * Tag data transfer object
 * Matches TagDto from API documentation
 */
export interface TagDto extends BaseEntity {
  name: string;                    // Tag name (3-50 characters)
  description?: string;            // Tag description (max 1000 characters)
}

/**
 * Create tag request
 * Matches CreateTagRequest from API documentation
 */
export interface CreateTagRequest {
  name?: string;                   // Tag name (3-50 characters)
  description?: string;            // Tag description (max 1000 characters)
}

/**
 * Update tag request
 * Matches UpdateTagRequest from API documentation
 */
export interface UpdateTagRequest {
  name?: string;                   // Updated tag name (3-50 characters)
  description?: string;            // Updated description (max 1000 characters)
} 