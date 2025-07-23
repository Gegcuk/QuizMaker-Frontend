// Authentication-related type definitions
// Used for user registration, login, token management, and user profile operations as documented in the API specification

import { BaseEntity, AuditableEntity } from './common.types';

/**
 * User registration request
 * Matches RegisterRequest DTO from API documentation
 */
export interface RegisterRequest {
  username: string;  // 4-20 characters
  email: string;     // Valid email format
  password: string;  // 8-100 characters
}

/**
 * User login request
 * Matches LoginRequest DTO from API documentation
 */
export interface LoginRequest {
  username: string;  // Username or email
  password: string;  // User password
}

/**
 * JWT authentication response
 * Matches JwtResponse DTO from API documentation
 */
export interface JwtResponse {
  accessToken: string;           // JWT access token
  refreshToken: string;          // JWT refresh token
  accessExpiresInMs: number;     // Access token validity (ms)
  refreshExpiresInMs: number;    // Refresh token validity (ms)
}

/**
 * Token refresh request
 * Matches RefreshRequest DTO from API documentation
 */
export interface RefreshRequest {
  refreshToken: string;  // Valid refresh token
}

/**
 * User data transfer object
 * Matches UserDto from API documentation
 */
export interface UserDto extends BaseEntity, AuditableEntity {
  username: string;            // Username
  email: string;               // Email address
  isActive: boolean;           // Account status
  roles: string[];             // User roles (e.g., ["ROLE_USER"])
  lastLoginDate?: string;      // Last login time
}

/**
 * Available user roles from API documentation
 */
export type UserRole = 
  | 'ROLE_USER'           // Basic user - can take quizzes, view public content
  | 'ROLE_QUIZ_CREATOR'   // Can create and manage their own quizzes
  | 'ROLE_MODERATOR'      // Can moderate content, manage reported items
  | 'ROLE_ADMIN'          // Can manage users, categories, and system settings
  | 'ROLE_SUPER_ADMIN';   // Full system access 