// AI-related type definitions
// Used for AI chat functionality as documented in the API specification

/**
 * Chat request DTO
 * Matches ChatRequestDto from API documentation
 */
export interface ChatRequestDto {
  message: string;                       // Chat message (max 2000 characters)
}

/**
 * Chat response DTO
 * Matches ChatResponseDto from API documentation
 */
export interface ChatResponseDto {
  message: string;                       // AI response message
  model: string;                         // AI model used
  latency: number;                       // Response time in milliseconds
  tokensUsed: number;                    // Number of tokens used
  timestamp: string;                     // Response timestamp
}

/**
 * AI chat error types
 */
export interface AiChatError {
  type: 'VALIDATION_ERROR' | 'AUTHENTICATION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message?: string;
  details?: Record<string, string[]>;
} 