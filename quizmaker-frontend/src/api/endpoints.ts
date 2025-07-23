// Centralized endpoint definitions for maintainability
// All API services should use these constants instead of hardcoded strings

/**
 * Authentication endpoints
 */
export const AUTH_ENDPOINTS = {
  REGISTER: '/v1/auth/register',
  LOGIN: '/v1/auth/login',
  REFRESH: '/v1/auth/refresh',
  LOGOUT: '/v1/auth/logout',
  ME: '/v1/auth/me',
} as const;

/**
 * User management endpoints
 */
export const USER_ENDPOINTS = {
  PROFILE: '/v1/users/profile',
  USERS: '/v1/users',
  USER_BY_ID: (id: string) => `/v1/users/${id}`,
  ACTIVATE_USER: (id: string) => `/v1/users/${id}/activate`,
  DEACTIVATE_USER: (id: string) => `/v1/users/${id}/deactivate`,
  BULK_ACTIVATE: '/v1/users/bulk-activate',
  BULK_DEACTIVATE: '/v1/users/bulk-deactivate',
} as const;

/**
 * Quiz management endpoints
 */
export const QUIZ_ENDPOINTS = {
  QUIZZES: '/v1/quizzes',
  QUIZ_BY_ID: (id: string) => `/v1/quizzes/${id}`,
  PUBLIC_QUIZZES: '/v1/quizzes/public',
  BULK_UPDATE: '/v1/quizzes/bulk-update',
  BULK_DELETE: '/v1/quizzes',
  VISIBILITY: (id: string) => `/v1/quizzes/${id}/visibility`,
  STATUS: (id: string) => `/v1/quizzes/${id}/status`,
  ADD_QUESTION: (quizId: string, questionId: string) => `/v1/quizzes/${quizId}/questions/${questionId}`,
  REMOVE_QUESTION: (quizId: string, questionId: string) => `/v1/quizzes/${quizId}/questions/${questionId}`,
  ADD_TAG: (quizId: string, tagId: string) => `/v1/quizzes/${quizId}/tags/${tagId}`,
  REMOVE_TAG: (quizId: string, tagId: string) => `/v1/quizzes/${quizId}/tags/${tagId}`,
  CHANGE_CATEGORY: (quizId: string, categoryId: string) => `/v1/quizzes/${quizId}/category/${categoryId}`,
  GENERATE_FROM_DOCUMENT: '/v1/quizzes/generate-from-document',
  GENERATION_STATUS: (jobId: string) => `/v1/quizzes/generation-status/${jobId}`,
  GENERATED_QUIZ: (jobId: string) => `/v1/quizzes/generated-quiz/${jobId}`,
  GENERATION_JOBS: '/v1/quizzes/generation-jobs',
  GENERATION_STATISTICS: '/v1/quizzes/generation-jobs/statistics',
} as const;

/**
 * Question management endpoints
 */
export const QUESTION_ENDPOINTS = {
  QUESTIONS: '/v1/questions',
  QUESTION_BY_ID: (id: string) => `/v1/questions/${id}`,
  ANALYTICS: (id: string) => `/v1/questions/${id}/analytics`,
} as const;

/**
 * Category management endpoints
 */
export const CATEGORY_ENDPOINTS = {
  CATEGORIES: '/v1/categories',
  CATEGORY_BY_ID: (id: string) => `/v1/categories/${id}`,
  ANALYTICS: (id: string) => `/v1/categories/${id}/analytics`,
} as const;

/**
 * Tag management endpoints
 */
export const TAG_ENDPOINTS = {
  TAGS: '/v1/tags',
  TAG_BY_ID: (id: string) => `/v1/tags/${id}`,
  ANALYTICS: (id: string) => `/v1/tags/${id}/analytics`,
} as const;

/**
 * Attempt management endpoints
 */
