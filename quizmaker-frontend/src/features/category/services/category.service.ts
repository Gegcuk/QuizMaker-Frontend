import type { AxiosInstance } from 'axios';
import { CATEGORY_ENDPOINTS } from './category.endpoints';
import { 
  CategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryPage,
  CreateCategoryResponse,
} from '@/types';
import { BaseService } from '../../../api/base.service';

/**
 * Category service for handling category operations
 * Implements all endpoints from the CategoryController API documentation
 */
export class CategoryService {
  protected axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  /**
   * Get all categories with pagination and sorting
   * GET /api/v1/categories
   */
  async getCategories(params?: {
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<CategoryPage> {
    try {
      const response = await this.axiosInstance.get<CategoryPage>(CATEGORY_ENDPOINTS.CATEGORIES, {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
          sort: params?.sort ?? 'name,asc',
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleCategoryError(error);
    }
  }

  /**
   * Get category by ID
   * GET /api/v1/categories/{categoryId}
   */
  async getCategoryById(categoryId: string): Promise<CategoryDto> {
    try {
      const response = await this.axiosInstance.get<CategoryDto>(CATEGORY_ENDPOINTS.CATEGORY_BY_ID(categoryId));
      return response.data;
    } catch (error) {
      throw this.handleCategoryError(error);
    }
  }

  /**
   * Create a new category
   * POST /api/v1/categories
   */
  async createCategory(data: CreateCategoryRequest): Promise<CreateCategoryResponse> {
    try {
      const response = await this.axiosInstance.post<CreateCategoryResponse>(CATEGORY_ENDPOINTS.CATEGORIES, data);
      return response.data;
    } catch (error) {
      throw this.handleCategoryError(error);
    }
  }

  /**
   * Update category
   * PATCH /api/v1/categories/{categoryId}
   */
  async updateCategory(categoryId: string, data: UpdateCategoryRequest): Promise<CategoryDto> {
    try {
      const response = await this.axiosInstance.patch<CategoryDto>(CATEGORY_ENDPOINTS.CATEGORY_BY_ID(categoryId), data);
      return response.data;
    } catch (error) {
      throw this.handleCategoryError(error);
    }
  }

  /**
   * Delete category
   * DELETE /api/v1/categories/{categoryId}
   */
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(CATEGORY_ENDPOINTS.CATEGORY_BY_ID(categoryId));
    } catch (error) {
      throw this.handleCategoryError(error);
    }
  }

  /**
   * Handle category-specific errors
   */
  private handleCategoryError(error: any): Error {
    if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      const details = error.response?.data?.details;

      switch (status) {
        case 400:
          return new Error(`Validation error: ${details ? details.join(', ') : message}`);
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Insufficient permissions - Admin role required');
        case 404:
          return new Error('Category not found');
        case 409:
          return new Error('Conflict: Category name already exists or category is in use');
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error occurred');
        default:
          return new Error(message || 'Category operation failed');
      }
    }

    return new Error(error.message || 'Network error occurred');
  }
}

// Export default instance
import api from '../../../api/axiosInstance';
export const categoryService = new CategoryService(api);

// Export individual functions for backward compatibility
export const getAllCategories = (params?: {
  page?: number;
  size?: number;
  sort?: string;
}) => categoryService.getCategories(params);

export const createCategory = (data: CreateCategoryRequest) => categoryService.createCategory(data);

export const updateCategory = (categoryId: string, data: UpdateCategoryRequest) => 
  categoryService.updateCategory(categoryId, data);

export const deleteCategory = (categoryId: string) => categoryService.deleteCategory(categoryId);
