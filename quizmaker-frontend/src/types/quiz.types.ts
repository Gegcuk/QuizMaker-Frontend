// Quiz-related type definitions
// Used for quiz creation, management, AI-powered generation, and analytics as documented in the API specification

import { BaseEntity, AuditableEntity } from './common.types';

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
 * Matches GenerateQuizFromDocumentRequest from API documentation
 */
export interface GenerateQuizFromDocumentRequest {
  documentId: string;               // Required: Document ID
  quizScope?: QuizScope;            // Default: ENTIRE_DOCUMENT
  chunkIndices?: number[];          // Required for SPECIFIC_CHUNKS scope
  chapterTitle?: string;            // Required for SPECIFIC_CHAPTER/SECTION scope
  chapterNumber?: number;           // Alternative for SPECIFIC_CHAPTER/SECTION scope
  quizTitle?: string;               // Optional: Custom title (max 100 chars)
  quizDescription?: string;         // Optional: Custom description (max 500 chars)
  questionsPerType: Record<QuizQuestionType, number>; // Required: Questions per type per chunk
  difficulty: Difficulty;           // Required: Question difficulty
  estimatedTimePerQuestion?: number; // 1-10 minutes, default: 2
  categoryId?: string;              // Optional: Category ID
  tagIds?: string[];                // Optional: Tag IDs
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