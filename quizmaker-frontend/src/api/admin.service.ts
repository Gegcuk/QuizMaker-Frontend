import type { AxiosInstance } from 'axios';
import { ADMIN_ENDPOINTS, SUPER_ADMIN_ENDPOINTS } from './endpoints';
import {
  RoleDto,
  CreateRoleRequest,
  UpdateRoleRequest
} from '../types/admin.types';

/**
 * Admin service for handling administrative operations
 * Implements all endpoints from the AdminController API documentation
 */
export class AdminService {
  protected axiosInstance: AxiosInstance;
  protected basePath: string;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
    this.basePath = '/v1/admin';
  }

  /**
   * Get all roles
   * GET /api/v1/admin/roles
   */
  async getAllRoles(): Promise<RoleDto[]> {
    try {
      const response = await this.axiosInstance.get<RoleDto[]>(ADMIN_ENDPOINTS.ROLES);
      return response.data;
    } catch (error) {
      throw this.handleAdminError(error);
    }
  }

  /**
   * Get role by ID
   * GET /api/v1/admin/roles/{roleId}
   */
  async getRoleById(roleId: string): Promise<RoleDto> {
    try {
      const response = await this.axiosInstance.get<RoleDto>(ADMIN_ENDPOINTS.ROLE_BY_ID(roleId));
      return response.data;
    } catch (error) {
      throw this.handleAdminError(error);
    }
  }

  /**
   * Create role
   * POST /api/v1/admin/roles
   */
  async createRole(data: CreateRoleRequest): Promise<RoleDto> {
    try {
      const response = await this.axiosInstance.post<RoleDto>(ADMIN_ENDPOINTS.ROLES, data);
      return response.data;
    } catch (error) {
      throw this.handleAdminError(error);
    }
  }

  /**
   * Update role
   * PUT /api/v1/admin/roles/{roleId}
   */
  async updateRole(roleId: string, data: UpdateRoleRequest): Promise<RoleDto> {
    try {
      const response = await this.axiosInstance.put<RoleDto>(ADMIN_ENDPOINTS.ROLE_BY_ID(roleId), data);
      return response.data;
    } catch (error) {
      throw this.handleAdminError(error);
    }
  }

  /**
   * Delete role
   * DELETE /api/v1/admin/roles/{roleId}
   */
  async deleteRole(roleId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(ADMIN_ENDPOINTS.ROLE_BY_ID(roleId));
    } catch (error) {
      throw this.handleAdminError(error);
    }
  }

  /**
   * Assign role to user
   * POST /api/v1/admin/users/{userId}/roles/{roleId}
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    try {
      await this.axiosInstance.post(ADMIN_ENDPOINTS.ASSIGN_ROLE(userId, roleId));
    } catch (error) {
      throw this.handleAdminError(error);
    }
  }

  /**
   * Remove role from user
   * DELETE /api/v1/admin/users/{userId}/roles/{roleId}
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(ADMIN_ENDPOINTS.ASSIGN_ROLE(userId, roleId));
    } catch (error) {
      throw this.handleAdminError(error);
    }
  }

  /**
   * Initialize system
   * POST /api/v1/admin/system/initialize
   */
  async initializeSystem(): Promise<string> {
    try {
      const response = await this.axiosInstance.post<string>(ADMIN_ENDPOINTS.SYSTEM_INITIALIZE);
      return response.data;
    } catch (error) {
      throw this.handleAdminError(error);
    }
  }

  /**
   * Get system status
   * GET /api/v1/admin/system/status
   */
  async getSystemStatus(): Promise<string> {
    try {
      const response = await this.axiosInstance.get<string>(ADMIN_ENDPOINTS.SYSTEM_STATUS);
      return response.data;
    } catch (error) {
      throw this.handleAdminError(error);
    }
  }

  /**
   * Perform dangerous operation
   * POST /api/v1/admin/super/dangerous-operation
   */
  async performDangerousOperation(): Promise<string> {
    try {
      const response = await this.axiosInstance.post<string>(SUPER_ADMIN_ENDPOINTS.DANGEROUS_OPERATION);
      return response.data;
    } catch (error) {
      throw this.handleAdminError(error);
    }
  }

  /**
   * Handle admin-specific errors
   */
  private handleAdminError(error: any): Error {
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
          return new Error('Resource not found');
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error occurred');
        default:
          return new Error(message || 'Admin operation failed');
      }
    }

    return new Error(error.message || 'Network error occurred');
  }
} 