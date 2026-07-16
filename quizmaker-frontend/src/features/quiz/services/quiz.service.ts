// src/api/quiz.service.ts
import {
  isAxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
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
  QuizExportRequest,
  CreateShareLinkRequest,
  CreateShareLinkResponse,
  AttemptDto,
  AttemptStatsDto,
  QuizImportRequest,
  ImportSummaryDto,
  JobStatistics,
  Difficulty,
  Paginated,
} from '@/types';
import { BaseService } from '../../../api/base.service';
import api from '../../../api/axiosInstance';
import { getErrorMessage } from '@/utils/errorUtils';

type QuizListParams = {
  page?: number;
  size?: number;
  sort?: string | string[];
  category?: string | string[];
  tag?: string | string[];
  authorName?: string;
  search?: string;
  difficulty?: Difficulty;
  scope?: 'public' | 'me' | 'all';
};

type QuizServiceError = Error & {
  response?: AxiosResponse;
  isAxiosError?: boolean;
  status?: number;
  code?: string;
  isBalanceError?: boolean;
  userMessage?: string;
};

type UploadGenerationQueryParams = Record<string, string | string[]>;

const uploadArrayQueryParams = new Set(['chunkIndices', 'tagIds']);

const buildUploadGenerationQueryParams = (formData: FormData): UploadGenerationQueryParams => {
  const params: UploadGenerationQueryParams = {};

  formData.forEach((value, key) => {
    if (key === 'file' || key === 'title' || typeof value !== 'string') {
      return;
    }

    if (uploadArrayQueryParams.has(key)) {
      try {
        const parsedValue = JSON.parse(value);
        if (Array.isArray(parsedValue)) {
          params[key] = parsedValue.map(String);
          return;
        }
      } catch {
        // Preserve the supplied value when it is not JSON-encoded.
      }
    }

    params[key] = value;
  });

  return params;
};

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
  async getQuizzes(params?: QuizListParams): Promise<Paginated<QuizDto>> {
    try {
      const response = await this.axiosInstance.get<Paginated<QuizDto>>(QUIZ_ENDPOINTS.QUIZZES, {
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
  async getMyQuizzes(params?: Omit<QuizListParams, 'scope'>): Promise<Paginated<QuizDto>> {
    try {
      const response = await this.axiosInstance.get<Paginated<QuizDto>>(QUIZ_ENDPOINTS.QUIZZES, {
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
   * Add question to quiz
   * POST /api/v1/quizzes/{quizId}/questions/{questionId}
   */
  async addQuestionToQuiz(quizId: string, questionId: string): Promise<void> {
    try {
      await this.axiosInstance.post(QUIZ_ENDPOINTS.ADD_QUESTION(quizId, questionId));
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Remove question from quiz
   * DELETE /api/v1/quizzes/{quizId}/questions/{questionId}
   */
  async removeQuestionFromQuiz(quizId: string, questionId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(QUIZ_ENDPOINTS.REMOVE_QUESTION(quizId, questionId));
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
      const file = formData.get('file');
      if (!(file instanceof Blob)) {
        throw new Error('Document file is required');
      }

      const uploadData = new FormData();
      uploadData.append('file', file);

      const response = await this.axiosInstance.post<QuizGenerationResponse>(
        QUIZ_ENDPOINTS.GENERATE_FROM_UPLOAD, 
        uploadData,
        {
          params: buildUploadGenerationQueryParams(formData),
          _isFileUpload: true,  // Flag for request interceptor to handle Content-Type
        } as any
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
  async cancelGenerationJob(jobId: string): Promise<QuizGenerationStatus> {
    try {
      const response = await this.axiosInstance.delete<QuizGenerationStatus>(
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
   * Archive a quiz.
   * PATCH /api/v1/quizzes/{quizId}/archive
   */
  async archiveQuiz(quizId: string): Promise<QuizDto> {
    try {
      const response = await this.axiosInstance.patch<QuizDto>(QUIZ_ENDPOINTS.ARCHIVE(quizId));
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Restore an archived quiz to draft status.
   * PATCH /api/v1/quizzes/{quizId}/unarchive
   */
  async unarchiveQuiz(quizId: string): Promise<QuizDto> {
    try {
      const response = await this.axiosInstance.patch<QuizDto>(QUIZ_ENDPOINTS.UNARCHIVE(quizId));
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Submit a quiz for moderation review.
   * POST /api/v1/quizzes/{quizId}/submit-for-review
   */
  async submitQuizForReview(quizId: string): Promise<void> {
    try {
      await this.axiosInstance.post(QUIZ_ENDPOINTS.SUBMIT_FOR_REVIEW(quizId));
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Add a tag to a quiz.
   * POST /api/v1/quizzes/{quizId}/tags/{tagId}
   */
  async addTagToQuiz(quizId: string, tagId: string): Promise<void> {
    try {
      await this.axiosInstance.post(QUIZ_ENDPOINTS.ADD_TAG(quizId, tagId));
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Remove a tag from a quiz.
   * DELETE /api/v1/quizzes/{quizId}/tags/{tagId}
   */
  async removeTagFromQuiz(quizId: string, tagId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(QUIZ_ENDPOINTS.REMOVE_TAG(quizId, tagId));
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Change a quiz's category.
   * PATCH /api/v1/quizzes/{quizId}/category/{categoryId}
   */
  async changeQuizCategory(quizId: string, categoryId: string): Promise<void> {
    try {
      await this.axiosInstance.patch(QUIZ_ENDPOINTS.CHANGE_CATEGORY(quizId, categoryId));
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Create a secure share link for a quiz.
   * POST /api/v1/quizzes/{quizId}/share-link
   */
  async createShareLink(
    quizId: string,
    data: CreateShareLinkRequest,
  ): Promise<CreateShareLinkResponse> {
    try {
      const response = await this.axiosInstance.post<CreateShareLinkResponse>(
        QUIZ_ENDPOINTS.CREATE_SHARE_LINK(quizId),
        data,
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Revoke a secure share link.
   * DELETE /api/v1/quizzes/shared/{tokenId}
   */
  async revokeShareLink(tokenId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(QUIZ_ENDPOINTS.DELETE_SHARE_LINK(tokenId));
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * List attempts for a quiz owned by the authenticated user.
   * GET /api/v1/quizzes/{quizId}/attempts
   */
  async getQuizAttempts(quizId: string): Promise<AttemptDto[]> {
    try {
      const response = await this.axiosInstance.get<AttemptDto[]>(
        QUIZ_ENDPOINTS.GET_QUIZ_ATTEMPTS(quizId),
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Get owner-visible statistics for an attempt.
   * GET /api/v1/quizzes/{quizId}/attempts/{attemptId}/stats
   */
  async getQuizAttemptStats(quizId: string, attemptId: string): Promise<AttemptStatsDto> {
    try {
      const response = await this.axiosInstance.get<AttemptStatsDto>(
        QUIZ_ENDPOINTS.GET_ATTEMPT_STATS(quizId, attemptId),
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Get aggregate statistics for the authenticated user's generation jobs.
   * GET /api/v1/quizzes/generation-jobs/statistics
   */
  async getGenerationJobStatistics(): Promise<JobStatistics> {
    try {
      const response = await this.axiosInstance.get<JobStatistics>(
        QUIZ_ENDPOINTS.GENERATION_STATISTICS,
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Force-cancel a generation job.
   * POST /api/v1/quizzes/generation-jobs/{jobId}/force-cancel
   */
  async forceCancelGenerationJob(jobId: string): Promise<string> {
    try {
      const response = await this.axiosInstance.post<string>(QUIZ_ENDPOINTS.FORCE_CANCEL_JOB(jobId));
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Clean up stale generation jobs for the authenticated user.
   * POST /api/v1/quizzes/generation-jobs/cleanup-stale
   */
  async cleanupStaleGenerationJobs(): Promise<string> {
    try {
      const response = await this.axiosInstance.post<string>(QUIZ_ENDPOINTS.CLEANUP_STALE_JOBS);
      return response.data;
    } catch (error) {
      throw this.handleQuizError(error);
    }
  }

  /**
   * Import editable quiz data from a multipart file.
   * POST /api/v1/quizzes/import
   */
  async importQuizzes(data: QuizImportRequest): Promise<ImportSummaryDto> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('format', data.format);

      if (data.strategy) formData.append('strategy', data.strategy);
      if (data.dryRun !== undefined) formData.append('dryRun', String(data.dryRun));
      if (data.autoCreateTags !== undefined) formData.append('autoCreateTags', String(data.autoCreateTags));
      if (data.autoCreateCategory !== undefined) {
        formData.append('autoCreateCategory', String(data.autoCreateCategory));
      }

      const uploadConfig: AxiosRequestConfig & { _isFileUpload: true } = {
        _isFileUpload: true,
      };
      const response = await this.axiosInstance.post<ImportSummaryDto>(
        QUIZ_ENDPOINTS.IMPORT,
        formData,
        uploadConfig,
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
    sort?: string | string[];
  }): Promise<Paginated<QuizDto>> {
    try {
      const response = await this.axiosInstance.get<Paginated<QuizDto>>(QUIZ_ENDPOINTS.PUBLIC_QUIZZES, {
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
  private handleQuizError(error: unknown): QuizServiceError {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const message = getErrorMessage(error);

      // For 409 errors, preserve the full axios error with enhanced properties
      if (status === 409) {
        // Check if this is an insufficient balance error
        const messageText = message.toLowerCase();
        
        const isBalanceError = 
          messageText.includes('insufficient') ||
          messageText.includes('balance') ||
          messageText.includes('token');

        if (isBalanceError) {
          const balanceError = error as QuizServiceError;
          balanceError.code = 'INSUFFICIENT_BALANCE';
          balanceError.isBalanceError = true;
          balanceError.userMessage = message;
          return balanceError;
        }
      }

      const enhancedError: QuizServiceError = new Error(message);
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
        case 409:
          enhancedError.message = `Conflict: ${message}`;
          break;
        case 429:
          enhancedError.message = 'Too many requests. Please try again later.';
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

    return new Error(error instanceof Error ? error.message : 'Network error occurred');
  }
}

// Create service instance
const quizService = new QuizService(api);

// Export individual functions for backward compatibility
export const getAllQuizzes = (params?: QuizListParams) => quizService.getQuizzes(params);

export const getMyQuizzes = (params?: Omit<QuizListParams, 'scope'>) =>
  quizService.getMyQuizzes(params);

export const getQuizById = (quizId: string) => quizService.getQuizById(quizId);

export const createQuiz = (data: CreateQuizRequest) => quizService.createQuiz(data);

export const updateQuiz = (quizId: string, data: UpdateQuizRequest) => 
  quizService.updateQuiz(quizId, data);

export const updateQuizStatus = (quizId: string, data: UpdateQuizStatusRequest) => 
  quizService.updateQuizStatus(quizId, data);

export const archiveQuiz = (quizId: string) => quizService.archiveQuiz(quizId);

export const unarchiveQuiz = (quizId: string) => quizService.unarchiveQuiz(quizId);

export const submitQuizForReview = (quizId: string) => quizService.submitQuizForReview(quizId);

export const deleteQuiz = (quizId: string) => quizService.deleteQuiz(quizId);

export const getQuizResults = (quizId: string) => quizService.getQuizResults(quizId);
