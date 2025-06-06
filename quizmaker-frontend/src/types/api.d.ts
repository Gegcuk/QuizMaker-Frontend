// src/types/api.d.ts
// ---------------------------------------------------------------------------
// Minimal type stubs extracted from your Swagger description.
// Extend freely as your backend evolves.
// ---------------------------------------------------------------------------

/* ----------  Quizzes & pagination  -------------------------------------- */
export interface QuizDto {
  id: string;
  title: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedTime: number;

  /* fields we were missing */
  creatorId: string;
  categoryId?: string;
  tagIds?: string[];
  timerEnabled: boolean;
  timerDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageQuizDto {
  content: QuizDto[];
  totalPages: number;
  number: number; // zero-based current page
}

/* ----------  Categories & Tags  ---------------------------------------- */
export interface CategoryDto {
  id: string;
  name: string;
  description?: string;
}

export interface TagDto {
  id: string;
  name: string;
  description?: string;
}

export interface PageCategoryDto {
  content: CategoryDto[];
  totalPages: number;
  number: number;
}

export interface PageTagDto {
  content: TagDto[];
  totalPages: number;
  number: number;
}

/* ----------  Quiz create / update payloads ----------------------------- */
export interface CreateQuizRequest {
  title: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedTime: number;
  timerEnabled: boolean;
  timerDuration?: number;
  categoryId?: string;
  tagIds?: string[];
}

export type UpdateQuizRequest = Partial<CreateQuizRequest>;

/* ----------  Questions  ------------------------------------------------- */
export interface QuestionDto {
  id: string;
  type:
    | 'MCQ_SINGLE'
    | 'TRUE_FALSE'
    | 'MCQ_MULTI'
    | 'OPEN'
    | 'FILL_GAP'
    | 'COMPLIANCE'
    | 'ORDERING'
    | 'HOTSPOT';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionText: string;
  content: any;
  hint?: string;
  explanation?: string;
  attachmentUrl?: string;
  quizIds: string[];
  tagIds: string[];
}

/* ----------  Attempts & answers  --------------------------------------- */
export interface AttemptDto {
  attemptId: string;
  quizId: string;
  userId: string;
  startedAt: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  mode: 'ONE_BY_ONE' | 'ALL_AT_ONCE' | 'TIMED';
}

export interface AnswerSubmissionDto {
  answerId: string;
  questionId: string;
  isCorrect: boolean;
  score: number;
  answeredAt: string;
  nextQuestion?: QuestionDto;
}

export interface AttemptDetailsDto extends AttemptDto {
  completedAt?: string;
  answers: AnswerSubmissionDto[];
}

export interface AttemptResultDto {
  attemptId: string;
  quizId: string;
  userId: string;
  startedAt: string;
  completedAt: string;
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  answers: AnswerSubmissionDto[];
}

/* ----------  Answer submission payload  --------------------------------- */
export interface AnswerSubmissionRequest {
  questionId: string;
  response: any; // varies by question type
}
