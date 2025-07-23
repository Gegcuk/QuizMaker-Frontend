// src/api/quiz.service.ts
import type { AxiosInstance } from 'axios';
import { QUIZ_ENDPOINTS, RESULT_ENDPOINTS } from './endpoints';
import { 
  CreateQuizRequest,
  UpdateQuizRequest,
  QuizDto,
  QuizSearchCriteria,
  GenerateQuizFromDocumentRequest,
  QuizGenerationResponse,
  QuizResultSummaryDto,
  LeaderboardEntryDto,
  UpdateQuizVisibilityRequest,
  UpdateQuizStatusRequest
} from '../types/quiz.types';
import { BaseService } from './base.service';
import api from './axiosInstance';

/**
 * Quiz service for handling quiz operations
 * Implements all endpoints from the QuizController API documentation
 */
export class QuizService extends BaseService<QuizDto> {
  constructor(axiosInstance: AxiosInstance) {
    super(axiosInstance, '/v1/quizzes');
  }

  /**
   * Create a new quiz
   * POST /api/v1/quizzes
   */
  async createQuiz(data: CreateQuizRequest): Promise<{ quizId: string }> {
    try {
      const response = await this.axiosInstance.post<{ quizId: string }>(QUIZ_ENDPOINTS.QUIZZES, data);
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Get all quizzes with pagination and filtering
   * GET /api/v1/quizzes
   */
  async getQuizzes(params?: {
    page?: number;
    size?: number;
    sort?: string;
    category?: string;
    tag?: string;
    authorName?: string;
    search?: string;
    difficulty?: string;
  }): Promise<{
    content: QuizDto[];
    pageable: {
      pageNumber: number;
      pageSize: number;
      totalElements: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await this.axiosInstance.get(QUIZ_ENDPOINTS.QUIZZES, {
        params
      });
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Get quiz by ID
   * GET /api/v1/quizzes/{quizId}
   */
  async getQuizById(quizId: string): Promise<QuizDto> {
    try {
      const response = await this.axiosInstance.get<QuizDto>(QUIZ_ENDPOINTS.QUIZ_BY_ID(quizId));
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Update quiz
   * PATCH /api/v1/quizzes/{quizId}
   */
  async updateQuiz(quizId: string, data: UpdateQuizRequest): Promise<QuizDto> {
    try {
      const response = await this.axiosInstance.patch<QuizDto>(QUIZ_ENDPOINTS.QUIZ_BY_ID(quizId), data);
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Delete quiz
   * DELETE /api/v1/quizzes/{quizId}
   */
  async deleteQuiz(quizId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(QUIZ_ENDPOINTS.QUIZ_BY_ID(quizId));
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Generate quiz from document
   * POST /api/v1/quizzes/generate-from-document
   */
  async generateQuizFromDocument(data: GenerateQuizFromDocumentRequest): Promise<QuizGenerationResponse> {
    try {
      const response = await this.axiosInstance.post<QuizGenerationResponse>(
        QUIZ_ENDPOINTS.GENERATE_FROM_DOCUMENT, 
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Get generation status
   * GET /api/v1/quizzes/generation-status/{jobId}
   */
  async getGenerationStatus(jobId: string): Promise<QuizGenerationResponse & {
    progress?: {
      processedChunks: number;
      totalChunks: number;
      percentage: number;
    };
  }> {
    try {
      const response = await this.axiosInstance.get(QUIZ_ENDPOINTS.GENERATION_STATUS(jobId));
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Get generated quiz
   * GET /api/v1/quizzes/generated-quiz/{jobId}
   */
  async getGeneratedQuiz(jobId: string): Promise<QuizDto> {
    try {
      const response = await this.axiosInstance.get<QuizDto>(QUIZ_ENDPOINTS.GENERATED_QUIZ(jobId));
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Cancel generation job
   * DELETE /api/v1/quizzes/generation-status/{jobId}
   */
  async cancelGenerationJob(jobId: string): Promise<QuizGenerationResponse> {
    try {
      const response = await this.axiosInstance.delete<QuizGenerationResponse>(
        QUIZ_ENDPOINTS.GENERATION_STATUS(jobId)
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Get quiz results summary
   * GET /api/v1/quizzes/{quizId}/results
   */
  async getQuizResults(quizId: string): Promise<QuizResultSummaryDto> {
    try {
      const response = await this.axiosInstance.get<QuizResultSummaryDto>(
        RESULT_ENDPOINTS.QUIZ_RESULTS(quizId)
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Get quiz leaderboard
   * GET /api/v1/quizzes/{quizId}/leaderboard
   */
  async getQuizLeaderboard(quizId: string, top: number = 10): Promise<LeaderboardEntryDto[]> {
    try {
      const response = await this.axiosInstance.get<LeaderboardEntryDto[]>(
        RESULT_ENDPOINTS.LEADERBOARD(quizId),
        {
          params: { top }
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Update quiz visibility
   * PATCH /api/v1/quizzes/{quizId}/visibility
   */
  async updateQuizVisibility(quizId: string, data: UpdateQuizVisibilityRequest): Promise<QuizDto> {
    try {
      const response = await this.axiosInstance.patch<QuizDto>(
        QUIZ_ENDPOINTS.VISIBILITY(quizId),
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Update quiz status
   * PATCH /api/v1/quizzes/{quizId}/status
   */
  async updateQuizStatus(quizId: string, data: UpdateQuizStatusRequest): Promise<QuizDto> {
    try {
      const response = await this.axiosInstance.patch<QuizDto>(
        QUIZ_ENDPOINTS.STATUS(quizId),
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Get public quizzes
   * GET /api/v1/quizzes/public
   */
  async getPublicQuizzes(params?: {
    page?: number;
    size?: number;
    sort?: string;
    category?: string;
    tag?: string;
    authorName?: string;
    search?: string;
    difficulty?: string;
  }): Promise<{
    content: QuizDto[];
    pageable: {
      pageNumber: number;
      pageSize: number;
      totalElements: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await this.axiosInstance.get(QUIZ_ENDPOINTS.PUBLIC_QUIZZES, {
        params
      });
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Handle quiz-specific errors
   */
  private handleQuizError(error: any): Error {
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
          return new Error('Quiz not found');
        case 409:
          return new Error('Quiz conflict occurred');
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error occurred');
        default:
          return new Error(message || 'Quiz operation failed');
      }
    }

    return new Error(error.message || 'Network error occurred');
  }
}

// Create service instance
const quizService = new QuizService(api);

// Export individual functions for backward compatibility
export const getAllQuizzes = (params?: {
  page?: number;
  size?: number;
  sort?: string;
  category?: string;
  tag?: string;
  authorName?: string;
  search?: string;
  difficulty?: string;
}) => quizService.getQuizzes(params);

export const getQuizById = (quizId: string) => quizService.getQuizById(quizId);

export const createQuiz = (data: CreateQuizRequest) => quizService.createQuiz(data);

export const updateQuiz = (quizId: string, data: UpdateQuizRequest) => 
  quizService.updateQuiz(quizId, data);

export const deleteQuiz = (quizId: string) => quizService.deleteQuiz(quizId);

export const getQuizResults = (quizId: string) => quizService.getQuizResults(quizId);