// Result service for handling result-related operations
// Implements all endpoints from the ResultController API documentation

import type { AxiosInstance } from 'axios';
import { 
  QuizResultSummaryDto,
  AttemptResultDto,
  LeaderboardEntryDto
} from '@/types';
import { BaseService, api } from '@/services';

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
    const response = await this.axiosInstance.get<QuizResultSummaryDto>(`/v1/quizzes/${quizId}/results`);
    return response.data;
  }

  /**
   * Get quiz leaderboard
   * GET /api/v1/quizzes/{quizId}/leaderboard
   */
  async getQuizLeaderboard(quizId: string): Promise<LeaderboardEntryDto[]> {
    const response = await this.axiosInstance.get<LeaderboardEntryDto[]>(`/v1/quizzes/${quizId}/leaderboard`);
    return response.data;
  }
}

// Export default instance
const resultService = new ResultService(api);
export default resultService;

// Export individual functions for convenience
export const getQuizResults = (quizId: string) => resultService.getQuizResults(quizId);
export const getQuizLeaderboard = (quizId: string) => resultService.getQuizLeaderboard(quizId);
