import type { AxiosInstance } from 'axios';
import { AI_ENDPOINTS } from './endpoints';
import { 
  ChatRequestDto,
  ChatResponseDto,
  AiChatError
} from '../types/ai.types';

/**
 * AI service for handling AI chat operations
 * Implements the documented endpoint from the AiChatController API documentation
 */
export class AiService {
  protected axiosInstance: AxiosInstance;
  protected basePath: string;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
    this.basePath = '/ai';
  }

  /**
   * Send chat message
   * POST /api/ai/chat
   */
  async sendChatMessage(data: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      const response = await this.axiosInstance.post<ChatResponseDto>(AI_ENDPOINTS.CHAT, data);
      return response.data;
    } catch (error) {
      throw this.handleAiChatError(error);
    }
  }

  /**
   * Handle AI chat-specific errors
   */
  private handleAiChatError(error: any): AiChatError {
    if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      const details = error.response?.data?.details || {};

      switch (status) {
        case 400:
          return {
            type: 'VALIDATION_ERROR',
            message,
            details
          };
        case 401:
          return {
            type: 'AUTHENTICATION_ERROR',
            message: message || 'Authentication required'
          };
        case 403:
          return {
            type: 'AUTHENTICATION_ERROR',
            message: message || 'Insufficient permissions'
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            type: 'UNKNOWN_ERROR',
            message: message || 'AI service error occurred'
          };
        default:
          return {
            type: 'UNKNOWN_ERROR',
            message: message || 'AI chat operation failed'
          };
      }
    }

    return {
      type: 'NETWORK_ERROR',
      message: error.message || 'Network error occurred'
    };
  }
} 