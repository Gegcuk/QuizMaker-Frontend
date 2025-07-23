import type { AxiosInstance } from 'axios';
import { TAG_ENDPOINTS } from './endpoints';
import { 
  TagDto,
  CreateTagRequest,
  UpdateTagRequest
} from '../types/tag.types';
import { BaseService } from './base.service';

/**
 * Tag service for handling tag operations
 * Implements all endpoints from the TagController API documentation
 */
export class TagService extends BaseService<TagDto> {
  constructor(axiosInstance: AxiosInstance) {
    super(axiosInstance, '/api/v1/tags');
  }

  /**
   * Get all tags with pagination and sorting
   * GET /api/v1/tags
   */
  async getTags(params?: {
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<{
    content: TagDto[];
    pageable: {
      pageNumber: number;
      pageSize: number;
      totalElements: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await this.axiosInstance.get(TAG_ENDPOINTS.TAGS, {
        params
      });
      return response.data;
    } catch (error) {
      throw this.handleTagError(error);
    }
  }

  /**
   * Create a new tag
   * POST /api/v1/tags
   */
  async createTag(data: CreateTagRequest): Promise<{ tagId: string }> {
    try {
      const response = await this.axiosInstance.post<{ tagId: string }>(TAG_ENDPOINTS.TAGS, data);
      return response.data;
    } catch (error) {
      throw this.handleTagError(error);
    }
  }

  /**
   * Get tag by ID
   * GET /api/v1/tags/{tagId}
   */
  async getTagById(tagId: string): Promise<TagDto> {
    try {
      const response = await this.axiosInstance.get<TagDto>(TAG_ENDPOINTS.TAG_BY_ID(tagId));
      return response.data;
    } catch (error) {
      throw this.handleTagError(error);
    }
  }

  /**
   * Update tag
   * PATCH /api/v1/tags/{tagId}
   */
  async updateTag(tagId: string, data: UpdateTagRequest): Promise<TagDto> {
    try {
      const response = await this.axiosInstance.patch<TagDto>(TAG_ENDPOINTS.TAG_BY_ID(tagId), data);
      return response.data;
    } catch (error) {
      throw this.handleTagError(error);
    }
  }

  /**
   * Delete tag
   * DELETE /api/v1/tags/{tagId}
   */
  async deleteTag(tagId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(TAG_ENDPOINTS.TAG_BY_ID(tagId));
    } catch (error) {
      throw this.handleTagError(error);
    }
  }

  /**
   * Handle tag-specific errors
   */
  private handleTagError(error: any): Error {
    if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          return new Error(`Validation error: ${message}`);
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Insufficient permissions');
        case 404:
          return new Error('Tag not found');
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error occurred');
        default:
          return new Error(message || 'Tag operation failed');
      }
    }

    return new Error(error.message || 'Network error occurred');
  }
}