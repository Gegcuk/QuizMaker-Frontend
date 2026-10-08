import { type AxiosInstance } from 'axios';
import { TAG_ENDPOINTS } from '@/api/endpoints';
import type {
  TagDto,
  TagPage,
  CreateTagRequest,
  UpdateTagRequest,
} from '@/types';
import api from '@/api/axiosInstance';
import { ApplicationError, toApplicationError } from '@/utils/applicationError';


/**
 * Tag service for handling tag operations
 * Implements all endpoints from the TagController API documentation
 */
export class TagService {
  private readonly axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  /**
   * Get all tags with pagination and sorting
   * GET /api/v1/tags
   */
  async getTags(params?: {
    page?: number;
    size?: number;
    sort?: string | string[];
  }): Promise<TagPage> {
    try {
      const response = await this.axiosInstance.get<TagPage>(TAG_ENDPOINTS.TAGS, {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
          sort: params?.sort ?? 'name,ASC',
        },
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
  private handleTagError(error: unknown): ApplicationError {
    return toApplicationError(error);
  }
}

// Create service instance
const tagService = new TagService(api);

// Export individual functions for backward compatibility
export const getAllTags = (params?: {
  page?: number;
  size?: number;
  sort?: string | string[];
}) => tagService.getTags(params);

export const createTag = (data: CreateTagRequest) => tagService.createTag(data);

export const updateTag = (tagId: string, data: UpdateTagRequest) => 
  tagService.updateTag(tagId, data);

export const deleteTag = (tagId: string) => tagService.deleteTag(tagId);
