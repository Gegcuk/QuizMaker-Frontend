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