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
   * GET /api/quizzes/{quizId}/results/summary
   */
  async getQuizResults(quizId: string): Promise<QuizResultSummaryDto> {
    const response = await this.axiosInstance.get<QuizResultSummaryDto>(`/api/quizzes/${quizId}/results/summary`);
    return response.data;
  }

  /**
   * Get attempt results
   * GET /api/attempts/{attemptId}/results
   */
  async getAttemptResults(attemptId: string): Promise<AttemptResultDto> {
    const response = await this.axiosInstance.get<AttemptResultDto>(`/api/attempts/${attemptId}/results`);
    return response.data;
  }

  /**
   * Get quiz leaderboard
   * GET /api/quizzes/{quizId}/leaderboard
   */
  async getQuizLeaderboard(quizId: string): Promise<LeaderboardEntryDto[]> {
    const response = await this.axiosInstance.get<LeaderboardEntryDto[]>(`/api/quizzes/${quizId}/leaderboard`);
    return response.data;
  }

  /**
   * Get user's quiz attempts
   * GET /api/quizzes/{quizId}/attempts/user
   */
  async getUserQuizAttempts(quizId: string): Promise<AttemptResultDto[]> {
    const response = await this.axiosInstance.get<AttemptResultDto[]>(`/api/quizzes/${quizId}/attempts/user`);
    return response.data;
  }

  /**
   * Get detailed attempt analysis
   * GET /api/attempts/{attemptId}/analysis
   */
  async getAttemptAnalysis(attemptId: string): Promise<any> {
    const response = await this.axiosInstance.get(`/api/attempts/${attemptId}/analysis`);
    return response.data;
  }
}

// Export default instance
const resultService = new ResultService(api);
export default resultService;

// Export individual functions for convenience
export const getQuizResults = (quizId: string) => resultService.getQuizResults(quizId);
export const getAttemptResults = (attemptId: string) => resultService.getAttemptResults(attemptId);
export const getQuizLeaderboard = (quizId: string) => resultService.getQuizLeaderboard(quizId);
export const getUserQuizAttempts = (quizId: string) => resultService.getUserQuizAttempts(quizId);
export const getAttemptAnalysis = (attemptId: string) => resultService.getAttemptAnalysis(attemptId);
