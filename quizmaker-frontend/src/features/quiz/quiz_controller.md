# Quiz Controller API

Base path: `/api/v1/quizzes`

Comprehensive reference of endpoints and DTOs for quizzes. Includes payload examples, TypeScript types, generation flows, and enums (question types, difficulty, visibility, status).

## Endpoints

### POST `/`
- Purpose: Create a new quiz
- Auth: Required
- Permission: `QUIZ_CREATE`
- Headers: `Authorization: Bearer <accessToken>`
- Request body: `CreateQuizRequest`
```json
{
  "title": "My Quiz",
  "description": "A fun pop-quiz",
  "visibility": "PRIVATE",
  "difficulty": "MEDIUM",
  "isRepetitionEnabled": false,
  "timerEnabled": true,
  "estimatedTime": 10,
  "timerDuration": 5,
  "categoryId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "tagIds": ["a1b2c3d4-0000-0000-0000-000000000000"]
}
```
- Response: `201 Created`
```json
{ "quizId": "d290f1ee-6c54-4b01-90e6-d701748f0851" }
```
- Errors:
  - `400 Bad Request` for validation errors
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions

---

### GET `/`
- Purpose: List quizzes with pagination and optional filters
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Query params (pageable): `page` (0), `size` (20), `sort` (e.g., `createdAt,desc`)
- Query params (filters via `QuizSearchCriteria`):
  - `category`: string[] (category names)
  - `tag`: string[] (tag names)
  - `authorName`: string
  - `search`: string (title/description)
  - `difficulty`: `Difficulty`
- Query params (scope):
  - `scope`: string (default: "public", options: "public", "me", "all")
- Response: `200 OK` with `Page<QuizDto>`
- Rate limiting: 120 requests/minute per IP
- Notes: ETag is returned; if provided back in `If-None-Match`, endpoint may return `304 Not Modified`.
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions (scope="all" requires moderation permissions)
  - `429 Too Many Requests` for rate limit exceeded

---

### GET `/{quizId}`
- Purpose: Fetch a quiz by id
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `quizId` (UUID)
- Response: `200 OK` with `QuizDto`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `404 Not Found` if quiz doesn't exist

---

### PATCH `/{quizId}`
- Purpose: Update an existing quiz (partial)
- Auth: Required
- Permission: `QUIZ_UPDATE`
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `quizId` (UUID)
- Request body: `UpdateQuizRequest`
- Response: `200 OK` with `QuizDto`
- Errors:
  - `400 Bad Request` for validation errors
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions or ownership violations
  - `404 Not Found` if quiz doesn't exist

---

### PATCH `/bulk-update`
- Purpose: Bulk update fields across multiple quizzes
- Auth: Required
- Permission: `QUIZ_UPDATE`
- Headers: `Authorization: Bearer <accessToken>`
- Request body: `BulkQuizUpdateRequest`
- Response: `200 OK` with `BulkQuizUpdateOperationResultDto`
- Errors:
  - `400 Bad Request` for validation errors
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions or ownership violations

---

### DELETE `/{quizId}`
- Purpose: Delete a quiz
- Auth: Required
- Permission: `QUIZ_DELETE`
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `quizId` (UUID)
- Response: `204 No Content`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions or ownership violations
  - `404 Not Found` if quiz doesn't exist

---

### DELETE `?ids=<uuid1>&ids=<uuid2>...`
- Purpose: Bulk delete quizzes by ids
- Auth: Required
- Permission: `QUIZ_DELETE`
- Headers: `Authorization: Bearer <accessToken>`
- Query params: `ids` (comma-separated UUIDs)
- Response: `204 No Content`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions or ownership violations

---

### POST `/{quizId}/questions/{questionId}`
- Purpose: Associate a question with a quiz
- Auth: Required
- Permission: `QUIZ_UPDATE`
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `quizId` (UUID), `questionId` (UUID)
- Response: `204 No Content`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions or ownership violations
  - `404 Not Found` if quiz or question doesn't exist

### DELETE `/{quizId}/questions/{questionId}`
- Purpose: Remove a question from a quiz
- Auth: Required
- Permission: `QUIZ_UPDATE`
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `quizId` (UUID), `questionId` (UUID)
- Response: `204 No Content`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions or ownership violations
  - `404 Not Found` if quiz or question doesn't exist

---

