// src/api/quiz.service.ts
import type { AxiosInstance } from 'axios';
import { QUIZ_ENDPOINTS, RESULT_ENDPOINTS } from '../../../api/endpoints';
import { 
  CreateQuizRequest,
  UpdateQuizRequest,
  QuizDto,
  QuizSearchCriteria,
  GenerateQuizFromDocumentRequest,
  GenerateQuizFromTextRequest,
  QuizGenerationResponse,
  QuizGenerationStatus,
  QuizResultSummaryDto,
  LeaderboardEntryDto,
  UpdateQuizVisibilityRequest,
  UpdateQuizStatusRequest,
  QuizExportRequest
} from '@/types';
import { BaseService } from '../../../api/base.service';
import api from '../../../api/axiosInstance';

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
    scope?: string;
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
   * Get user's own quizzes with pagination and filtering
   * GET /api/v1/quizzes?scope=me
   */
  async getMyQuizzes(params?: {
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
        params: {
          ...params,
          scope: 'me'
        }
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
   * Generate quiz from document upload
   * POST /api/v1/quizzes/generate-from-upload
   */
  async generateQuizFromUpload(formData: FormData): Promise<QuizGenerationResponse> {
    try {
      const response = await this.axiosInstance.post<QuizGenerationResponse>(
        QUIZ_ENDPOINTS.GENERATE_FROM_UPLOAD, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Generate quiz from text
   * POST /api/v1/quizzes/generate-from-text
   */
  async generateQuizFromText(data: GenerateQuizFromTextRequest): Promise<QuizGenerationResponse> {
    try {
      const response = await this.axiosInstance.post<QuizGenerationResponse>(
        QUIZ_ENDPOINTS.GENERATE_FROM_TEXT, 
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
  async getGenerationStatus(jobId: string): Promise<QuizGenerationStatus> {
    try {
      const response = await this.axiosInstance.get<QuizGenerationStatus>(QUIZ_ENDPOINTS.GENERATION_STATUS(jobId));
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
   * Export quizzes
   * GET /api/v1/quizzes/export
   */
  async exportQuizzes(params: QuizExportRequest): Promise<Blob> {
    try {
      const response = await this.axiosInstance.get(QUIZ_ENDPOINTS.EXPORT, {
        params,
        responseType: 'blob'
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
      const errorData = error.response?.data;
      
      // Support both standard and RFC 7807 Problem Details formats
      // RFC 7807: { title, detail, status, type, instance }
      // Standard: { message }
      const message = errorData?.detail || errorData?.title || errorData?.message || error.message;
      console.log('🔧 handleQuizError - status:', status);
      console.log('🔧 handleQuizError - extracted message:', message);

      // For 409 errors, preserve the full axios error with enhanced properties
      if (status === 409) {
        // Check if this is an insufficient balance error
        const messageText = message?.toLowerCase() || '';
        const titleText = errorData?.title?.toLowerCase() || '';
        
        const isBalanceError = 
          messageText.includes('insufficient') ||
          messageText.includes('balance') ||
          messageText.includes('token') ||
          titleText.includes('insufficient') ||
          titleText.includes('balance') ||
          titleText.includes('token');

        if (isBalanceError) {
          // Enhance the original error object instead of creating a new one
          console.log('✅ Detected insufficient balance error!');
          (error as any).code = 'INSUFFICIENT_BALANCE';
          (error as any).isBalanceError = true;
          (error as any).userMessage = message; // Store the user-friendly message
          console.log('✅ Enhanced error with balance flag');
          return error;
        }
      }

      // For other errors, create a new error but preserve the response
      const enhancedError = new Error(message) as any;
      enhancedError.response = error.response;
      enhancedError.isAxiosError = true;
      enhancedError.status = status;

      switch (status) {
        case 400:
          enhancedError.message = `Validation error: ${message}`;
          break;
        case 401:
          enhancedError.message = 'Authentication required';
          break;
        case 403:
          enhancedError.message = 'Insufficient permissions';
          break;
        case 404:
          enhancedError.message = 'Quiz not found';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          enhancedError.message = 'Server error occurred';
          break;
        default:
          enhancedError.message = message || 'Quiz operation failed';
      }
      
      return enhancedError;
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
  scope?: string;
}) => quizService.getQuizzes(params);

export const getMyQuizzes = (params?: {
  page?: number;
  size?: number;
  sort?: string;
  category?: string;
  tag?: string;
  authorName?: string;
  search?: string;
  difficulty?: string;
}) => quizService.getMyQuizzes(params);

export const getQuizById = (quizId: string) => quizService.getQuizById(quizId);

export const createQuiz = (data: CreateQuizRequest) => quizService.createQuiz(data);

export const updateQuiz = (quizId: string, data: UpdateQuizRequest) => 
  quizService.updateQuiz(quizId, data);

export const updateQuizStatus = (quizId: string, data: UpdateQuizStatusRequest) => 
  quizService.updateQuizStatus(quizId, data);

export const deleteQuiz = (quizId: string) => quizService.deleteQuiz(quizId);

export const getQuizResults = (quizId: string) => quizService.getQuizResults(quizId);