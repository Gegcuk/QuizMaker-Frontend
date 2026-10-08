import type { AxiosInstance } from 'axios';
import { QUESTION_ENDPOINTS } from './question.endpoints';
import { 
  CreateQuestionRequest,
  UpdateQuestionRequest,
  QuestionDto,
  QuestionSchemaResponse,
  QuestionType,
  Page
} from '@/types';
import { ApplicationError, toApplicationError } from '@/utils/applicationError';

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
    /** @deprecated Use pageNumber. Kept while existing page components migrate. */
    page?: number;
    pageNumber?: number;
    size?: number;
    sort?: string | string[];
  }): Promise<Page<QuestionDto>> {
    try {
      const requestParams = params
        ? {
            quizId: params.quizId,
            pageNumber: params.pageNumber ?? params.page,
            size: params.size,
            sort: params.sort,
          }
        : undefined;
      const response = await this.axiosInstance.get<Page<QuestionDto>>(
        QUESTION_ENDPOINTS.GET_QUESTIONS,
        { params: requestParams }
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
  async getSchemaByType(questionType: QuestionType): Promise<QuestionSchemaResponse> {
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
  private handleQuestionError(error: unknown): ApplicationError {
    return toApplicationError(error);
  }
}
