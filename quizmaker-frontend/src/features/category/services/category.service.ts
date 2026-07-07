import { isAxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import { CATEGORY_ENDPOINTS } from './category.endpoints';
import type {
  CategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryPage,
  CreateCategoryResponse,
} from '@/types';
import { getErrorMessage } from '@/utils/errorUtils';

type CategoryServiceError = Error & {
  status?: number;
  response?: AxiosResponse;
};

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
    sort?: string | string[];
  }): Promise<CategoryPage> {
    try {
      const response = await this.axiosInstance.get<CategoryPage>(CATEGORY_ENDPOINTS.CATEGORIES, {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
          sort: params?.sort ?? 'name,ASC',
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
  private handleCategoryError(error: unknown): CategoryServiceError {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const message = getErrorMessage(error);
      const categoryError: CategoryServiceError = new Error(message);
      categoryError.status = status;
      categoryError.response = error.response;

      switch (status) {
        case 400:
          categoryError.message = `Validation error: ${message}`;
          break;
        case 401:
          categoryError.message = 'Authentication required';
          break;
        case 403:
          categoryError.message = 'Insufficient permissions - Admin role required';
          break;
        case 404:
          categoryError.message = 'Category not found';
          break;
        case 409:
          categoryError.message = `Conflict: ${message}`;
          break;
        case 429:
          categoryError.message = 'Too many requests. Please try again later.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          categoryError.message = 'Server error occurred';
          break;
        default:
          categoryError.message = message || 'Category operation failed';
      }

      return categoryError;
    }

    return new Error(error instanceof Error ? error.message : 'Network error occurred');
  }
}

// Export default instance
import api from '../../../api/axiosInstance';
export const categoryService = new CategoryService(api);

// Export individual functions for backward compatibility
export const getAllCategories = (params?: {
  page?: number;
  size?: number;
  sort?: string | string[];
}) => categoryService.getCategories(params);

export const createCategory = (data: CreateCategoryRequest) => categoryService.createCategory(data);

export const updateCategory = (categoryId: string, data: UpdateCategoryRequest) => 
  categoryService.updateCategory(categoryId, data);

export const deleteCategory = (categoryId: string) => categoryService.deleteCategory(categoryId);
