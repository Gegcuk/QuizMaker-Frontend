import type { AxiosInstance } from 'axios';
import { ATTEMPT_ENDPOINTS } from './endpoints';
import { 
  StartAttemptRequest,
  StartAttemptResponse,
  AttemptDto,
  AttemptDetailsDto,
  AnswerSubmissionRequest,
  AnswerSubmissionDto,
  BatchAnswerSubmissionRequest,
  AttemptResultDto,
  AttemptStatsDto,
  QuestionForAttemptDto,
  CurrentQuestionDto
} from '../types/attempt.types';

/**
 * Attempt service for handling quiz attempts and answer submissions
 * Implements all endpoints from the AttemptController API documentation
 */
export class AttemptService {
  protected axiosInstance: AxiosInstance;
  protected basePath: string;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
    this.basePath = '/v1/attempts';
  }

  /**
   * Start a new attempt for a quiz
   * POST /api/v1/attempts/quizzes/{quizId}
   */
  async startAttempt(quizId: string, data?: StartAttemptRequest): Promise<StartAttemptResponse> {
    try {
      const response = await this.axiosInstance.post<StartAttemptResponse>(
        ATTEMPT_ENDPOINTS.START_ATTEMPT(quizId), 
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Get all attempts with pagination and filtering
   * GET /api/v1/attempts
   */
  async getAttempts(params?: {
    page?: number;
    size?: number;
    quizId?: string;
    userId?: string;
  }): Promise<{
    content: AttemptDto[];
    pageable: {
      pageNumber: number;
      pageSize: number;
      totalElements: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await this.axiosInstance.get(ATTEMPT_ENDPOINTS.ATTEMPTS, {
        params
      });
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Get attempt details by ID
   * GET /api/v1/attempts/{attemptId}
   */
  async getAttemptById(attemptId: string): Promise<AttemptDetailsDto> {
    try {
      const response = await this.axiosInstance.get<AttemptDetailsDto>(
        ATTEMPT_ENDPOINTS.ATTEMPT_BY_ID(attemptId)
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Submit a single answer
   * POST /api/v1/attempts/{attemptId}/answers
   */
  async submitAnswer(attemptId: string, data: AnswerSubmissionRequest): Promise<AnswerSubmissionDto> {
    try {
      const response = await this.axiosInstance.post<AnswerSubmissionDto>(
        ATTEMPT_ENDPOINTS.SUBMIT_ANSWER(attemptId),
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Submit batch answers
   * POST /api/v1/attempts/{attemptId}/answers/batch
   */
  async submitBatchAnswers(attemptId: string, data: BatchAnswerSubmissionRequest): Promise<AnswerSubmissionDto[]> {
    try {
      const response = await this.axiosInstance.post<AnswerSubmissionDto[]>(
        ATTEMPT_ENDPOINTS.BATCH_ANSWERS(attemptId),
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Complete attempt
   * POST /api/v1/attempts/{attemptId}/complete
   */
  async completeAttempt(attemptId: string): Promise<AttemptResultDto> {
    try {
      const response = await this.axiosInstance.post<AttemptResultDto>(
        ATTEMPT_ENDPOINTS.COMPLETE_ATTEMPT(attemptId)
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Get attempt statistics
   * GET /api/v1/attempts/{attemptId}/stats
   */
  async getAttemptStats(attemptId: string): Promise<AttemptStatsDto> {
    try {
      const response = await this.axiosInstance.get<AttemptStatsDto>(
        ATTEMPT_ENDPOINTS.ATTEMPT_STATS(attemptId)
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Pause attempt
   * POST /api/v1/attempts/{attemptId}/pause
   */
  async pauseAttempt(attemptId: string): Promise<AttemptDto> {
    try {
      const response = await this.axiosInstance.post<AttemptDto>(
        ATTEMPT_ENDPOINTS.PAUSE_ATTEMPT(attemptId)
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Resume attempt
   * POST /api/v1/attempts/{attemptId}/resume
   */
  async resumeAttempt(attemptId: string): Promise<AttemptDto> {
    try {
      const response = await this.axiosInstance.post<AttemptDto>(
        ATTEMPT_ENDPOINTS.RESUME_ATTEMPT(attemptId)
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Get shuffled questions
   * GET /api/v1/attempts/quizzes/{quizId}/questions/shuffled
   */
  async getShuffledQuestions(quizId: string): Promise<QuestionForAttemptDto[]> {
    try {
      const response = await this.axiosInstance.get<QuestionForAttemptDto[]>(
        ATTEMPT_ENDPOINTS.SHUFFLED_QUESTIONS(quizId)
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Get current question for an in-progress attempt
   * GET /api/v1/attempts/{attemptId}/current-question
   */
  async getCurrentQuestion(attemptId: string): Promise<CurrentQuestionDto> {
    try {
      const response = await this.axiosInstance.get<CurrentQuestionDto>(
        ATTEMPT_ENDPOINTS.CURRENT_QUESTION(attemptId)
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Delete attempt
   * DELETE /api/v1/attempts/{attemptId}
   */
  async deleteAttempt(attemptId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(ATTEMPT_ENDPOINTS.DELETE_ATTEMPT(attemptId));
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Handle attempt-specific errors
   */
  private handleAttemptError(error: any): Error {
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
          return new Error('Attempt not found');
        case 409:
          return new Error('Attempt in invalid state');
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error occurred');
        default:
          return new Error(message || 'Attempt operation failed');
      }
    }

    return new Error(error.message || 'Network error occurred');
  }
} 