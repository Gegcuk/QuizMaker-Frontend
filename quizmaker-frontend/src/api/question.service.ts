// src/api/question.service.ts
import api from './axiosInstance';
import { PageQuestionDto, QuestionDto } from '../types/api';

// Pagination params
type PageParams = { page: number; size?: number };

export const getAllQuestions = ({ page, size = 20 }: PageParams) =>
  api.get<PageQuestionDto>('/questions', { params: { page, size } });

export const getQuestionById = <T = QuestionDto>(id: string) =>
  api.get<T>(`/questions/${id}`);

export interface QuestionPayload {
  type: QuestionDto['type'];
  difficulty: QuestionDto['difficulty'];
  questionText: string;
  content: any;
  hint?: string;
  explanation?: string;
  attachmentUrl?: string;
  quizIds?: string[];
  tagIds?: string[];
}

export const createQuestion = <T = QuestionDto>(payload: QuestionPayload) =>
  api.post<T>('/questions', payload);

export const updateQuestion = (id: string, payload: QuestionPayload) =>
  api.patch<void>(`/questions/${id}`, payload);

export const deleteQuestion = (id: string) => api.delete<void>(`/questions/${id}`);

// ---------------------------------------------------------------------------
// Quiz-specific helpers
// ---------------------------------------------------------------------------

/** List all questions assigned to a given quiz */
export const getQuizQuestions = (quizId: string) =>
  api.get<QuestionDto[]>(`/quizzes/${quizId}/questions`);

/** Assign an existing question to a quiz */
export const addQuestionToQuiz = (quizId: string, questionId: string) =>
  api.post<void>(`/quizzes/${quizId}/questions`, { questionId });

/** Remove a question from a quiz */
export const removeQuestionFromQuiz = (quizId: string, questionId: string) =>
  api.delete<void>(`/quizzes/${quizId}/questions/${questionId}`);