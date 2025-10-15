// Quiz-related type definitions
// Used for quiz creation, management, AI-powered generation, and analytics as documented in the API specification

import { BaseEntity, AuditableEntity } from '../../../types/common.types';

/**
 * Quiz visibility options
 */
export type Visibility = 'PUBLIC' | 'PRIVATE';

/**
 * Quiz status options
 */
export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/**
 * Quiz difficulty levels
 */
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

/**
 * Quiz generation status
 */
export type GenerationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

/**
 * Quiz generation scope
 * Matches QuizScope enum from backend API
 */
export type QuizScope = 'ENTIRE_DOCUMENT' | 'SPECIFIC_CHUNKS' | 'SPECIFIC_CHAPTER' | 'SPECIFIC_SECTION';

/**
 * Question types for quiz generation
 */
export type QuizQuestionType = 
  | 'MCQ_SINGLE'    // Multiple choice single answer
  | 'MCQ_MULTI'     // Multiple choice multiple answers
  | 'OPEN'          // Open-ended questions
  | 'FILL_GAP'      // Fill in the blank
  | 'COMPLIANCE'    // Compliance questions
  | 'TRUE_FALSE'    // True/False questions
  | 'ORDERING'      // Ordering questions
  | 'HOTSPOT';      // Hotspot questions

/**
 * Create quiz request
 * Matches CreateQuizRequest DTO from API documentation
 */
export interface CreateQuizRequest {
  title: string;                    // 3-100 characters, required
  description?: string;             // Max 1000 characters, optional
  visibility?: Visibility;          // Defaults to PRIVATE
  difficulty?: Difficulty;          // Defaults to MEDIUM
  isRepetitionEnabled?: boolean;    // Boolean
  timerEnabled?: boolean;           // Boolean
  estimatedTime: number;            // 1-180 minutes, required
  timerDuration: number;            // 1-180 minutes, required
  categoryId?: string;              // Optional UUID
  tagIds?: string[];                // Optional array of UUIDs
}

/**
 * Update quiz request
 * Matches UpdateQuizRequest DTO from API documentation
 */
export interface UpdateQuizRequest {
  title?: string;                   // 3-100 characters, optional
  description?: string;             // Max 1000 characters, optional
  visibility?: Visibility;          // Optional
  difficulty?: Difficulty;          // Optional
  isRepetitionEnabled?: boolean;    // Optional boolean
  timerEnabled?: boolean;           // Optional boolean
  estimatedTime?: number;           // 1-180 minutes, optional
  timerDuration?: number;           // 1-180 minutes, optional
  categoryId?: string;              // Optional UUID
  tagIds?: string[];                // Optional array of UUIDs
}

/**
 * Quiz data transfer object
 * Matches QuizDto from API documentation
 */
export interface QuizDto extends BaseEntity, AuditableEntity {
  creatorId: string;                // Creator user ID
  categoryId?: string;              // Category ID
  title: string;                    // Quiz title
  description?: string;             // Quiz description
  visibility: Visibility;           // Quiz visibility
  difficulty: Difficulty;           // Quiz difficulty
  status: QuizStatus;               // Quiz status
  estimatedTime: number;            // Estimated time in minutes
  isRepetitionEnabled: boolean;     // Repetition setting
  timerEnabled: boolean;            // Timer setting
  timerDuration: number;            // Timer duration in minutes
  tagIds: string[];                 // Associated tag IDs
}

/**
 * Quiz search criteria
 * Matches QuizSearchCriteria from API documentation
 */
export interface QuizSearchCriteria {
  category?: string[];              // Filter by category names
  tag?: string[];                   // Filter by tag names
  authorName?: string;              // Filter by author username
  search?: string;                  // Full-text search on title/description
  difficulty?: Difficulty;          // Filter by difficulty
}

/**
 * Generate quiz from document request
 * Matches GenerateQuizFromDocumentRequest from backend API
 */
export interface GenerateQuizFromDocumentRequest {
  documentId: string;               // Required: Document ID
  quizScope: QuizScope;             // Required: Quiz scope as string enum
  questionTypes: Record<QuizQuestionType, number>; // Required: Questions per type per chunk
  difficulty: Difficulty;           // Required: Question difficulty
  quizTitle?: string;               // Optional: Custom title (max 100 chars)
  quizDescription?: string;         // Optional: Custom description (max 500 chars)
  estimatedTimePerQuestion?: number; // 1-10 minutes, default: 2
  categoryId?: string;              // Optional: Category ID
  tagIds?: string[];                // Optional: Tag IDs
}

/**
 * Generate quiz from text request
 * Matches GenerateQuizFromTextRequest from backend API
 */
export interface GenerateQuizFromTextRequest {
  text: string;                                    // Required: Plain text content (1-300,000 characters)
  questionsPerType: Record<QuizQuestionType, number>; // Required: Question types and counts
  difficulty: Difficulty;                          // Required: Question difficulty level
  language?: string;                              // Optional: Language code (e.g., "en", "es")
  chunkingStrategy?: 'CHAPTER_BASED' | 'SECTION_BASED' | 'SIZE_BASED' | 'PAGE_BASED'; // Optional: Document processing strategy
  maxChunkSize?: number;                          // Optional: Max characters per chunk (1000-300000)
  quizScope?: QuizScope;                          // Optional: Quiz generation scope
  chunkIndices?: number[];                        // Optional: Specific chunk indices (for SPECIFIC_CHUNKS scope)
  chapterTitle?: string;                          // Optional: Chapter title (for SPECIFIC_CHAPTER/SECTION scope)
  chapterNumber?: number;                         // Optional: Chapter number (for SPECIFIC_CHAPTER/SECTION scope)
  quizTitle?: string;                             // Optional: Custom quiz title (max 100 chars)
  quizDescription?: string;                       // Optional: Custom quiz description (max 500 chars)
  estimatedTimePerQuestion?: number;              // Optional: Minutes per question (1-10)
  categoryId?: string;                            // Optional: Category UUID
  tagIds?: string[];                              // Optional: Array of tag UUIDs
}

