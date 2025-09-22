// Question-related type definitions
// Used for question creation, management, and retrieval for quizzes as documented in the API specification

/**
 * Question types
 */
export type QuestionType = 
  | 'MCQ_SINGLE'    // Multiple choice single answer
  | 'MCQ_MULTI'     // Multiple choice multiple answers
  | 'OPEN'          // Open-ended questions
  | 'FILL_GAP'      // Fill in the blank
  | 'COMPLIANCE'    // Compliance questions
  | 'TRUE_FALSE'    // True/False questions
  | 'ORDERING'      // Ordering questions
  | 'HOTSPOT'       // Hotspot questions
  | 'MATCHING';     // Matching questions

/**
 * Question difficulty levels
 */
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

/**
 * Create question request
 * Matches CreateQuestionRequest DTO from API documentation
 */
export interface CreateQuestionRequest {
  type: QuestionType;                    // Required, valid question type
  difficulty: Difficulty;                // Required, valid difficulty level
  questionText: string;                  // 3-1000 characters, required
  content: any;                          // Question type-specific content, required
  hint?: string;                         // Max 500 characters, optional
  explanation?: string;                  // Max 2000 characters, optional
  attachmentUrl?: string;                // Max 2048 characters, optional
  quizIds?: string[];                    // Optional array
  tagIds?: string[];                     // Optional array
}

/**
 * Update question request
 * Matches UpdateQuestionRequest DTO from API documentation
 */
export interface UpdateQuestionRequest {
  type: QuestionType;                    // Required, valid question type
  difficulty: Difficulty;                // Required, valid difficulty level
  questionText: string;                  // 3-1000 characters, required
  content: any;                          // Question type-specific content, required
  hint?: string;                         // Max 500 characters, optional
  explanation?: string;                  // Max 2000 characters, optional
  attachmentUrl?: string;                // Max 2048 characters, optional
  quizIds?: string[];                    // Optional array
  tagIds?: string[];                     // Optional array
}

/**
 * Question DTO
 * Matches QuestionDto from API documentation
 */
export interface QuestionDto {
  id: string;                            // UUID
  type: QuestionType;                    // Question type
  difficulty: Difficulty;                // Question difficulty
  questionText: string;                  // Question text
  content: any | null;                   // Question type-specific content (may be null for safe content)
  hint?: string | null;                  // Optional hint
  explanation?: string | null;           // Optional explanation
  attachmentUrl?: string | null;         // Optional attachment URL
  createdAt: string;                     // ISO date-time (UTC)
  updatedAt: string;                     // ISO date-time (UTC)
  quizIds: string[];                     // Associated quiz IDs
  tagIds: string[];                      // Associated tag IDs
}

/**
 * Sort configuration for pagination
 */
export interface Sort {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

/**
 * Pageable configuration for pagination
 */
export interface Pageable {
  sort: Sort;
  pageNumber: number;
  pageSize: number;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

/**
 * Page DTO for paginated responses
 */
export interface Page<T> {
  content: T[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: Sort;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// Legacy type aliases for backward compatibility
export type QuestionDifficulty = Difficulty;
