import type { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  Paginated, 
  PaginationParams, 
  BaseEntity, 
  QueryParams,
  BulkOperationResponse,
  ApiError
} from '../types/common.types';

/**
 * Base service class providing common CRUD operations
 * All domain-specific services should extend this class
 */
export abstract class BaseService<T extends BaseEntity> {
  protected axiosInstance: AxiosInstance;
  protected basePath: string;

  constructor(axiosInstance: AxiosInstance, basePath: string) {
    this.axiosInstance = axiosInstance;
    this.basePath = basePath;
  }

  /**
   * Get all items with pagination
   */
  async getAll(params?: PaginationParams): Promise<Paginated<T>> {
    const response = await this.axiosInstance.get<Paginated<T>>(this.basePath, {
      params
    });
    return response.data;
  }

  /**
   * Get item by ID
   */
  async getById(id: string): Promise<T> {
    const response = await this.axiosInstance.get<T>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Create new item
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const response = await this.axiosInstance.post<T>(this.basePath, data);
    return response.data;
  }

  /**
   * Update item by ID
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    const response = await this.axiosInstance.put<T>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  /**
   * Partially update item by ID
   */
  async patch(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T> {
    const response = await this.axiosInstance.patch<T>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  /**
   * Delete item by ID
   */
  async delete(id: string): Promise<void> {
    await this.axiosInstance.delete(`${this.basePath}/${id}`);
  }

  /**
   * Search items with complex query parameters
   */
  async search(params: QueryParams): Promise<Paginated<T>> {
    const response = await this.axiosInstance.get<Paginated<T>>(`${this.basePath}/search`, {
      params
    });
    return response.data;
  }

  /**
   * Bulk create items
   */
  async bulkCreate(items: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<BulkOperationResponse> {
    const response = await this.axiosInstance.post<BulkOperationResponse>(`${this.basePath}/bulk`, items);
    return response.data;
  }

  /**
   * Bulk update items
   */
  async bulkUpdate(items: Array<{ id: string } & Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>>): Promise<BulkOperationResponse> {
    const response = await this.axiosInstance.put<BulkOperationResponse>(`${this.basePath}/bulk`, items);
    return response.data;
  }

  /**
   * Bulk delete items
   */
  async bulkDelete(ids: string[]): Promise<BulkOperationResponse> {
    const response = await this.axiosInstance.delete<BulkOperationResponse>(`${this.basePath}/bulk`, {
      data: { ids }
    });
    return response.data;
  }

  /**
   * Check if item exists by ID
   */
  async exists(id: string): Promise<boolean> {
    try {
      await this.axiosInstance.head(`${this.basePath}/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Count total items
   */
  async count(): Promise<number> {
    const response = await this.axiosInstance.get<{ count: number }>(`${this.basePath}/count`);
    return response.data.count;
  }

  /**
   * Get items by IDs
   */
  async getByIds(ids: string[]): Promise<T[]> {
    const response = await this.axiosInstance.get<T[]>(`${this.basePath}/batch`, {
      params: { ids: ids.join(',') }
    });
    return response.data;
  }

  /**
   * Export items
   */
  async export(format: 'CSV' | 'XLSX' | 'PDF' | 'JSON', params?: QueryParams): Promise<Blob> {
    const response = await this.axiosInstance.get(`${this.basePath}/export`, {
      params: { ...params, format },
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Upload file
   */
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<{ id: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.axiosInstance.post<{ id: string; url: string }>(`${this.basePath}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
    return response.data;
  }

  /**
   * Protected method for custom API calls
   */
  protected async apiCall<R>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    data?: any,
    config?: any
  ): Promise<R> {
    const response = await this.axiosInstance.request<R>({
      method,
      url: `${this.basePath}${path}`,
      data,
      ...config
    });
    return response.data;
  }

  /**
   * Handle API errors consistently
   */
  protected handleError(error: any): ApiError {
    if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          return {
            type: 'VALIDATION_ERROR',
            details: error.response?.data?.details || {}
          };
        case 401:
          return {
            type: 'AUTHENTICATION_ERROR',
            message
          };
        case 403:
          return {
            type: 'AUTHORIZATION_ERROR',
            message
          };
        case 404:
          return {
            type: 'NOT_FOUND_ERROR',
            resource: this.basePath,
            id: 'unknown'
          };
        case 409:
          return {
            type: 'CONFLICT_ERROR',
            message
          };
        case 429:
          return {
            type: 'RATE_LIMIT_ERROR',
            retryAfter: parseInt(error.response?.headers?.['retry-after'] || '60')
          };
        case 500:
          return {
            type: 'SERVER_ERROR',
            message
          };
        default:
          return {
            type: 'UNKNOWN_ERROR',
            message
          };
      }
    }

    return {
      type: 'NETWORK_ERROR',
      message: error.message || 'Network error occurred'
    };
  }
} 