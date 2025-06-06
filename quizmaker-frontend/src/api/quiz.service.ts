// src/api/quiz.service.ts
import api from './axiosInstance';
import {
  QuizDto,
  PageQuizDto,
  CreateQuizRequest,
  UpdateQuizRequest,
} from '../types/api';

type ListParams = { page: number; size?: number };

export const getAllQuizzes = ({ page, size = 20 }: ListParams) =>
  api.get<PageQuizDto>('/quizzes', { params: { page, size } });

export const getQuizById = <T = QuizDto>(quizId: string) =>
  api.get<T>(`/quizzes/${quizId}`);

export const createQuiz = <T = QuizDto>(payload: CreateQuizRequest) =>
  api.post<T>('/quizzes', payload);

export const updateQuiz = (quizId: string, payload: UpdateQuizRequest) =>
  api.patch<void>(`/quizzes/${quizId}`, payload);

export const deleteQuiz = (quizId: string) =>
  api.delete<void>(`/quizzes/${quizId}`);
