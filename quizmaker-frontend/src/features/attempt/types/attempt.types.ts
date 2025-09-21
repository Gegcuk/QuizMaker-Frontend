// Attempt-related type definitions
// Used for quiz attempts, answer submission, progress tracking, and attempt completion as documented in the API specification

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
 * Question difficulty levels for attempts
 */
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

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
  isCorrect: boolean | null;   // null if not yet graded
  score: number | null;        // null if not yet graded
  answeredAt: string;          // ISO (Instant in Java)
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
