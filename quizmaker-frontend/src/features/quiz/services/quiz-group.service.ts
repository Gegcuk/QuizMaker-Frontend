// src/api/quiz-group.service.ts
import type { AxiosInstance } from 'axios';
import { QUIZ_ENDPOINTS } from '../../../api/endpoints';
import { 
  QuizGroupDto,
  QuizGroupSummaryDto,
  QuizSummaryDto,
  CreateQuizGroupRequest,
  UpdateQuizGroupRequest,
  AddQuizzesToGroupRequest,
  QuizDto
} from '@/types';
import { BaseService } from '../../../api/base.service';
import { Paginated } from '@/types';

/**
 * Quiz Group service for handling quiz group operations
 * Implements all endpoints from the QuizGroupController API documentation
 */
export class QuizGroupService extends BaseService<QuizGroupDto> {
  constructor(axiosInstance: AxiosInstance) {
    super(axiosInstance, '/v1/quiz-groups');
  }

  /**
   * Get all quiz groups with pagination
   * GET /api/v1/quiz-groups
   */
  async getQuizGroups(params?: {
    page?: number;
    size?: number;
    sort?: string[];
    includeQuizzes?: boolean;
    previewSize?: number;
  }): Promise<Paginated<QuizGroupSummaryDto>> {
    try {
      const response = await this.axiosInstance.get<Paginated<QuizGroupSummaryDto>>(
        QUIZ_ENDPOINTS.QUIZ_GROUPS,
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizGroupError(error);
    }
  }

  /**
   * Get a quiz group by ID
   * GET /api/v1/quiz-groups/{groupId}
   */
  async getQuizGroupById(groupId: string): Promise<QuizGroupDto> {
    try {
      const response = await this.axiosInstance.get<QuizGroupDto>(
        QUIZ_ENDPOINTS.QUIZ_GROUP_BY_ID(groupId)
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizGroupError(error);
    }
  }

  /**
   * Create a new quiz group
   * POST /api/v1/quiz-groups
   */
  async createQuizGroup(data: CreateQuizGroupRequest): Promise<string> {
    try {
      // According to OpenAPI spec, POST /v1/quiz-groups returns a string (the group ID)
      // However, backend actually returns { groupId: string }, so we handle all cases
      const response = await this.axiosInstance.post<any>(
        QUIZ_ENDPOINTS.QUIZ_GROUPS,
        data
      );
      
      const responseData = response.data;
      let groupId: string;
      
      // Handle string response (as per OpenAPI spec)
      if (typeof responseData === 'string') {
        groupId = responseData;
      }
      // Handle object with groupId field (actual backend response)
      else if (responseData && typeof responseData === 'object' && responseData.groupId) {
        groupId = String(responseData.groupId);
      }
      // Handle object with id field (fallback)
      else if (responseData && typeof responseData === 'object' && responseData.id) {
        groupId = String(responseData.id);
      }
      else {
        throw new Error(`Invalid response format from createQuizGroup API. Expected string or object with groupId/id, got: ${JSON.stringify(responseData)}`);
      }
      
      // Validate that we got a valid ID
      if (!groupId || groupId.trim() === '' || groupId === 'undefined' || groupId === 'null') {
        throw new Error(`Invalid group ID returned from API: ${groupId}`);
      }
      
      return groupId;
    } catch (error) {
      throw this.handleQuizGroupError(error);
    }
  }

  /**
   * Update a quiz group
   * PATCH /api/v1/quiz-groups/{groupId}
   */
  async updateQuizGroup(groupId: string, data: UpdateQuizGroupRequest): Promise<QuizGroupDto> {
    try {
      const response = await this.axiosInstance.patch<QuizGroupDto>(
        QUIZ_ENDPOINTS.QUIZ_GROUP_BY_ID(groupId),
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizGroupError(error);
    }
  }

  /**
   * Delete a quiz group
   * DELETE /api/v1/quiz-groups/{groupId}
   */
  async deleteQuizGroup(groupId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(QUIZ_ENDPOINTS.QUIZ_GROUP_BY_ID(groupId));
    } catch (error) {
      throw this.handleQuizGroupError(error);
    }
  }

  /**
   * Get quizzes in a group
   * GET /api/v1/quiz-groups/{groupId}/quizzes
   */
  async getQuizzesInGroup(
    groupId: string,
    params?: {
      page?: number;
      size?: number;
      sort?: string[];
    }
  ): Promise<Paginated<QuizSummaryDto>> {
    try {
      const response = await this.axiosInstance.get<Paginated<QuizSummaryDto>>(
        QUIZ_ENDPOINTS.QUIZ_GROUP_QUIZZES(groupId),
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleQuizGroupError(error);
    }
  }

  /**
   * Add quizzes to a group
   * POST /api/v1/quiz-groups/{groupId}/quizzes
   */
  async addQuizzesToGroup(groupId: string, data: AddQuizzesToGroupRequest): Promise<void> {
    try {
      await this.axiosInstance.post(
        QUIZ_ENDPOINTS.QUIZ_GROUP_QUIZZES(groupId),
        data
      );
    } catch (error) {
      throw this.handleQuizGroupError(error);
    }
  }

  /**
   * Remove a quiz from a group
   * DELETE /api/v1/quiz-groups/{groupId}/quizzes/{quizId}
   */
  async removeQuizFromGroup(groupId: string, quizId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(
        QUIZ_ENDPOINTS.QUIZ_GROUP_QUIZ(groupId, quizId)
      );
    } catch (error) {
      throw this.handleQuizGroupError(error);
    }
  }

  /**
   * Check if a quiz belongs to a group
   * Helper method - checks if quiz ID is in group's quiz previews or full list
   */
  async isQuizInGroup(groupId: string, quizId: string): Promise<boolean> {
    try {
      // First try to get from preview if available
      const groups = await this.getQuizGroups({
        includeQuizzes: true,
        previewSize: 1000 // Get all previews
      });
      
      const group = groups.content.find(g => g.id === groupId);
      if (group?.quizPreviews?.some(q => q.id === quizId)) {
        return true;
      }

      // If not in preview, check full list
      const quizzes = await this.getQuizzesInGroup(groupId, { size: 1000 });
      return quizzes.content.some(q => q.id === quizId);
    } catch (error) {
      console.error('Error checking quiz group membership:', error);
      return false;
    }
  }

  /**
   * Get groups that contain a specific quiz
   * Helper method to find all groups a quiz belongs to
   */
  async getGroupsForQuiz(quizId: string): Promise<QuizGroupSummaryDto[]> {
    try {
      const groups = await this.getQuizGroups({
        includeQuizzes: true,
        previewSize: 1000
      });

      return groups.content.filter(group => 
        group.quizPreviews?.some(q => q.id === quizId)
      );
    } catch (error) {
      console.error('Error getting groups for quiz:', error);
      return [];
    }
  }

  /**
   * Handle quiz group specific errors
   */
  private handleQuizGroupError(error: any): Error {
    if (error?.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      const enhancedError = new Error(message);
      (enhancedError as any).status = status;
      (enhancedError as any).response = error.response;

      switch (status) {
        case 400:
          enhancedError.message = 'Invalid request parameters';
          break;
        case 401:
          enhancedError.message = 'Authentication required';
          break;
        case 403:
          enhancedError.message = 'Insufficient permissions';
          break;
        case 404:
          enhancedError.message = 'Quiz group not found';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          enhancedError.message = 'Server error occurred';
          break;
        default:
          enhancedError.message = message || 'Quiz group operation failed';
      }
      
      return enhancedError;
    }

    return new Error(error.message || 'Network error occurred');
  }
}

// Export default instance
import api from '../../../api/axiosInstance';
export const quizGroupService = new QuizGroupService(api);
