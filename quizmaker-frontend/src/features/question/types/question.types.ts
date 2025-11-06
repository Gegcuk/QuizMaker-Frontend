// Question-related type definitions
// Used for question creation, management, and retrieval for quizzes as documented in the API specification

// Import shared types from common to avoid duplication
import type { QuestionType, Difficulty } from '../../../types/common.types';

// Re-export for convenience
export type { QuestionType, Difficulty };

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

/**
 * Question schema response
 * Contains JSON Schema and example for a question type
 */
export interface QuestionSchemaResponse {
  schema: any;                           // JSON Schema defining the content structure
  example: any;                          // Example content for this question type
  description: string;                   // Human-readable description
}

// ============================================================================
// Question Content Types
// Based on JSON structures from question_controller.md
// ============================================================================

/**
 * MCQ Option
 */
export interface McqOption {
  id: string;
  text: string;
  correct: boolean;
}

/**
 * MCQ Single/Multi Content
 */
export interface McqSingleContent {
  options: McqOption[];
}

export interface McqMultiContent {
  options: McqOption[];
}

/**
 * True/False Content
 */
export interface TrueFalseContent {
  answer: boolean;
}

/**
 * Open Content
 */
export interface OpenContent {
  answer: string;
}

/**
 * Fill Gap Content
 */
export interface GapAnswer {
  id: number;
  answer: string;
}

export interface FillGapContent {
  text: string;
  gaps: GapAnswer[];
}

/**
 * Compliance Content
 */
export interface ComplianceStatement {
  id: number;
  text: string;
  compliant: boolean;
}

export interface ComplianceContent {
  statements: ComplianceStatement[];
}

/**
 * Ordering Content
 */
export interface OrderingItem {
  id: number;
  text: string;
}

export interface OrderingContent {
  items: OrderingItem[];
}

/**
 * Hotspot Content
 */
export interface HotspotRegion {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  correct: boolean;
}

export interface HotspotContent {
  imageUrl: string;
  regions: HotspotRegion[];
}

/**
 * Matching Content
 */
export interface MatchingItem {
  id: number;
  text: string;
  matchId?: number; // Only for left side items
}

export interface MatchingContent {
  left: MatchingItem[];
  right: MatchingItem[];
}

// Legacy type aliases for backward compatibility
export type QuestionDifficulty = Difficulty;