### POST `/{quizId}/tags/{tagId}`
- Purpose: Add a tag to a quiz
- Auth: Required
- Permission: `QUIZ_UPDATE`
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `quizId` (UUID), `tagId` (UUID)
- Response: `204 No Content`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions or ownership violations
  - `404 Not Found` if quiz or tag doesn't exist

### DELETE `/{quizId}/tags/{tagId}`
- Purpose: Remove a tag from a quiz
- Auth: Required
- Permission: `QUIZ_UPDATE`
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `quizId` (UUID), `tagId` (UUID)
- Response: `204 No Content`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions or ownership violations
  - `404 Not Found` if quiz or tag doesn't exist

---

### PATCH `/{quizId}/category/{categoryId}`
- Purpose: Change quiz category
- Auth: Required
- Permission: `QUIZ_UPDATE`
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `quizId` (UUID), `categoryId` (UUID)
- Response: `204 No Content`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions or ownership violations
  - `404 Not Found` if quiz or category doesn't exist

---

### PATCH `/{quizId}/visibility`
- Purpose: Toggle quiz visibility (PUBLIC/PRIVATE)
- Auth: Required
- Permission: `QUIZ_MODERATE` OR `QUIZ_ADMIN`
- Headers: `Authorization: Bearer <accessToken>`
- Request body: `VisibilityUpdateRequest`
- Response: `200 OK` with `QuizDto`
- Errors:
  - `400 Bad Request` for validation errors
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions
  - `404 Not Found` if quiz doesn't exist

---

### PATCH `/{quizId}/status`
- Purpose: Change quiz status (e.g., DRAFT, PUBLISHED)
- Auth: Required
- Permission: `QUIZ_MODERATE` OR `QUIZ_ADMIN`
- Headers: `Authorization: Bearer <accessToken>`
- Request body: `QuizStatusUpdateRequest`
- Response: `200 OK` with `QuizDto`
- Errors:
  - `400 Bad Request` for validation errors or illegal status transitions
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions
  - `404 Not Found` if quiz doesn't exist

---

### GET `/{quizId}/results`
- Purpose: Get aggregated results summary
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Response: `200 OK` with `QuizResultSummaryDto`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `404 Not Found` if quiz doesn't exist

### GET `/{quizId}/leaderboard?top=10`
- Purpose: Get leaderboard for a quiz
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Query params: `top` (number, default: 10)
- Response: `200 OK` with `LeaderboardEntryDto[]`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `404 Not Found` if quiz doesn't exist

### GET `/{quizId}/attempts`
- Purpose: Owner-only attempts list for a quiz
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Response: `200 OK` with `AttemptDto[]`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for non-owner access
  - `404 Not Found` if quiz doesn't exist

---

### GET `/public`
- Purpose: List public quizzes (paginated)
- Auth: Not required
- Query params: pageable (`page`, `size`, `sort`)
- Response: `200 OK` with `Page<QuizDto>` (uses ETag/If-None-Match)
- Rate limiting: 120 requests/minute per IP
- Errors:
  - `429 Too Many Requests` for rate limit exceeded

---

### POST `/generate-from-document`
- Purpose: Start async quiz generation from a processed document
- Auth: Required
- Permission: `QUIZ_CREATE`
- Headers: `Authorization: Bearer <accessToken>`
- Request body: `GenerateQuizFromDocumentRequest`
- Response: `202 Accepted` with `QuizGenerationResponse`
- Errors:
  - `400 Bad Request` for validation errors or invalid request
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions
  - `404 Not Found` if document doesn't exist or isn't processed
  - `409 Conflict` if user already has an active generation job

### POST `/generate-from-upload` (multipart/form-data)
- Purpose: Upload a document and start async generation in one call
- Auth: Required
- Permission: `QUIZ_CREATE`
- Headers: `Authorization: Bearer <accessToken>`
- Content-Type: `multipart/form-data`
- Form fields:
  - `file`: binary (required)
  - `chunkingStrategy?`: `CHAPTER_BASED` | `FIXED_SIZE` (string)
  - `maxChunkSize?`: number
  - `quizScope?`: `ENTIRE_DOCUMENT` | `SPECIFIC_CHUNKS` | `SPECIFIC_CHAPTER` | `SPECIFIC_SECTION`
  - `chunkIndices?`: number[]
  - `chapterTitle?`: string
  - `chapterNumber?`: number
  - `quizTitle?`: string
  - `quizDescription?`: string
  - `questionsPerType`: string (JSON), e.g. `{"MCQ_SINGLE":3,"TRUE_FALSE":2}` (required)
  - `difficulty`: `Difficulty` (string) (required)
  - `estimatedTimePerQuestion?`: number
  - `categoryId?`: UUID
  - `tagIds?`: UUID[]
