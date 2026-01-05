import type { AxiosInstance } from 'axios';
import { ATTEMPT_ENDPOINTS } from './attempt.endpoints';
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
  AttemptReviewDto,
  AttemptSummaryDto,
  QuestionForAttemptDto,
  CurrentQuestionDto,
  Page
} from '@/types';

/**
 * Attempt service for handling quiz attempts and answer submissions
 * Implements all endpoints from the AttemptController API documentation
 */
export class AttemptService {
  protected axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  /**
   * Start a new attempt for a quiz
   * POST /api/v1/attempts/quizzes/{quizId}
   */
  async startAttempt(quizId: string, data: StartAttemptRequest): Promise<StartAttemptResponse> {
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
  }): Promise<Page<AttemptDto>> {
    try {
      const response = await this.axiosInstance.get<Page<AttemptDto>>(
        ATTEMPT_ENDPOINTS.GET_ATTEMPTS,
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Get attempts with embedded quiz and stats (optimized, reduces N+1 queries)
   * GET /api/v1/attempts/summary
   */
  async getAttemptsSummary(params?: {
    page?: number;
    size?: number;
    quizId?: string;
    userId?: string;
    status?: string;
  }): Promise<Page<AttemptSummaryDto>> {
    try {
      const response = await this.axiosInstance.get<Page<AttemptSummaryDto>>(
        ATTEMPT_ENDPOINTS.GET_ATTEMPTS_SUMMARY,
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Get attempt details including submitted answers
   * GET /api/v1/attempts/{attemptId}
   */
  async getAttemptDetails(attemptId: string): Promise<AttemptDetailsDto> {
    try {
      const response = await this.axiosInstance.get<AttemptDetailsDto>(
        ATTEMPT_ENDPOINTS.GET_ATTEMPT(attemptId)
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Get the current question for an in-progress attempt
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
   * Submit a single answer
   * POST /api/v1/attempts/{attemptId}/answers
   * @param attemptId - UUID of the attempt
   * @param data - Answer submission request. Can include optional flags:
   *   - includeCorrectness: include whether the answer is correct (isCorrect field) in the response
   *   - includeCorrectAnswer: include the correct answer information (correctAnswer field) in the response
   *   - includeExplanation: include the answer explanation (explanation field) in the response
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
   * Submit multiple answers at once (ALL_AT_ONCE mode)
   * POST /api/v1/attempts/{attemptId}/answers/batch
   * Each answer in the batch can have its own includeCorrectness, includeCorrectAnswer, and includeExplanation flags.
   * @param attemptId - UUID of the attempt
   * @param data - Batch answer submission request. Each answer can include optional flags:
   *   - includeCorrectness: include whether the answer is correct (isCorrect field) in the response
   *   - includeCorrectAnswer: include the correct answer information (correctAnswer field) in the response
   *   - includeExplanation: include the answer explanation (explanation field) in the response
   */
  async submitBatchAnswers(attemptId: string, data: BatchAnswerSubmissionRequest): Promise<AnswerSubmissionDto[]> {
    try {
      const response = await this.axiosInstance.post<AnswerSubmissionDto[]>(
        ATTEMPT_ENDPOINTS.SUBMIT_BATCH_ANSWERS(attemptId),
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Complete an attempt and get results
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
   * Get detailed timing and accuracy stats for an attempt
   * GET /api/v1/attempts/{attemptId}/stats
   */
  async getAttemptStats(attemptId: string): Promise<AttemptStatsDto> {
    try {
      const response = await this.axiosInstance.get<AttemptStatsDto>(
        ATTEMPT_ENDPOINTS.GET_ATTEMPT_STATS(attemptId)
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Get attempt answer key
   * GET /api/v1/attempts/{attemptId}/answer-key
   * Retrieve an answer key for a completed attempt (correct answers only, no user responses).
   * This is a convenience endpoint that returns correct answers with question context.
   * Only available to the attempt owner and only for completed attempts.
   */
  async getAttemptAnswerKey(attemptId: string): Promise<AttemptReviewDto> {
    try {
      const response = await this.axiosInstance.get<AttemptReviewDto>(
        ATTEMPT_ENDPOINTS.GET_ANSWER_KEY(attemptId)
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Get comprehensive review of a completed attempt with user answers and correct answers
   * GET /api/v1/attempts/{attemptId}/review
   * Query parameters allow customizing what information to include in the response.
   * Only available to the attempt owner and only for completed attempts.
   */
  async getAttemptReview(
    attemptId: string,
    options?: {
      includeUserAnswers?: boolean;
      includeCorrectAnswers?: boolean;
      includeQuestionContext?: boolean;
    }
  ): Promise<AttemptReviewDto> {
    try {
      const response = await this.axiosInstance.get<AttemptReviewDto>(
        ATTEMPT_ENDPOINTS.GET_REVIEW(attemptId),
        { params: options }
      );
      return response.data;
    } catch (error) {
      throw this.handleAttemptError(error);
    }
  }

  /**
   * Pause an in-progress attempt
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
   * Resume a paused attempt
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
   * Delete an attempt (and its answers)
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
   * Get a randomized, safe list of questions (no correct answers)
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
          return new Error('Insufficient permissions - users can only access their own attempts');
        case 404:
          return new Error('Attempt not found');
        case 409:
          return new Error(`Conflict: ${message}`);
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