/**
 * Quiz generation response
 * Matches QuizGenerationResponse from API documentation
 */
export interface QuizGenerationResponse {
  jobId: string;                    // Job identifier for tracking
  status: GenerationStatus;         // Generation status
  message: string;                  // Status description
  estimatedTimeSeconds: number;     // Estimated completion time
}

/**
 * Quiz generation status for progress monitoring
 * Matches QuizGenerationStatus from backend API
 */
export interface QuizGenerationStatus {
  jobId: string;                    // Job identifier
  status: GenerationStatus;         // Current status
  totalChunks: number;              // Total chunks to process
  processedChunks: number;          // Chunks processed so far
  progressPercentage: number;       // Progress percentage (0-100)
  currentChunk: string;             // Current chunk being processed
  estimatedCompletion: string;      // ISO timestamp for estimated completion
  errorMessage: string | null;      // Error message if failed
  totalQuestionsGenerated: number;  // Total questions generated so far
  elapsedTimeSeconds: number;       // Time elapsed since start
  estimatedTimeRemainingSeconds: number; // Estimated time remaining
  generatedQuizId: string | null;   // Quiz ID when completed
  startedAt: string;                // ISO timestamp when started
  completedAt: string | null;       // ISO timestamp when completed
}

/**
 * Quiz result summary DTO
 * Matches QuizResultSummaryDto from API documentation
 */
export interface QuizResultSummaryDto {
  quizId: string;                   // Quiz identifier
  attemptsCount: number;            // Total attempts
  averageScore: number;             // Average score percentage
  bestScore: number;                // Best score achieved
  worstScore: number;               // Worst score achieved
  passRate: number;                 // Pass rate percentage
  questionStats: QuestionStatDto[]; // Per-question statistics
}

/**
 * Question statistics DTO
 * Matches QuestionStatDto from API documentation
 */
export interface QuestionStatDto {
  questionId: string;               // Question identifier
  timesAsked: number;               // Number of times asked
  timesCorrect: number;             // Number of times answered correctly
  correctRate: number;              // Correct answer rate percentage
}

/**
 * Leaderboard entry DTO
 * Matches LeaderboardEntryDto from API documentation
 */
export interface LeaderboardEntryDto {
  userId: string;                   // User identifier
  username: string;                 // Username
  bestScore: number;                // Best score for the quiz
}

/**
 * Update quiz visibility request
 * Matches UpdateQuizVisibilityRequest from API documentation
 */
export interface UpdateQuizVisibilityRequest {
  visibility: Visibility;
}

/**
 * Update quiz status request
 * Matches UpdateQuizStatusRequest from API documentation
 */
export interface UpdateQuizStatusRequest {
  status: QuizStatus;
}

/**
 * Question export DTO
 * Matches QuestionExportDto from API documentation
 * Used in quiz exports with full question content
 */
export interface QuestionExportDto {
  id: string;                       // Question unique identifier
  type: QuizQuestionType;           // Question type
  difficulty: Difficulty;           // Question difficulty
  questionText: string;             // The question text
  content: Record<string, any>;     // Question-specific content (options, answers, etc.)
  hint: string | null;              // Optional hint text
  explanation: string | null;       // Optional explanation text
  attachmentUrl: string | null;     // Optional attachment URL
}

/**
 * Quiz export DTO
 * Matches QuizExportDto from API documentation
 * Stable structure designed for round-trip import/export
 * Used in JSON_EDITABLE format exports
 */
export interface QuizExportDto {
  id: string;                       // Quiz unique identifier
  title: string;                    // Quiz title
  description: string | null;       // Quiz description
  visibility: Visibility;           // PUBLIC or PRIVATE
  difficulty: Difficulty;           // EASY, MEDIUM, or HARD
  estimatedTime: number | null;     // Estimated completion time in minutes
  tags: string[];                   // Tag names (not IDs)
  category: string | null;          // Category name (not ID)
  creatorId: string;                // User who created the quiz
  questions: QuestionExportDto[];   // Nested questions with full content
  createdAt: string;                // Creation timestamp (ISO 8601)
  updatedAt: string;                // Last update timestamp (ISO 8601)
}

/**
 * Export format enum
 * Matches format parameter in export endpoint
 */
export type ExportFormat = 'JSON_EDITABLE' | 'XLSX_EDITABLE' | 'HTML_PRINT' | 'PDF_PRINT';

/**
 * Export scope enum
 * Determines which quizzes to export
 */
export type ExportScope = 'public' | 'me' | 'all';

/**
 * Quiz export request parameters
 * Matches query parameters for GET /quizzes/export
 */
export interface QuizExportRequest {
  format: ExportFormat;                    // Export format (required)
  scope?: ExportScope;                     // Access scope filter (default: public)
  categoryIds?: string[];                  // Filter by categories
  tags?: string[];                         // Filter by tag names
  authorId?: string;                       // Filter by author
  difficulty?: Difficulty;                 // Filter by difficulty
  search?: string;                         // Search in title/description
  quizIds?: string[];                      // Export specific quizzes
  includeCover?: boolean;                  // Include cover page (print formats)
  includeMetadata?: boolean;               // Include quiz metadata (print formats)
  answersOnSeparatePages?: boolean;        // Separate answer key pages (print formats)
  includeHints?: boolean;                  // Include question hints (print formats)
  includeExplanations?: boolean;           // Include answer explanations (print formats)
  groupQuestionsByType?: boolean;          // Group by question type (print formats)
} 