import type { AxiosInstance } from 'axios';
import { QUESTION_ENDPOINTS } from './question.endpoints';
import { 
  CreateQuestionRequest,
  UpdateQuestionRequest,
  QuestionDto,
  QuestionSchemaResponse,
  Page
} from '@/types';

/**
 * Question service for handling question operations
 * Implements all endpoints from the QuestionController API documentation
 */
export class QuestionService {
  protected axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  /**
   * Create a new question
   * POST /api/v1/questions
   */
  async createQuestion(data: CreateQuestionRequest): Promise<{ questionId: string }> {
    try {
      const response = await this.axiosInstance.post<{ questionId: string }>(
        QUESTION_ENDPOINTS.CREATE_QUESTION, 
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleQuestionError(error);
    }
  }

  /**
   * Get all questions with pagination and filtering
   * GET /api/v1/questions
   */
  async getQuestions(params?: {
    quizId?: string;
    pageNumber?: number;
    size?: number;
  }): Promise<Page<QuestionDto>> {
    try {
      const response = await this.axiosInstance.get<Page<QuestionDto>>(
        QUESTION_ENDPOINTS.GET_QUESTIONS,
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleQuestionError(error);
    }
  }

  /**
   * Get a question by ID
   * GET /api/v1/questions/{id}
   */
  async getQuestionById(id: string): Promise<QuestionDto> {
    try {
      const response = await this.axiosInstance.get<QuestionDto>(
        QUESTION_ENDPOINTS.GET_QUESTION(id)
      );
      return response.data;
    } catch (error) {
      throw this.handleQuestionError(error);
    }
  }

  /**
   * Update an existing question
   * PATCH /api/v1/questions/{id}
   */
  async updateQuestion(id: string, data: UpdateQuestionRequest): Promise<QuestionDto> {
    try {
      const response = await this.axiosInstance.patch<QuestionDto>(
        QUESTION_ENDPOINTS.UPDATE_QUESTION(id),
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleQuestionError(error);
    }
  }

  /**
   * Delete a question
   * DELETE /api/v1/questions/{id}
   */
  async deleteQuestion(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(QUESTION_ENDPOINTS.DELETE_QUESTION(id));
    } catch (error) {
      throw this.handleQuestionError(error);
    }
  }

  /**
   * Get all question type schemas
   * GET /api/v1/questions/schemas
   */
  async getAllSchemas(): Promise<Record<string, QuestionSchemaResponse>> {
    try {
      const response = await this.axiosInstance.get<Record<string, QuestionSchemaResponse>>(
        QUESTION_ENDPOINTS.GET_ALL_SCHEMAS
      );
      return response.data;
    } catch (error) {
      throw this.handleQuestionError(error);
    }
  }

  /**
   * Get schema for a specific question type
   * GET /api/v1/questions/schemas/{questionType}
   */
  async getSchemaByType(questionType: string): Promise<QuestionSchemaResponse> {
    try {
      const response = await this.axiosInstance.get<QuestionSchemaResponse>(
        QUESTION_ENDPOINTS.GET_SCHEMA_BY_TYPE(questionType)
      );
      return response.data;
    } catch (error) {
      throw this.handleQuestionError(error);
    }
  }

  /**
   * Handle question-specific errors
   */
  private handleQuestionError(error: any): Error {
    if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          return new Error(`Validation error: ${message}`);
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Insufficient permissions - check QUESTION_CREATE, QUESTION_UPDATE, or QUESTION_DELETE permissions');
        case 404:
          return new Error('Question not found');
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error occurred');
        default:
          return new Error(message || 'Question operation failed');
      }
    }

    return new Error(error.message || 'Network error occurred');
  }
}
