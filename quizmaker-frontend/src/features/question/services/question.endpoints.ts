/**
 * Question API endpoints
 * Based on QuestionController API documentation
 */
export const QUESTION_ENDPOINTS = {
  CREATE_QUESTION: '/v1/questions',
  GET_QUESTIONS: '/v1/questions',
  GET_QUESTION: (id: string) => `/v1/questions/${id}`,
  UPDATE_QUESTION: (id: string) => `/v1/questions/${id}`,
  DELETE_QUESTION: (id: string) => `/v1/questions/${id}`,
} as const;
