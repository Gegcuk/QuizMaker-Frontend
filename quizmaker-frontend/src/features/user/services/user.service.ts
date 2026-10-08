// src/api/user.service.ts
import { type AxiosInstance } from 'axios';
import { USER_ENDPOINTS } from '@/api/endpoints';
import { UserProfileResponse, AvatarUploadResponse } from '@/types';
import api from '@/api/axiosInstance';
import { ApplicationError, toApplicationError } from '@/utils/applicationError';


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
  private handleUserError(error: unknown): ApplicationError {
    return toApplicationError(error);
  }
}

// Export a default instance
export const userService = new UserService(api);