- Response: `202 Accepted` with `QuizGenerationResponse`
- Errors:
  - `400 Bad Request` for validation errors or invalid request
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions
  - `422 Unprocessable Entity` for document processing failures

### POST `/generate-from-text`
- Purpose: Generate from plain text (process text, chunk, and start job)
- Auth: Required
- Permission: `QUIZ_CREATE`
- Headers: `Authorization: Bearer <accessToken>`
- Request body: `GenerateQuizFromTextRequest`
- Response: `202 Accepted` with `QuizGenerationResponse`
- Errors:
  - `400 Bad Request` for validation errors or invalid request
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions
  - `409 Conflict` if user already has an active generation job
  - `422 Unprocessable Entity` for text processing failures

### GET `/generation-status/{jobId}`
- Purpose: Get status of a generation job
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `jobId` (UUID)
- Response: `200 OK` with `QuizGenerationStatus`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for unauthorized access to job
  - `404 Not Found` if generation job doesn't exist

### DELETE `/generation-status/{jobId}`
- Purpose: Cancel an active generation job
- Auth: Required
- Permission: `QUIZ_CREATE`
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `jobId` (UUID)
- Response: `200 OK` with updated `QuizGenerationStatus`
- Errors:
  - `400 Bad Request` if job cannot be cancelled
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for unauthorized access to job
  - `404 Not Found` if generation job doesn't exist

### GET `/generated-quiz/{jobId}`
- Purpose: Retrieve the generated quiz after completion
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `jobId` (UUID)
- Response: `200 OK` with `QuizDto`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for unauthorized access to quiz
  - `404 Not Found` if generation job or quiz doesn't exist
  - `409 Conflict` if generation job is not yet completed

### POST `/generation-jobs/cleanup-stale`
- Purpose: Clean up stale pending jobs
- Auth: Required
- Permission: `QUIZ_ADMIN`
- Headers: `Authorization: Bearer <accessToken>`
- Response: `200 OK` with message
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions

### POST `/generation-jobs/{jobId}/force-cancel`
- Purpose: Force cancel a specific job
- Auth: Required
- Permission: `QUIZ_ADMIN`
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `jobId` (UUID)
- Response: `200 OK` with message
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions
  - `404 Not Found` if job doesn't exist

### GET `/generation-jobs`
- Purpose: List user's generation jobs (paginated)
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Query params: pageable (`page`, `size`, `sort`)
- Response: `200 OK` with `Page<QuizGenerationStatus>`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication

### GET `/generation-jobs/statistics`
- Purpose: Get generation jobs statistics
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Response: `200 OK` with `JobStatistics`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication

---

### POST `/{quizId}/submit-for-review`
- Purpose: Submit a quiz for moderation review
- Auth: Required
- Permission: `QUIZ_UPDATE`
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `quizId` (UUID)
- Response: `204 No Content`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions or ownership violations
  - `404 Not Found` if quiz doesn't exist

### POST `/{quizId}/unpublish` (placeholder)
- Purpose: Unpublish a quiz back to draft
- Auth: Required (Admin)
- Optional body: `UnpublishRequest`
- Response: `204 No Content` (currently placeholder)

## DTOs and Types

### Enums
```ts
export type QuestionType =
  | "MCQ_SINGLE"
  | "MCQ_MULTI"
  | "OPEN"
  | "FILL_GAP"
  | "COMPLIANCE"
  | "TRUE_FALSE"
  | "ORDERING"
  | "HOTSPOT"
  | "MATCHING";

export type Difficulty = "HARD" | "MEDIUM" | "EASY";
export type Visibility = "PUBLIC" | "PRIVATE";
export type QuizStatus = "PENDING_REVIEW" | "REJECTED" | "PUBLISHED" | "DRAFT" | "ARCHIVED";
export type QuizScope = "ENTIRE_DOCUMENT" | "SPECIFIC_CHUNKS" | "SPECIFIC_CHAPTER" | "SPECIFIC_SECTION";
```

