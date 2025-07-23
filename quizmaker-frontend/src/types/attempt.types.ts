// Attempt-related type definitions
// Used for quiz attempts, answer submission, progress tracking, and attempt completion as documented in the API specification

import { BaseEntity, AuditableEntity } from './common.types';

/**
 * Attempt modes
 */
export type AttemptMode = 'ONE_BY_ONE' | 'ALL_AT_ONCE' | 'TIMED';

/**
 * Attempt status
 */
export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'PAUSED';

/**
 * Question types for attempts
 */
export type AttemptQuestionType = 
  | 'MCQ_SINGLE'    // Multiple choice single answer
  | 'MCQ_MULTI'     // Multiple choice multiple answers
  | 'OPEN'          // Open-ended questions
  | 'FILL_GAP'      // Fill in the blank
  | 'COMPLIANCE'    // Compliance questions
  | 'TRUE_FALSE'    // True/False questions
  | 'ORDERING'      // Ordering questions
  | 'HOTSPOT';      // Hotspot questions

/**
 * Question difficulty levels for attempts
 */
export type AttemptDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

/**
 * Start attempt request
 * Matches StartAttemptRequest DTO from API documentation
 */
export interface StartAttemptRequest {
  mode: AttemptMode;  // Required: Attempt mode
}

/**
 * Start attempt response
 * Matches StartAttemptResponse DTO from API documentation
 */
export interface StartAttemptResponse {
  attemptId: string;                    // Attempt identifier
  firstQuestion?: QuestionForAttemptDto; // First question (if any)
}

/**
 * Question for attempt DTO
 * Matches QuestionForAttemptDto from API documentation
 */
export interface QuestionForAttemptDto {
  id: string;                           // Question identifier
  type: AttemptQuestionType;            // Question type
  difficulty: AttemptDifficulty;        // Question difficulty
  questionText: string;                 // Question text
  safeContent: any;                     // Safe content (no correct answers)
  hint?: string;                        // Optional hint
  attachmentUrl?: string;               // Optional attachment
}

/**
 * Attempt DTO
 * Matches AttemptDto from API documentation
 */
export interface AttemptDto {
  attemptId: string;                    // Attempt identifier
  quizId: string;                       // Quiz identifier
  userId: string;                       // User identifier
  startedAt: string;                    // Start timestamp
  status: AttemptStatus;                // Attempt status
  mode: AttemptMode;                    // Attempt mode
}

/**
 * Answer submission request
 * Matches AnswerSubmissionRequest DTO from API documentation
 */
export interface AnswerSubmissionRequest {
  questionId: string;                   // Question identifier
  response: any;                        // Answer payload (JSON)
}

/**
 * Answer submission DTO
 * Matches AnswerSubmissionDto from API documentation
 */
export interface AnswerSubmissionDto {
  answerId: string;                     // Answer identifier
  questionId: string;                   // Question identifier
  isCorrect: boolean;                   // Whether answer was correct
  score: number;                        // Score awarded
  answeredAt: string;                   // Answer timestamp
  nextQuestion?: QuestionForAttemptDto; // Next question (ONE_BY_ONE mode)
}

/**
 * Attempt result DTO
 * Matches AttemptResultDto from API documentation
 */
export interface AttemptResultDto {
  attemptId: string;                    // Attempt identifier
  quizId: string;                       // Quiz identifier
  userId: string;                       // User identifier
  startedAt: string;                    // Start timestamp
  completedAt: string;                  // Completion timestamp
  totalScore: number;                   // Total score achieved
  correctCount: number;                 // Number of correct answers
  totalQuestions: number;               // Total number of questions
  answers: AnswerSubmissionDto[];       // Detailed answers
}

/**
 * Attempt details DTO
 * Matches AttemptDetailsDto from API documentation
 */
export interface AttemptDetailsDto {
  attemptId: string;                    // Attempt identifier
  quizId: string;                       // Quiz identifier
  userId: string;                       // User identifier
  startedAt: string;                    // Start timestamp
  completedAt?: string;                 // Completion timestamp
  status: AttemptStatus;                // Attempt status
  mode: AttemptMode;                    // Attempt mode
  answers: AnswerSubmissionDto[];       // All submitted answers
}

/**
 * Batch answer submission request
 * Matches BatchAnswerSubmissionRequest DTO from API documentation
 */
export interface BatchAnswerSubmissionRequest {
  answers: AnswerSubmissionRequest[];   // Array of answers
}

/**
 * Question timing DTO
 * Matches QuestionTimingDto from API documentation
 */
export interface QuestionTimingDto {
  questionId: string;                   // Question identifier
  questionType: AttemptQuestionType;    // Question type
  difficulty: AttemptDifficulty;        // Question difficulty
  timeSpent: string;                    // Time spent (ISO 8601 duration)
  isCorrect: boolean;                   // Whether answer was correct
  questionStartedAt: string;            // Question start timestamp
  answeredAt: string;                   // Answer timestamp
}

/**
 * Attempt stats DTO
 * Matches AttemptStatsDto from API documentation
 */
export interface AttemptStatsDto {
  attemptId: string;                    // Attempt identifier
  totalTime: string;                    // Total time spent (ISO 8601 duration)
  averageTimePerQuestion: string;       // Average time per question (ISO 8601 duration)
  questionsAnswered: number;            // Questions answered
  correctAnswers: number;               // Correct answers
  accuracyPercentage: number;           // Accuracy percentage
  completionPercentage: number;         // Completion percentage
  questionTimings: QuestionTimingDto[]; // Individual question timing stats
  startedAt: string;                    // Start timestamp
  completedAt?: string;                 // Completion timestamp
} 