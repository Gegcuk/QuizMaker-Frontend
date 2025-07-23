// Admin-related type definitions
// Used for role management and system administration as documented in the API specification

/**
 * Role data transfer object
 * Matches RoleDto from API documentation
 */
export interface RoleDto {
  roleId: number;                  // Role identifier
  roleName: string;                // Role name
  description: string;             // Role description
  isDefault: boolean;              // Whether this is a default role
  permissions: string[];           // Set of permissions assigned to this role
  userCount: number;               // Number of users with this role
}

/**
 * Create role request
 * Matches CreateRoleRequest from API documentation
 */
export interface CreateRoleRequest {
  roleName: string;                // Required: Role name
  description?: string;            // Optional: Role description
  isDefault?: boolean;             // Optional: Whether this is a default role
}

/**
 * Update role request
 * Matches UpdateRoleRequest from API documentation
 */
export interface UpdateRoleRequest {
  description?: string;            // Optional: Updated description
  isDefault?: boolean;             // Optional: Updated default status
}

/**
 * Permission names enum
 * Based on PermissionName enum from API documentation
 */
export type PermissionName =
  // Quiz Permissions
  | 'QUIZ_READ'
  | 'QUIZ_CREATE'
  | 'QUIZ_UPDATE'
  | 'QUIZ_DELETE'
  | 'QUIZ_PUBLISH'
  | 'QUIZ_MODERATE'
  | 'QUIZ_ADMIN'
  // Question Permissions
  | 'QUESTION_READ'
  | 'QUESTION_CREATE'
  | 'QUESTION_UPDATE'
  | 'QUESTION_DELETE'
  | 'QUESTION_MODERATE'
  | 'QUESTION_ADMIN'
  // Category & Tag Permissions
  | 'CATEGORY_READ'
  | 'CATEGORY_CREATE'
  | 'CATEGORY_UPDATE'
  | 'CATEGORY_DELETE'
  | 'CATEGORY_ADMIN'
  | 'TAG_READ'
  | 'TAG_CREATE'
  | 'TAG_UPDATE'
  | 'TAG_DELETE'
  | 'TAG_ADMIN'
  // User Permissions
  | 'USER_READ'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'USER_MANAGE'
  | 'USER_ADMIN'
  // Role & Permission Management
  | 'ROLE_READ'
  | 'ROLE_CREATE'
  | 'ROLE_UPDATE'
  | 'ROLE_DELETE'
  | 'ROLE_ASSIGN'
  | 'PERMISSION_READ'
  | 'PERMISSION_CREATE'
  | 'PERMISSION_UPDATE'
  | 'PERMISSION_DELETE'
  // System Permissions
  | 'AUDIT_READ'
  | 'SYSTEM_ADMIN'
  | 'NOTIFICATION_READ'
  | 'NOTIFICATION_CREATE'
  | 'NOTIFICATION_ADMIN'
  // Attempt Permissions
  | 'ATTEMPT_CREATE'
  | 'ATTEMPT_READ'
  | 'ATTEMPT_READ_ALL'
  // Comment Permissions
  | 'COMMENT_MODERATE';

/**
 * Role names enum
 * Based on RoleName enum from API documentation
 */
export type RoleName =
  | 'ROLE_USER'           // Basic user - can take quizzes, view public content
  | 'ROLE_QUIZ_CREATOR'   // Can create and manage their own quizzes
  | 'ROLE_MODERATOR'      // Can moderate content, manage reported items
  | 'ROLE_ADMIN'          // Can manage users, categories, and system settings
  | 'ROLE_SUPER_ADMIN';   // Full system access 