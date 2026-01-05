// Attempt-related type definitions
// Used for quiz attempts, answer submission, progress tracking, and attempt completion as documented in the API specification

// Import shared types from common to avoid duplication
import type { QuestionType, Difficulty } from '../../../types/common.types';

// Re-export for convenience
export type { QuestionType, Difficulty };

/**
 * Attempt modes
 */
export type AttemptMode = 'ONE_BY_ONE' | 'ALL_AT_ONCE' | 'TIMED';

/**
 * Attempt status
 */
export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'PAUSED';

/**
 * Start attempt request
 * Matches StartAttemptRequest DTO from API documentation
 */
export interface StartAttemptRequest {
  mode: AttemptMode; // required if body is provided
}

/**
 * Start attempt response
 * Matches StartAttemptResponse DTO from API documentation
 */
export interface StartAttemptResponse {
  attemptId: string;          // UUID
  quizId: string;             // UUID
  mode: AttemptMode;
  totalQuestions: number;
  timeLimitMinutes: number | null;
  startedAt: string;          // ISO (Instant in Java)
}

/**
 * Attempt DTO
 * Matches AttemptDto from API documentation
 */
export interface AttemptDto {
  attemptId: string;          // UUID
  quizId: string;             // UUID
  userId: string;             // UUID
  startedAt: string;          // ISO (Instant in Java)
  status: AttemptStatus;
  mode: AttemptMode;
}

/**
 * Attempt details DTO
 * Matches AttemptDetailsDto from API documentation
 */
export interface AttemptDetailsDto {
  attemptId: string;          // UUID
  quizId: string;             // UUID
  userId: string;             // UUID
  startedAt: string;          // ISO (Instant in Java)
  completedAt: string | null; // ISO (Instant in Java)
  status: AttemptStatus;
  mode: AttemptMode;
  answers: AnswerSubmissionDto[];
}

/**
 * Answer submission request
 * Matches AnswerSubmissionRequest DTO from API documentation
 */
export interface AnswerSubmissionRequest {
  questionId: string; // UUID
  response: any;      // JsonNode in Java, see Answer JSON per Type
  includeCorrectness?: boolean;  // Include whether the answer is correct (isCorrect field) in the response. Defaults to false.
  includeCorrectAnswer?: boolean; // Include the correct answer information (correctAnswer field) in the response. Defaults to false.
  includeExplanation?: boolean;   // Include the answer explanation (explanation field) in the response. Defaults to false.
}

/**
 * Batch answer submission request
 * Matches BatchAnswerSubmissionRequest DTO from API documentation
 */
export interface BatchAnswerSubmissionRequest {
  answers: AnswerSubmissionRequest[]; // at least 1
}

/**
 * Answer submission DTO
 * Matches AnswerSubmissionDto from API documentation
 */
export interface AnswerSubmissionDto {
  answerId: string;            // UUID
  questionId: string;          // UUID
  isCorrect?: boolean;         // Whether the submitted answer was correct (only included when includeCorrectness=true)
  score: number | null;        // null if not yet graded
  answeredAt: string;          // ISO (Instant in Java)
  correctAnswer?: any;         // Correct answer information (only included when includeCorrectAnswer=true). JsonNode in Java.
  explanation?: string | null; // Explanation of the correct answer (only included when includeExplanation=true)
  nextQuestion?: QuestionForAttemptDto | null; // ONE_BY_ONE mode only
}

/**
 * Current question DTO
 * Matches CurrentQuestionDto from API documentation
 */
export interface CurrentQuestionDto {
  question: QuestionForAttemptDto; // safe (no correct answers)
  questionNumber: number;          // 1-based
  totalQuestions: number;
  attemptStatus: AttemptStatus;
}

/**
 * Question for attempt DTO
 * Matches QuestionForAttemptDto from API documentation
 */
export interface QuestionForAttemptDto {
  id: string;                   // UUID
  type: QuestionType;
  difficulty: Difficulty;
  questionText: string;
  safeContent: any;             // safe content (no solution fields)
  hint?: string | null;
  attachmentUrl?: string | null;
}

/**
 * Attempt result DTO
 * Matches AttemptResultDto from API documentation
 */
export interface AttemptResultDto {
  attemptId: string;           // UUID
  quizId: string;              // UUID
  userId: string;              // UUID
  startedAt: string;           // ISO
  completedAt: string;         // ISO
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  answers: AnswerSubmissionDto[];
}

/**
 * Question timing stats DTO
 * Matches QuestionTimingStatsDto from API documentation
 */
export interface QuestionTimingStatsDto {
  questionId: string;          // UUID
  questionType: QuestionType;
  difficulty: Difficulty;
  timeSpent: string;           // ISO 8601 duration (e.g., PT2M30S)
  isCorrect: boolean;
  questionStartedAt: string;   // ISO
  answeredAt: string;          // ISO
}

/**
 * Attempt stats DTO
 * Matches AttemptStatsDto from API documentation
 */
export interface AttemptStatsDto {
  attemptId: string;                 // UUID
  totalTime: string;                 // ISO 8601 duration
  averageTimePerQuestion: string;    // ISO 8601 duration
  questionsAnswered: number;
  correctAnswers: number;
  accuracyPercentage: number;
  completionPercentage: number;
  questionTimings: QuestionTimingStatsDto[];
  startedAt: string;                 // ISO
  completedAt: string | null;        // ISO
}

/**
 * Answer review DTO
 * Matches AnswerReviewDto from API documentation
 * Used for reviewing individual answers with user responses and correct answers
 */
export interface AnswerReviewDto {
  questionId: string;                // UUID
  type: QuestionType;
  questionText: string;
  hint?: string | null;
  attachmentUrl?: string | null;
  questionSafeContent: any;          // Safe question content for rendering (without correct answers)
  userResponse: any;                 // User's submitted response (JSON structure depends on question type)
  correctAnswer: any;                // Correct answer (JSON structure depends on question type)
  isCorrect: boolean;
  score: number;
  answeredAt: string;                // ISO
  explanation?: string | null;       // Optional explanation for the correct answer
}

/**
 * Attempt review DTO
 * Matches AttemptReviewDto from API documentation
 * Complete review of a finished attempt with user answers and correct answers
 */
export interface AttemptReviewDto {
  attemptId: string;                 // UUID
  quizId: string;                    // UUID
  userId: string;                    // UUID
  startedAt: string;                 // ISO
  completedAt: string;               // ISO
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  answers: AnswerReviewDto[];        // Detailed review of each answer
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
 * Lightweight quiz summary for embedded display
 * Matches QuizSummaryDto from API documentation
 */
export interface QuizSummaryDto {
  id: string;                   // UUID
  title: string;
  questionCount: number;
  categoryId: string;           // UUID
  isPublic: boolean;
}

/**
 * Enriched attempt with embedded quiz and stats
 * Matches AttemptSummaryDto from API documentation
 * Used by /api/v1/attempts/summary endpoint to reduce N+1 queries
 */
export interface AttemptSummaryDto {
  attemptId: string;            // UUID
  quizId: string;               // UUID
  userId: string;               // UUID
  startedAt: string;            // ISO
  completedAt?: string | null;  // ISO
  status: AttemptStatus;
  mode: AttemptMode;
  totalScore?: number | null;
  quiz: QuizSummaryDto;         // Embedded quiz summary
  stats?: AttemptStatsDto | null; // Embedded attempt statistics
}
