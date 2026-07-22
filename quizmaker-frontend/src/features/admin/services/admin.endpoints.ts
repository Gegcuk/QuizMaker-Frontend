/**
 * Admin management endpoints
 */
export const ADMIN_ENDPOINTS = {
  // Role management
  ROLES: '/v1/admin/roles',
  ROLES_PAGINATED: '/v1/admin/roles/paginated',
  ROLE_BY_ID: (id: string) => `/v1/admin/roles/${id}`,
  ASSIGN_ROLE: (userId: string, roleId: string) => `/v1/admin/users/${userId}/roles/${roleId}`,
  REMOVE_ROLE: (userId: string, roleId: string) => `/v1/admin/users/${userId}/roles/${roleId}`,
  
  // Permission management
  PERMISSIONS: '/v1/admin/permissions',
  PERMISSION_BY_ID: (id: string) => `/v1/admin/permissions/${id}`,
  ASSIGN_PERMISSION_TO_ROLE: (roleId: string, permissionId: string) => `/v1/admin/roles/${roleId}/permissions/${permissionId}`,
  REMOVE_PERMISSION_FROM_ROLE: (roleId: string, permissionId: string) => `/v1/admin/roles/${roleId}/permissions/${permissionId}`,
  
  // System management
  SYSTEM_INITIALIZE: '/v1/admin/system/initialize',
  SYSTEM_STATUS: '/v1/admin/system/status',
  BILLING_PACKS_SYNC: '/v1/admin/billing/packs/sync',
  
  // Policy reconciliation
  POLICY_RECONCILE: '/v1/admin/policy/reconcile',
  POLICY_STATUS: '/v1/admin/policy/status',
  POLICY_VERSION: '/v1/admin/policy/version',
  POLICY_RECONCILE_ROLE: (roleName: string) => `/v1/admin/policy/reconcile/${roleName}`,

  // Email diagnostics
  EMAIL_PROVIDER_STATUS: '/v1/admin/email/provider-status',
  TEST_PASSWORD_RESET_EMAIL: '/v1/admin/email/test-password-reset',
  TEST_VERIFICATION_EMAIL: '/v1/admin/email/test-verification',

  // Quiz moderation
  PENDING_REVIEW_QUIZZES: '/v1/admin/quizzes/pending-review',
  QUIZ_AUDITS: (quizId: string) => `/v1/admin/quizzes/${quizId}/audits`,
  APPROVE_QUIZ: (quizId: string) => `/v1/admin/quizzes/${quizId}/approve`,
  REJECT_QUIZ: (quizId: string) => `/v1/admin/quizzes/${quizId}/reject`,
  UNPUBLISH_QUIZ: (quizId: string) => `/v1/admin/quizzes/${quizId}/unpublish`,
} as const;

/**
 * Super admin endpoints (dangerous operations)
 */
export const SUPER_ADMIN_ENDPOINTS = {
  DANGEROUS_OPERATION: '/v1/admin/super/dangerous-operation',
} as const;
