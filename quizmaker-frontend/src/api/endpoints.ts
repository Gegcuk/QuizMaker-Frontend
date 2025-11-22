// Centralized endpoint definitions for maintainability
// All API services should use these constants instead of hardcoded strings


/**
 * User management endpoints
 */
export const USER_ENDPOINTS = {
  PROFILE: '/v1/users/me',                // GET/PATCH /api/v1/users/me (user profile)
  UPLOAD_AVATAR: '/v1/users/me/avatar',   // POST /api/v1/users/me/avatar (upload avatar)
  // Note: Admin user management endpoints below are not yet implemented in backend API
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
  SUBMIT_FOR_REVIEW: (id: string) => `/v1/quizzes/${id}/submit-for-review`,
  ADD_QUESTION: (quizId: string, questionId: string) => `/v1/quizzes/${quizId}/questions/${questionId}`,
  REMOVE_QUESTION: (quizId: string, questionId: string) => `/v1/quizzes/${quizId}/questions/${questionId}`,
  ADD_TAG: (quizId: string, tagId: string) => `/v1/quizzes/${quizId}/tags/${tagId}`,
  REMOVE_TAG: (quizId: string, tagId: string) => `/v1/quizzes/${quizId}/tags/${tagId}`,
  CHANGE_CATEGORY: (quizId: string, categoryId: string) => `/v1/quizzes/${quizId}/category/${categoryId}`,
  // Share link endpoints
  CREATE_SHARE_LINK: (id: string) => `/v1/quizzes/${id}/share-link`,
  GET_SHARE_LINKS: '/v1/quizzes/share-links',
  DELETE_SHARE_LINK: (tokenId: string) => `/v1/quizzes/shared/${tokenId}`,
  GET_SHARED_QUIZ: (token: string) => `/v1/quizzes/shared/${token}`,
  CONSUME_SHARE_LINK: (token: string) => `/v1/quizzes/shared/${token}/consume`,
  // Shared quiz attempts
  START_SHARED_ATTEMPT: (token: string) => `/v1/quizzes/shared/${token}/attempts`,
  SUBMIT_SHARED_ANSWER: (attemptId: string) => `/v1/quizzes/shared/attempts/${attemptId}/answers`,
  SUBMIT_SHARED_BATCH: (attemptId: string) => `/v1/quizzes/shared/attempts/${attemptId}/answers/batch`,
  COMPLETE_SHARED_ATTEMPT: (attemptId: string) => `/v1/quizzes/shared/attempts/${attemptId}/complete`,
  GET_SHARED_ATTEMPT_STATS: (attemptId: string) => `/v1/quizzes/shared/attempts/${attemptId}/stats`,
  GET_SHARED_CURRENT_QUESTION: (attemptId: string) => `/v1/quizzes/shared/attempts/${attemptId}/current-question`,
  // Quiz attempts and results
  GET_QUIZ_ATTEMPTS: (quizId: string) => `/v1/quizzes/${quizId}/attempts`,
  GET_ATTEMPT_STATS: (quizId: string, attemptId: string) => `/v1/quizzes/${quizId}/attempts/${attemptId}/stats`,
  // Generation endpoints
  GENERATE_FROM_DOCUMENT: '/v1/quizzes/generate-from-document',
  GENERATE_FROM_UPLOAD: '/v1/quizzes/generate-from-upload',
  GENERATE_FROM_TEXT: '/v1/quizzes/generate-from-text',
  GENERATION_STATUS: (jobId: string) => `/v1/quizzes/generation-status/${jobId}`,
  GENERATED_QUIZ: (jobId: string) => `/v1/quizzes/generated-quiz/${jobId}`,
  GENERATION_JOBS: '/v1/quizzes/generation-jobs',
  GENERATION_STATISTICS: '/v1/quizzes/generation-jobs/statistics',
  FORCE_CANCEL_JOB: (jobId: string) => `/v1/quizzes/generation-jobs/${jobId}/force-cancel`,
  CLEANUP_STALE_JOBS: '/v1/quizzes/generation-jobs/cleanup-stale',
  EXPORT: '/v1/quizzes/export',
  // Quiz Groups endpoints
  QUIZ_GROUPS: '/v1/quiz-groups',
  QUIZ_GROUP_BY_ID: (id: string) => `/v1/quiz-groups/${id}`,
  QUIZ_GROUP_QUIZZES: (groupId: string) => `/v1/quiz-groups/${groupId}/quizzes`,
  QUIZ_GROUP_QUIZ: (groupId: string, quizId: string) => `/v1/quiz-groups/${groupId}/quizzes/${quizId}`,
} as const;



/**
 * Tag management endpoints
 */
export const TAG_ENDPOINTS = {
  TAGS: '/v1/tags',
  TAG_BY_ID: (id: string) => `/v1/tags/${id}`,
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
  USER: USER_ENDPOINTS,
  QUIZ: QUIZ_ENDPOINTS,
  TAG: TAG_ENDPOINTS,
  RESULT: RESULT_ENDPOINTS,
} as const; 