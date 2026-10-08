import { type AxiosInstance } from 'axios';
import {
  QuizResultSummaryDto,
  LeaderboardEntryDto,
} from '@/types';
import { RESULT_ENDPOINTS } from '@/api/endpoints';
import api from '@/api/axiosInstance';
import { ApplicationError, toApplicationError } from '@/utils/applicationError';


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

  private handleResultError(error: unknown): ApplicationError {
    return toApplicationError(error);
  }
}

// Export default instance
const resultService = new ResultService(api);
export default resultService;

// Export individual functions for convenience
export const getQuizResults = (quizId: string) => resultService.getQuizResults(quizId);
export const getQuizLeaderboard = (quizId: string, top: number = 10) =>
  resultService.getQuizLeaderboard(quizId, top);
