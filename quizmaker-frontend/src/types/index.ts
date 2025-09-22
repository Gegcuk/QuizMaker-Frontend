// Re-exports all types for convenient imports
// This allows importing multiple types from a single location

// Common types
export * from './common.types';

// Core domain types
export * from './quiz.types';
export * from './tag.types';

// Feature-specific types (with explicit exports to avoid conflicts)
export * from '../features/auth/types/auth.types';
export * from '../features/category/types/category.types';
export * from '../features/admin/types/admin.types';
export * from '../features/billing/types/billing.types';

// Question types (explicit exports to avoid conflicts with quiz types)
export type {
  QuestionType,
  Difficulty as QuestionDifficulty,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  QuestionDto,
  Sort as QuestionSort,
  Pageable as QuestionPageable,
  Page as QuestionPage,
  // Question content types based on question_controller.md
  McqOption,
  McqSingleContent,
  McqMultiContent,
  TrueFalseContent,
  OpenContent,
  GapAnswer,
  FillGapContent,
  ComplianceStatement,
  ComplianceContent,
  OrderingItem,
  OrderingContent,
  HotspotRegion,
  HotspotContent,
  MatchingItem,
  MatchingContent
} from '../features/question/types/question.types';

// Attempt types (explicit exports to avoid conflicts)
export type {
  AttemptMode,
  AttemptStatus,
  AttemptDto,
  StartAttemptRequest,
  StartAttemptResponse,
  AttemptDetailsDto,
  AnswerSubmissionRequest,
  BatchAnswerSubmissionRequest,
  AnswerSubmissionDto,
  AttemptResultDto,
  AttemptStatsDto,
  QuestionForAttemptDto,
  CurrentQuestionDto,
  QuestionTimingStatsDto
} from '../features/attempt/types/attempt.types';

// Document types (explicit exports to avoid conflicts)
export type {
  DocumentStatus,
  DocumentProcessStatus,
  NodeType,
  StructureFormat,
  ChunkType,
  ChunkingStrategy,
  DocumentDto,
  DocumentProcessDto,
  DocumentProcessViewDto,
  IngestRequestDto,
  TextSliceResponseDto,
  DocumentStructureNodeDto,
  StructureTreeResponseDto,
  StructureFlatResponseDto,
  ExtractResponseDto,
  DocumentChunkDto,
  DocumentConfigDto
} from '../features/document/types/document.types';

// Note: api.d.ts contains legacy types that conflict with new comprehensive types
// Use the new domain-specific type files instead 