### CreateQuizRequest
```ts
type CreateQuizRequest = {
  title: string;                 // required (@NotBlank), 3-100 chars
  description?: string;          // <= 1000 chars
  visibility?: Visibility;       // default PRIVATE
  difficulty?: Difficulty;       // default MEDIUM
  isRepetitionEnabled: boolean;  // required
  timerEnabled: boolean;         // required
  estimatedTime: number;         // required (@Min(1) @Max(180)) minutes
  timerDuration: number;         // required (@Min(1) @Max(180)) minutes
  categoryId?: string;           // UUID
  tagIds?: string[];             // UUID[] (defaults to empty array)
};
```

### UpdateQuizRequest
```ts
type UpdateQuizRequest = {
  title?: string;                // 3-100 chars (@Size)
  description?: string;          // <= 1000 chars (@Size)
  visibility?: Visibility;
  difficulty?: Difficulty;
  isRepetitionEnabled?: boolean;
  timerEnabled?: boolean;
  estimatedTime?: number;        // 1..180 (@Min @Max)
  timerDuration?: number;        // 1..180 (@Min @Max)
  categoryId?: string;           // UUID
  tagIds?: string[];             // UUID[]
};
```

### BulkQuizUpdateRequest
```ts
type BulkQuizUpdateRequest = {
  quizIds: string[];            // at least 1
  update: UpdateQuizRequest;    // fields to apply
};
```

### BulkQuizUpdateOperationResultDto
```ts
type BulkQuizUpdateOperationResultDto = {
  successfulIds: string[];      // UUID[]
  failures: Record<string,string>; // map quizId -> reason
};
```

### QuizDto
```ts
type QuizDto = {
  id: string;                   // UUID
  creatorId: string;            // UUID
  categoryId?: string | null;   // UUID
  title: string;
  description?: string | null;
  visibility: Visibility;
  difficulty: Difficulty;
  status: QuizStatus;
  estimatedTime?: number | null;
  isRepetitionEnabled?: boolean | null;
  timerEnabled?: boolean | null;
  timerDuration?: number | null;
  tagIds: string[];
  createdAt: string;            // ISO
  updatedAt: string;            // ISO
};
```

### QuizSearchCriteria (query params)
```ts
// All keys are optional; pass as query params
// category and tag accept repeated params (e.g., ?category=A&category=B)
// depending on server config they may also accept comma-delimited strings
interface QuizSearchCriteria {
  category?: string[];
  tag?: string[];
  authorName?: string;
  search?: string;
  difficulty?: Difficulty;
}
```

### GenerateQuizFromDocumentRequest
```ts
type GenerateQuizFromDocumentRequest = {
  documentId: string;                 // UUID
  quizScope?: QuizScope;              // default ENTIRE_DOCUMENT
  chunkIndices?: number[];            // when SPECIFIC_CHUNKS
  chapterTitle?: string;              // when SPECIFIC_CHAPTER/SECTION
  chapterNumber?: number;             // when SPECIFIC_CHAPTER/SECTION
  quizTitle?: string;                 // <= 100
  quizDescription?: string;           // <= 500
  questionsPerType: Partial<Record<QuestionType, number>>; // each 1..10
  difficulty: Difficulty;
  estimatedTimePerQuestion?: number;  // 1..10 minutes
  categoryId?: string;                // UUID
  tagIds?: string[];                  // UUID[]
};
```

### GenerateQuizFromUploadRequest (multipart)
```ts
// Send as multipart/form-data fields
interface GenerateQuizFromUploadRequestForm {
  file: File;
  chunkingStrategy?: "CHAPTER_BASED" | "FIXED_SIZE";
  maxChunkSize?: number;              // 1000..100000
  quizScope?: QuizScope;              // default ENTIRE_DOCUMENT
  chunkIndices?: number[];
  chapterTitle?: string;
  chapterNumber?: number;
  quizTitle?: string;                 // <= 100
  quizDescription?: string;           // <= 500
  questionsPerType: string;           // JSON string: {"MCQ_SINGLE":3, ...}
  difficulty: Difficulty;
  estimatedTimePerQuestion?: number;  // 1..10
  categoryId?: string;                // UUID
  tagIds?: string[];                  // UUID[]
}
```

### GenerateQuizFromTextRequest
```ts
type GenerateQuizFromTextRequest = {
  text: string;                       // <= 300000 chars
  language?: string;                  // e.g., "en"
  chunkingStrategy?: "CHAPTER_BASED" | "FIXED_SIZE";
  maxChunkSize?: number;              // 1000..300000
  quizScope?: QuizScope;              // default ENTIRE_DOCUMENT
  chunkIndices?: number[];
  chapterTitle?: string;
  chapterNumber?: number;
  quizTitle?: string;                 // <= 100
  quizDescription?: string;           // <= 500
  questionsPerType: Partial<Record<QuestionType, number>>; // each 1..10
  difficulty: Difficulty;
  estimatedTimePerQuestion?: number;  // 1..10
  categoryId?: string;                // UUID
  tagIds?: string[];                  // UUID[]
};
```

