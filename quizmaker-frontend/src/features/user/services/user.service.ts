// src/api/user.service.ts
import { isAxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import { USER_ENDPOINTS } from '@/api/endpoints';
import { UserProfileResponse, AvatarUploadResponse } from '@/types';
import api from '@/api/axiosInstance';
import { getErrorMessage } from '@/utils/errorUtils';

type UserServiceError = Error & {
  status?: number;
  response?: AxiosResponse;
};

/**
 * User service for handling user profile operations
 * Implements all endpoints from the UserController API documentation
 */
export class UserService {
  private readonly axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  /**
   * Get user profile
   * GET /api/v1/users/me
   */
  async getUserProfile(): Promise<UserProfileResponse> {
    try {
      const response = await this.axiosInstance.get<UserProfileResponse>(USER_ENDPOINTS.PROFILE);
      return response.data;
    } catch (error) {
      throw this.handleUserError(error);
    }
  }

  /**
   * Upload user avatar
   * POST /api/v1/users/me/avatar
   * Accepts PNG, JPEG, WEBP. Image is resized to max 512x512.
   */
  async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await this.axiosInstance.post<AvatarUploadResponse>(
        USER_ENDPOINTS.UPLOAD_AVATAR,
        formData,
        {
          _isFileUpload: true,  // Flag for request interceptor to handle Content-Type
        } as any
      );
      return response.data;
    } catch (error) {
      throw this.handleUserError(error);
    }
  }

  /**
   * Update user profile
   * PATCH /api/v1/users/me
   */
  async updateUserProfile(data: Partial<UserProfileResponse>): Promise<UserProfileResponse> {
    try {
      const response = await this.axiosInstance.patch<UserProfileResponse>(USER_ENDPOINTS.PROFILE, data);
      return response.data;
    } catch (error) {
      throw this.handleUserError(error);
    }
  }

  /**
   * Handle user-specific errors
   */
  private handleUserError(error: unknown): UserServiceError {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const message = getErrorMessage(error);
      const userError: UserServiceError = new Error(message);
      userError.status = status;
      userError.response = error.response;

      switch (status) {
        case 400:
          userError.message = `Validation error: ${message}`;
          break;
        case 401:
          userError.message = 'Authentication required';
          break;
        case 403:
          userError.message = 'Insufficient permissions';
          break;
        case 404:
          userError.message = 'User not found';
          break;
        case 409:
          userError.message = `Conflict: ${message}`;
          break;
        case 429:
          userError.message = 'Too many requests. Please try again later.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          userError.message = 'Server error occurred';
          break;
        default:
          userError.message = message || 'User operation failed';
      }

      return userError;
    }

    return new Error(error instanceof Error ? error.message : 'Network error occurred');
  }
}

// Export a default instance
export const userService = new UserService(api);
