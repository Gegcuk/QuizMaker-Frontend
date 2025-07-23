import type { AxiosInstance } from 'axios';
import { QUESTION_ENDPOINTS } from './endpoints';
import { 
  CreateQuestionRequest,
  UpdateQuestionRequest,
  QuestionDto
} from '../types/question.types';
import { BaseService } from './base.service';

/**
 * Question service for handling question operations
 * Implements all endpoints from the QuestionController API documentation
 */
export class QuestionService extends BaseService<QuestionDto> {
  constructor(axiosInstance: AxiosInstance) {
    super(axiosInstance, '/api/v1/questions');
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
      const response = await this.axiosInstance.get(QUESTION_ENDPOINTS.QUESTIONS, {
        params
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