### QuizGenerationResponse
```ts
type QuizGenerationResponse = {
  jobId: string | null;               // UUID
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  message: string;
  estimatedTimeSeconds: number;       // seconds
};
```

### QuizGenerationStatus
```ts
type QuizGenerationStatus = {
  jobId: string;                      // UUID
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  totalChunks?: number;
  processedChunks?: number;
  progressPercentage?: number;        // 0..100
  currentChunk?: string;
  estimatedCompletion?: string;       // ISO
  errorMessage?: string | null;
  totalQuestionsGenerated?: number;
  elapsedTimeSeconds?: number;
  estimatedTimeRemainingSeconds?: number | null;
  generatedQuizId?: string | null;    // UUID
  startedAt?: string;                 // ISO
  completedAt?: string | null;        // ISO
};
```

### LeaderboardEntryDto
```ts
type LeaderboardEntryDto = {
  userId: string;    // UUID
  username: string;
  bestScore: number;
};
```

### AttemptDto
```ts
type AttemptDto = {
  attemptId: string;  // UUID
  quizId: string;     // UUID
  userId: string;     // UUID
  startedAt: string;  // ISO
  status: string;     // AttemptStatus
  mode: string;       // AttemptMode
};
```

### QuizResultSummaryDto
```ts
type QuizResultSummaryDto = {
  quizId: string;           // UUID
  attemptsCount: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  passRate: number;
  questionStats: any[];     // see backend QuestionStatsDto
};
```

### Page<T>
```ts
type Sort = { sorted: boolean; unsorted: boolean; empty: boolean };

type Pageable = {
  sort: Sort;
  pageNumber: number;
  pageSize: number;
  offset: number;
  paged: boolean;
  unpaged: boolean;
};

type Page<T> = {
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
};
```

## Notes for Frontend
- **Authentication**: Most endpoints require Bearer token authentication (except `/public`).
- **Permissions**: 
  - `QUIZ_CREATE` for creating quizzes and starting generation jobs
  - `QUIZ_UPDATE` for updating quizzes and managing associations
  - `QUIZ_DELETE` for deleting quizzes
  - `QUIZ_MODERATE` OR `QUIZ_ADMIN` for visibility/status changes
  - `QUIZ_ADMIN` for cleanup and force-cancel operations
- **Ownership**: Users can only modify quizzes they own unless they have moderation permissions.
- **ETag optimization**: Both list endpoints (`/` and `/public`) return ETags. Send `If-None-Match` to leverage `304` responses.
- **Rate limiting**: Search endpoints are rate-limited to 120 requests/minute per IP.
- **Generation inputs**: `questionsPerType` is a map of `QuestionType` to counts (1..10).
- **Job polling**: Call `/generation-status/{jobId}` until terminal, then fetch `/generated-quiz/{jobId}`.
- **Scope filtering**: Use `scope` parameter in GET `/` to filter by "public", "me", or "all" (moderators only).

## Known Issues and Limitations
- **Force-cancel security**: `POST /generation-jobs/{jobId}/force-cancel` now properly requires `QUIZ_ADMIN` permission, but still doesn't verify job ownership - admins can cancel any job.
- **Placeholder endpoints**: `/{quizId}/unpublish` returns 204 without performing actions. If intended for production, wire it to moderation logic; otherwise consider hiding it.
- **Search params**: `QuizSearchCriteria.category/tag` may accept repeated query params or comma-delimited strings depending on server configuration.
- **Max chunk size**: In `GenerateQuizFromTextRequest`, `@Max` is 300000 but error messages may reference 100000 - ensure alignment.
- **Authentication requirement**: All endpoints except `/public` require authentication, which may limit public access scenarios.
- **Permission complexity**: Multiple permission requirements (OR conditions) for visibility/status changes may be confusing for frontend developers.
- **Rate limiting**: Hardcoded 120 requests/minute limit may not be configurable per environment.
- **ETag implementation**: Simple weak ETags based on result metadata may not be optimal for all caching scenarios.
- **Bulk operations**: Bulk update/delete operations don't provide detailed error information for individual failures.
- **Generation job ownership**: Job ownership validation may not be consistent across all generation-related endpoints.
