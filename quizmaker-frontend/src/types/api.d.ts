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
  questionCount?: number;
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




/* ----------  Quiz results summary  ------------------------------------ */
export interface QuestionStatsDto {
  questionId: string;
  timesAsked: number;
  timesCorrect: number;
  correctRate: number; // 0..1
}

export interface QuizResultSummaryDto {
  quizId: string;                      // Quiz UUID (added to match API)
  attemptsCount: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  passRate: number;
  questionStats: QuestionStatsDto[];
}


/* ----------  Answer submission payload  --------------------------------- */
export interface AnswerSubmissionRequest {
  questionId: string;
  response: any; // varies by question type
}