export const ATTEMPT_ENDPOINTS = {
  START_ATTEMPT: (quizId: string) => `/v1/attempts/quizzes/${quizId}`,
  ATTEMPTS: '/v1/attempts',
  ATTEMPT_BY_ID: (id: string) => `/v1/attempts/${id}`,
  SUBMIT_ANSWER: (id: string) => `/v1/attempts/${id}/answers`,
  SAVE_PROGRESS: (id: string) => `/v1/attempts/${id}/progress`,
  BATCH_ANSWERS: (id: string) => `/v1/attempts/${id}/answers/batch`,
  COMPLETE_ATTEMPT: (id: string) => `/v1/attempts/${id}/complete`,
  ATTEMPT_STATS: (id: string) => `/v1/attempts/${id}/stats`,
  PAUSE_ATTEMPT: (id: string) => `/v1/attempts/${id}/pause`,
  RESUME_ATTEMPT: (id: string) => `/v1/attempts/${id}/resume`,
  SHUFFLED_QUESTIONS: (quizId: string) => `/v1/attempts/quizzes/${quizId}/questions/shuffled`,
} as const;

/**
 * Document management endpoints
 */
export const DOCUMENT_ENDPOINTS = {
  UPLOAD: '/documents/upload',
  CONFIG: '/documents/config',
  DOCUMENTS: '/documents',
  DOCUMENT_BY_ID: (id: string) => `/documents/${id}`,
  CHUNKS: (id: string) => `/documents/${id}/chunks`,
  CHUNK_BY_INDEX: (id: string, index: number) => `/documents/${id}/chunks/${index}`,
  STATUS: (id: string) => `/documents/${id}/status`,
  REPROCESS: (id: string) => `/documents/${id}/reprocess`,
} as const;

/**
 * Result and analytics endpoints
 */
export const RESULT_ENDPOINTS = {
  QUIZ_RESULTS: (quizId: string) => `/v1/quizzes/${quizId}/results`,
  LEADERBOARD: (quizId: string) => `/v1/quizzes/${quizId}/leaderboard`,
  USER_RESULTS: (userId: string) => `/v1/results/user/${userId}`,
  QUIZ_ANALYTICS: (quizId: string) => `/v1/results/quiz/${quizId}/analytics`,
  GLOBAL_STATISTICS: '/v1/results/statistics',
  EXPORT_RESULTS: (quizId: string) => `/v1/results/export/${quizId}`,
} as const;

/**
 * Admin management endpoints
 */
export const ADMIN_ENDPOINTS = {
  ROLES: '/v1/admin/roles',
  ROLE_BY_ID: (id: string) => `/v1/admin/roles/${id}`,
  ASSIGN_ROLE: (userId: string, roleId: string) => `/v1/admin/users/${userId}/roles/${roleId}`,
  SYSTEM_INITIALIZE: '/v1/admin/system/initialize',
  SYSTEM_STATUS: '/v1/admin/system/status',
} as const;

/**
 * Super admin endpoints (dangerous operations)
 */
export const SUPER_ADMIN_ENDPOINTS = {
  DANGEROUS_OPERATION: '/v1/admin/super/dangerous-operation',
  BULK_OPERATIONS: '/v1/admin/super/bulk-operations',
} as const;

/**
 * Common CRUD endpoints pattern
 */
export const createCrudEndpoints = (basePath: string) => ({
  LIST: basePath,
  GET: (id: string) => `${basePath}/${id}`,
  CREATE: basePath,
  UPDATE: (id: string) => `${basePath}/${id}`,
  PATCH: (id: string) => `${basePath}/${id}`,
  DELETE: (id: string) => `${basePath}/${id}`,
  BULK: `${basePath}/bulk`,
  SEARCH: `${basePath}/search`,
  COUNT: `${basePath}/count`,
  BATCH: `${basePath}/batch`,
  EXPORT: `${basePath}/export`,
  UPLOAD: `${basePath}/upload`,
}) as const;

/**
 * All endpoints grouped by domain
 */
export const ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  USER: USER_ENDPOINTS,
  QUIZ: QUIZ_ENDPOINTS,
  QUESTION: QUESTION_ENDPOINTS,
  CATEGORY: CATEGORY_ENDPOINTS,
  TAG: TAG_ENDPOINTS,
  ATTEMPT: ATTEMPT_ENDPOINTS,
  DOCUMENT: DOCUMENT_ENDPOINTS,
  RESULT: RESULT_ENDPOINTS,
  ADMIN: ADMIN_ENDPOINTS,
  SUPER_ADMIN: SUPER_ADMIN_ENDPOINTS,
} as const; 