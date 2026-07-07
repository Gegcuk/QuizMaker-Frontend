import { isAxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import {
  QuizResultSummaryDto,
  LeaderboardEntryDto,
} from '@/types';
import { RESULT_ENDPOINTS } from '@/api/endpoints';
import api from '@/api/axiosInstance';
import { getErrorMessage } from '@/utils/errorUtils';

type ResultServiceError = Error & {
  status?: number;
  response?: AxiosResponse;
};

/**
 * Result service for handling result operations
 * Implements all endpoints from the ResultController API documentation
 */
export class ResultService {
  protected axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  /**
   * Get quiz results summary
   * GET /api/v1/quizzes/{quizId}/results
   */
  async getQuizResults(quizId: string): Promise<QuizResultSummaryDto> {
    try {
      const response = await this.axiosInstance.get<QuizResultSummaryDto>(
        RESULT_ENDPOINTS.QUIZ_RESULTS(quizId),
      );
      return response.data;
    } catch (error) {
      throw this.handleResultError(error);
    }
  }

  /**
   * Get quiz leaderboard
   * GET /api/v1/quizzes/{quizId}/leaderboard
   */
  async getQuizLeaderboard(
    quizId: string,
    top: number = 10,
  ): Promise<LeaderboardEntryDto[]> {
    try {
      const response = await this.axiosInstance.get<LeaderboardEntryDto[]>(
        RESULT_ENDPOINTS.LEADERBOARD(quizId),
        { params: { top } },
      );
      return response.data;
    } catch (error) {
      throw this.handleResultError(error);
    }
  }

  private handleResultError(error: unknown): ResultServiceError {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const message = getErrorMessage(error);
      const resultError: ResultServiceError = new Error(message);
      resultError.status = status;
      resultError.response = error.response;

      switch (status) {
        case 400:
          resultError.message = `Validation error: ${message}`;
          break;
        case 401:
          resultError.message = 'Authentication required';
          break;
        case 403:
          resultError.message = 'Insufficient permissions to view quiz results';
          break;
        case 404:
          resultError.message = 'Quiz results not found';
          break;
        case 429:
          resultError.message = 'Too many requests. Please try again later.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          resultError.message = 'Server error occurred while loading quiz results';
          break;
        default:
          resultError.message = message || 'Failed to load quiz results';
      }

      return resultError;
    }

    return new Error(
      error instanceof Error ? error.message : 'Network error occurred',
    );
  }
}

// Export default instance
const resultService = new ResultService(api);
export default resultService;

// Export individual functions for convenience
export const getQuizResults = (quizId: string) => resultService.getQuizResults(quizId);
export const getQuizLeaderboard = (quizId: string, top: number = 10) =>
  resultService.getQuizLeaderboard(quizId, top);
