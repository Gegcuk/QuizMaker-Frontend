// Re-exports all types for convenient imports
// This allows importing multiple types from a single location

// Common types (includes shared QuestionType and Difficulty)
export * from './common.types';

// Core domain types
export * from '../features/quiz/types/quiz.types';
export * from '../features/tag/types/tag.types';

// Feature-specific types (with explicit exports to avoid conflicts)
export * from '../features/auth/types/auth.types';
export * from '../features/category/types/category.types';
export * from '../features/admin/types/admin.types';
export * from '../features/billing/types/billing.types';
export type {
  BugReportDto,
  BugReportListParams,
  BugReportPage,
  BugReportStatus,
  BugSeverity,
  CreateBugReportRequest,
  UpdateBugReportRequest,
  BugReportSubmissionResponse,
  PageableObject,
  SortObject,
} from '../features/bug-report/types/bug-report.types';
export type {
  MediaAssetListResponse,
  MediaAssetResponse,
  MediaAssetStatus,
  MediaAssetType,
  MediaRefDto,
  MediaSearchParams,
  MediaSearchResponse,
  MediaUploadCompleteRequest,
  MediaUploadRequest,
  MediaUploadResponse,
  UploadTargetDto,
} from '../features/media/types/media.types';

// Question types (explicit exports to avoid conflicts)
// Note: QuestionType and Difficulty are now in common.types and exported from there
export type {
  CreateQuestionRequest,
  UpdateQuestionRequest,
  QuestionDto,
  QuestionSchemaResponse,
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

// Re-export Difficulty as QuestionDifficulty for backward compatibility
export type { Difficulty as QuestionDifficulty } from './common.types';

// Attempt types (explicit exports to avoid conflicts)
// Note: QuestionType and Difficulty are now in common.types
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
  AttemptReviewDto,
  AnswerReviewDto,
  AttemptSummaryDto,
  QuizSummaryDto,
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
  IngestResponseDto,
  TextSliceResponseDto,
  DocumentStructureNodeDto,
  StructureTreeResponseDto,
  StructureFlatResponseDto,
  ExtractResponseDto,
  DocumentChunkDto,
  DocumentConfigDto,
  ProcessDocumentRequest
} from '../features/document/types/document.types';

// Legacy API types (from api.d.ts) - kept for backward compatibility
export type {
  QuestionStatsDto,
  QuizResultSummaryDto
} from './api.d';

// Note: api.d.ts contains legacy types that conflict with new comprehensive types
// Use the new domain-specific type files instead 
