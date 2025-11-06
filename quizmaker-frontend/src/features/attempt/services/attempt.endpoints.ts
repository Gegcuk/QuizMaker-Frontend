/**
 * Attempt API endpoints
 * Based on AttemptController API documentation
 */
export const ATTEMPT_ENDPOINTS = {
  START_ATTEMPT: (quizId: string) => `/v1/attempts/quizzes/${quizId}`,
  GET_ATTEMPTS: '/v1/attempts',
  GET_ATTEMPT: (id: string) => `/v1/attempts/${id}`,
  SUBMIT_ANSWER: (id: string) => `/v1/attempts/${id}/answers`,
  SUBMIT_BATCH_ANSWERS: (id: string) => `/v1/attempts/${id}/answers/batch`,
  COMPLETE_ATTEMPT: (id: string) => `/v1/attempts/${id}/complete`,
  GET_ATTEMPT_STATS: (id: string) => `/v1/attempts/${id}/stats`,
  GET_ANSWER_KEY: (id: string) => `/v1/attempts/${id}/answer-key`,
  GET_REVIEW: (id: string) => `/v1/attempts/${id}/review`,
  PAUSE_ATTEMPT: (id: string) => `/v1/attempts/${id}/pause`,
  RESUME_ATTEMPT: (id: string) => `/v1/attempts/${id}/resume`,
  DELETE_ATTEMPT: (id: string) => `/v1/attempts/${id}`,
  CURRENT_QUESTION: (id: string) => `/v1/attempts/${id}/current-question`,
  SHUFFLED_QUESTIONS: (quizId: string) => `/v1/attempts/quizzes/${quizId}/questions/shuffled`,
} as const;
