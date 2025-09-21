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

export interface PageQuestionDto {
  content: QuestionDto[];
  totalPages: number;
  number: number;
}

export interface CreateQuestionRequest {
  type: QuestionDto['type'];
  difficulty: QuestionDto['difficulty'];
  questionText: string;
  content: any;
  hint?: string;
  explanation?: string;
  attachmentUrl?: string;
  quizIds?: string[];
  tagIds?: string[];
}

export type UpdateQuestionRequest = Partial<CreateQuestionRequest>;



/* ----------  Quiz results summary  ------------------------------------ */
export interface QuizQuestionStatsDto {
  questionId: string;
  timesAsked: number;
  timesCorrect: number;
  correctRate: number; // 0..1
}

export interface QuizResultSummaryDto {
  attemptsCount: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  passRate: number;
  questionStats: QuizQuestionStatsDto[];
}


/* ----------  Answer submission payload  --------------------------------- */
export interface AnswerSubmissionRequest {
  questionId: string;
  response: any; // varies by question type
}
