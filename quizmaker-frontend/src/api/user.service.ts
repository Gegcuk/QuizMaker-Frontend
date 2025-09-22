// src/api/user.service.ts
import type { AxiosInstance } from 'axios';
import { USER_ENDPOINTS } from './endpoints';
import { UserDto } from '@/types';
import { BaseService } from './base.service';

/**
 * User service for handling user profile operations
 * Implements all endpoints from the UserController API documentation
 */
export class UserService extends BaseService<UserDto> {
  constructor(axiosInstance: AxiosInstance) {
    super(axiosInstance, '/v1/users');
  }

  /**
   * Get user profile
   * GET /api/v1/users/profile
   */
  async getUserProfile(): Promise<UserDto> {
    try {
      const response = await this.axiosInstance.get<UserDto>(USER_ENDPOINTS.PROFILE);
      return response.data;
    } catch (error) {
      throw this.handleUserError(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/users/profile
   */
  async updateUserProfile(data: Partial<UserDto>): Promise<UserDto> {
    try {
      const response = await this.axiosInstance.put<UserDto>(USER_ENDPOINTS.PROFILE, data);
      return response.data;
    } catch (error) {
      throw this.handleUserError(error);
    }
  }

  /**
   * Get user by ID (admin only)
   * GET /api/v1/users/{id}
   */
  async getUserById(id: string): Promise<UserDto> {
    try {
      const response = await this.axiosInstance.get<UserDto>(USER_ENDPOINTS.USER_BY_ID(id));
      return response.data;
    } catch (error) {
      throw this.handleUserError(error);
    }
  }

  /**
   * Activate user (admin only)
   * POST /api/v1/users/{id}/activate
   */
  async activateUser(id: string): Promise<void> {
    try {
      await this.axiosInstance.post(USER_ENDPOINTS.ACTIVATE_USER(id));
    } catch (error) {
      throw this.handleUserError(error);
    }
  }

  /**
   * Deactivate user (admin only)
   * POST /api/v1/users/{id}/deactivate
   */
  async deactivateUser(id: string): Promise<void> {
    try {
      await this.axiosInstance.post(USER_ENDPOINTS.DEACTIVATE_USER(id));
    } catch (error) {
      throw this.handleUserError(error);
    }
  }

  /**
   * Bulk activate users (admin only)
   * POST /api/v1/users/bulk-activate
   */
  async bulkActivateUsers(userIds: string[]): Promise<void> {
    try {
      await this.axiosInstance.post(USER_ENDPOINTS.BULK_ACTIVATE, { userIds });
    } catch (error) {
      throw this.handleUserError(error);
    }
  }

  /**
   * Bulk deactivate users (admin only)
   * POST /api/v1/users/bulk-deactivate
   */
  async bulkDeactivateUsers(userIds: string[]): Promise<void> {
    try {
      await this.axiosInstance.post(USER_ENDPOINTS.BULK_DEACTIVATE, { userIds });
    } catch (error) {
      throw this.handleUserError(error);
    }
  }

  /**
   * Handle user-specific errors
   */
  private handleUserError(error: any): Error {
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
          return new Error('User not found');
        case 409:
          return new Error('User operation conflict');
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error occurred');
        default:
          return new Error(message || 'User operation failed');
      }
    }

    return new Error(error.message || 'Network error occurred');
  }
}

// Export a default instance
import api from './axiosInstance';
export const userService = new UserService(api); 