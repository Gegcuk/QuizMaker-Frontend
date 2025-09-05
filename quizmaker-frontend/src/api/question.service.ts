import type { AxiosInstance } from 'axios';
import { QUESTION_ENDPOINTS, QUIZ_ENDPOINTS } from './endpoints';
import { 
  CreateQuestionRequest,
  UpdateQuestionRequest,
  QuestionDto
} from '../types/question.types';
import { BaseService } from './base.service';
import api from './axiosInstance';

/**
 * Question service for handling question operations
 * Implements all endpoints from the QuestionController API documentation
 */
export class QuestionService extends BaseService<QuestionDto> {
  constructor(axiosInstance: AxiosInstance) {
    super(axiosInstance, '/v1/questions');
  }

  /**
   * Create a new question
   * POST /api/v1/questions
   */
  async createQuestion(data: CreateQuestionRequest): Promise<{ questionId: string }> {
    try {
      const response = await this.axiosInstance.post<{ questionId: string }>(QUESTION_ENDPOINTS.QUESTIONS, data);
      return response.data;
    } catch (error) {
      throw this.handleQuestionError(error);
    }
  }

  /**
   * Get all questions with pagination and filtering
   * GET /api/v1/questions
   */
  async getQuestions(params?: {
    quizId?: string;
    pageNumber?: number;
    size?: number;
  }): Promise<{
    content: QuestionDto[];
    pageable: {
      pageNumber: number;
      pageSize: number;
      totalElements: number;
      totalPages: number;
    };
  }> {
    try {
      // Support both pageNumber and page query params for compatibility
      const { pageNumber, ...rest } = params || {};
      const mappedParams: any = { ...rest };
      if (typeof pageNumber === 'number') {
        mappedParams.pageNumber = pageNumber;
        mappedParams.page = pageNumber;
      }
      const response = await this.axiosInstance.get(QUESTION_ENDPOINTS.QUESTIONS, {
        params: mappedParams
      });
      return response.data;
    } catch (error) {
      throw this.handleQuestionError(error);
    }
  }

  /**
   * Get question by ID
   * GET /api/v1/questions/{id}
   */
  async getQuestionById(questionId: string): Promise<QuestionDto> {
    try {
      const response = await this.axiosInstance.get<QuestionDto>(QUESTION_ENDPOINTS.QUESTION_BY_ID(questionId));
      return response.data;
    } catch (error) {
      throw this.handleQuestionError(error);
    }
  }

  /**
   * Update question
   * PATCH /api/v1/questions/{id}
   */
  async updateQuestion(questionId: string, data: UpdateQuestionRequest): Promise<QuestionDto> {
    try {
      const response = await this.axiosInstance.patch<QuestionDto>(QUESTION_ENDPOINTS.QUESTION_BY_ID(questionId), data);
      return response.data;
    } catch (error) {
      throw this.handleQuestionError(error);
    }
  }

  /**
   * Delete question
   * DELETE /api/v1/questions/{id}
   */
  async deleteQuestion(questionId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(QUESTION_ENDPOINTS.QUESTION_BY_ID(questionId));
    } catch (error) {
      throw this.handleQuestionError(error);
    }
  }

  /**
   * Handle question-specific errors
   */
  private handleQuestionError(error: any): Error {
    if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          return new Error(`Validation error: ${message}`);
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Insufficient permissions');
        case 404:
          return new Error('Question not found');
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error occurred');
        default:
          return new Error(message || 'Question operation failed');
      }
    }

    return new Error(error.message || 'Network error occurred');
  }
}

// Create service instance
const questionService = new QuestionService(api);

// Export individual functions for backward compatibility
export const getAllQuestions = (params?: {
  quizId?: string;
  pageNumber?: number;
  size?: number;
}) => questionService.getQuestions(params);

export const createQuestion = (data: CreateQuestionRequest) => questionService.createQuestion(data);

export const updateQuestion = (questionId: string, data: UpdateQuestionRequest) => 
  questionService.updateQuestion(questionId, data);

export const deleteQuestion = (questionId: string) => questionService.deleteQuestion(questionId);

// Single-resource fetch
export const getQuestionById = (questionId: string) => questionService.getQuestionById(questionId);

// Additional functions that pages are trying to import
export const getQuizQuestions = (quizId: string) => questionService.getQuestions({ quizId });

export const addQuestionToQuiz = async (quizId: string, questionId: string) => {
  try {
    await api.post(QUIZ_ENDPOINTS.ADD_QUESTION(quizId, questionId));
  } catch (error) {
    throw new Error(`Failed to add question to quiz: ${error}`);
  }
};

export const removeQuestionFromQuiz = async (quizId: string, questionId: string) => {
  try {
    await api.delete(QUIZ_ENDPOINTS.REMOVE_QUESTION(quizId, questionId));
  } catch (error) {
    throw new Error(`Failed to remove question from quiz: ${error}`);
  }
};
