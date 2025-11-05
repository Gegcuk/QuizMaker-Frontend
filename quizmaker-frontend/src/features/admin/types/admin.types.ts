// Admin-related type definitions
// Used for role management and system administration as documented in the API specification

/**
 * Role entity (full entity with relationships)
 * Matches Role from API documentation
 */
export interface Role {
  roleId: number;                  // Role identifier
  roleName: string;                // Role name
  description?: string;            // Role description
  default: boolean;                // Whether this is a default role
  users?: User[];                  // Users assigned to this role
  permissions?: Permission[];      // Full permission objects (circular reference handled)
}

/**
 * User entity reference (simplified to avoid circular dependency)
 * Full User type is in auth/user types
 */
export interface User {
  id: string;                      // User UUID
  username: string;                // Username
  email: string;                   // Email
  active: boolean;                 // Whether user is active
  // Other fields omitted to avoid circular dependencies
}

/**
 * Role data transfer object (simplified DTO for display)
 * Matches RoleDto from API documentation
 */
export interface RoleDto {
  roleId: number;                  // Role identifier
  roleName: string;                // Role name
  description: string;             // Role description
  default: boolean;                // Whether this is a default role
  permissions: string[];           // Set of permission names (strings, not full objects)
  userCount: number;               // Number of users with this role
}

/**
 * Create role request
 * Matches CreateRoleRequest from API documentation
 */
export interface CreateRoleRequest {
  roleName: string;                // Required: Role name
  description?: string;            // Optional: Role description
  default?: boolean;               // Optional: Whether this is a default role
}

/**
 * Update role request
 * Matches UpdateRoleRequest from API documentation
 */
export interface UpdateRoleRequest {
  description?: string;            // Optional: Updated description
  default?: boolean;               // Optional: Updated default status
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
  | 'COMMENT_MODERATE'
  // Billing Permissions
  | 'BILLING_READ'
  | 'BILLING_WRITE';

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

/**
 * Permission data transfer object
 * Matches Permission from API documentation
 */
export interface Permission {
  permissionId: number;     // Numeric ID
  permissionName: string;   // e.g., "QUIZ_CREATE"
  description?: string;     // Human-readable description
  resource?: string;        // Resource type, e.g., "quiz"
  action?: string;          // Action type, e.g., "create"
  roles?: Role[];           // Roles that have this permission (array, not Set)
}

/**
 * Create permission request
 * Matches CreatePermissionRequest from API documentation
 */
export interface CreatePermissionRequest {
  permissionName: string;   // Required, unique (e.g., "QUIZ_EXPORT"), normalized to uppercase
  description?: string;     // Optional
  resource?: string;        // Optional
  action?: string;          // Optional
}

/**
 * Update permission request
 * Matches UpdatePermissionRequest from API documentation
 */
export interface UpdatePermissionRequest {
  description?: string;     // Optional
  resource?: string;        // Optional
  action?: string;          // Optional
}

/**
 * Reconciliation result
 * Matches ReconciliationResult from API documentation
 */
export interface ReconciliationResult {
  success: boolean;                        // Whether reconciliation succeeded
  message: string;                         // Human-readable result message
  permissionsAdded: number;               // Count of permissions added
  permissionsRemoved: number;             // Count of permissions removed
  rolesAdded: number;                     // Count of roles added
  rolesUpdated: number;                   // Count of roles updated
  rolePermissionMappingsUpdated: number;  // Count of role-permission mappings updated
  errors: string[];                       // List of error messages
}

/**
 * Policy difference
 * Matches PolicyDiff from API documentation
 */
export interface PolicyDiff {
  missingPermissions: string[];              // Permissions in manifest but not in DB
  extraPermissions: string[];                // Permissions in DB but not in manifest
  missingRoles: string[];                    // Roles in manifest but not in DB
  extraRoles: string[];                      // Roles in DB but not in manifest
  rolePermissionMismatches: Record<string, string[]>;  // Role name -> missing permissions (object, not Map)
  manifestVersion: string;                   // Version of the canonical manifest
  isInSync: boolean;                         // Whether DB is in sync with manifest
}

/**
 * Quiz moderation audit entry
 * Matches QuizModerationAuditDto from API documentation
 */
export interface QuizModerationAuditDto {
  id: string;                              // Audit UUID
  quizId: string;                          // Quiz UUID
  moderatorId: string;                     // Moderator UUID
  action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'UNPUBLISH';  // Moderation action
  reason?: string;                         // Reason for the action
  createdAt: string;                       // Timestamp (ISO 8601)
}

/**
 * Pending review quiz summary
 * Matches PendingReviewQuizDto from API documentation
 */
export interface PendingReviewQuizDto {
  id: string;                              // Quiz UUID
  title: string;                           // Quiz title
  creatorId: string;                       // Creator user UUID
  createdAt: string;                       // Created timestamp (ISO 8601)
}

/**
 * Email provider status
 * Matches EmailProviderStatus from API documentation
 */
export interface EmailProviderStatus {
  providerClass: string;                   // Email provider class name (e.g., "AwsSesEmailService")
  isNoop: boolean;                         // Whether using no-op provider
  isSes: boolean;                          // Whether using AWS SES
  isSmtp: boolean;                         // Whether using SMTP
}

/**
 * Paginated response wrapper
 * Used for paginated endpoints like GET /roles/paginated
 */
export interface Page<T> {
  content: T[];                           // Array of items for current page
  pageable: {
    sort: {
      sorted: boolean;
      unsorted: boolean;
    };
    pageNumber: number;                   // Current page number (0-based)
    pageSize: number;                     // Number of items per page
  };
  totalElements: number;                  // Total number of items across all pages
  totalPages: number;                     // Total number of pages
  first: boolean;                         // Whether this is the first page
  last: boolean;                          // Whether this is the last page
}