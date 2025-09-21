# Attempt Controller API

Base path: `/api/v1/attempts`

Frontend‑ready reference for starting, answering, and managing quiz attempts. Includes request/response shapes, TypeScript types, and answer payload formats for all question types.

## Endpoints

### POST `/quizzes/{quizId}`
- Purpose: Start a new attempt for a quiz
- Auth: Required (Authenticated)
- Path params: `quizId` (UUID)
- Request body (JSON, optional): `StartAttemptRequest`
```json
{ "mode": "ALL_AT_ONCE" }
```
- Response: `201 Created` with `StartAttemptResponse`
- Errors: `404 Not Found` if quiz does not exist

---

### GET `/`
- Purpose: List attempts (paginated)
- Auth: Required (Authenticated)
- Query params:
  - `page` (number, default `0`)
  - `size` (number, default `20`)
  - `quizId` (UUID, optional)
  - `userId` (UUID, optional)
- Response: `200 OK` with `Page<AttemptDto>`
- Notes: Results are sorted by `startedAt` in descending order

---

### GET `/{attemptId}`
- Purpose: Get attempt details (including submitted answers)
- Auth: Required (Authenticated)
- Path params: `attemptId` (UUID)
- Response: `200 OK` with `AttemptDetailsDto`
- Errors: `404 Not Found` if attempt does not exist

---

### GET `/{attemptId}/current-question`
- Purpose: Get the current question for an in‑progress attempt
- Auth: Required (Authenticated)
- Path params: `attemptId` (UUID)
- Response: `200 OK` with `CurrentQuestionDto`
- Errors: 
  - `404 Not Found` if attempt does not exist
  - `409 Conflict` if attempt is not in progress or all questions answered

---

### POST `/{attemptId}/answers`
- Purpose: Submit a single answer
- Auth: Required (Authenticated)
- Path params: `attemptId` (UUID)
- Request body: `AnswerSubmissionRequest` (see "Answer JSON per Type")
- Response: `200 OK` with `AnswerSubmissionDto` (includes `nextQuestion` in ONE_BY_ONE mode)
- Errors:
  - `400 Bad Request` for validation errors
  - `404 Not Found` if attempt or question does not exist

---

### POST `/{attemptId}/answers/batch`
- Purpose: Submit multiple answers at once (ALL_AT_ONCE mode)
- Auth: Required (Authenticated)
- Path params: `attemptId` (UUID)
- Request body: `BatchAnswerSubmissionRequest`
- Response: `200 OK` with `AnswerSubmissionDto[]`
- Errors:
  - `400 Bad Request` for validation errors
  - `404 Not Found` if attempt does not exist
  - `409 Conflict` if invalid attempt mode or duplicate answers

---

### POST `/{attemptId}/complete`
- Purpose: Complete an attempt and get results
- Auth: Required (Authenticated)
- Path params: `attemptId` (UUID)
- Response: `200 OK` with `AttemptResultDto`
- Errors:
  - `404 Not Found` if attempt does not exist
  - `409 Conflict` if attempt is in invalid state

---

### GET `/{attemptId}/stats`
- Purpose: Get detailed timing and accuracy stats for an attempt
- Auth: Required (Authenticated)
- Path params: `attemptId` (UUID)
- Response: `200 OK` with `AttemptStatsDto`
- Errors: `404 Not Found` if attempt does not exist

---

### POST `/{attemptId}/pause`
- Purpose: Pause an in‑progress attempt
- Auth: Required (Authenticated)
- Path params: `attemptId` (UUID)
- Response: `200 OK` with `AttemptDto`
- Errors:
  - `404 Not Found` if attempt does not exist
  - `409 Conflict` if attempt cannot be paused

### POST `/{attemptId}/resume`
- Purpose: Resume a paused attempt
- Auth: Required (Authenticated)
- Path params: `attemptId` (UUID)
- Response: `200 OK` with `AttemptDto`
- Errors:
  - `404 Not Found` if attempt does not exist
  - `409 Conflict` if attempt cannot be resumed

---

### DELETE `/{attemptId}`
- Purpose: Delete an attempt (and its answers)
- Auth: Required (Authenticated)
- Path params: `attemptId` (UUID)
- Response: `204 No Content`
- Errors:
  - `401 Unauthorized` if not authenticated
  - `403 Forbidden` if user does not own the attempt
  - `404 Not Found` if attempt does not exist

---

### GET `/quizzes/{quizId}/questions/shuffled`
- Purpose: Get a randomized, safe list of questions (no correct answers)
- Auth: Required (Authenticated)
- Path params: `quizId` (UUID)
- Response: `200 OK` with `QuestionForAttemptDto[]`

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
export type AttemptMode = "ONE_BY_ONE" | "ALL_AT_ONCE" | "TIMED";
export type AttemptStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED" | "PAUSED";
```

### StartAttemptRequest
```ts
type StartAttemptRequest = {
  mode: AttemptMode; // required if body is provided
};
```

### StartAttemptResponse
```ts
type StartAttemptResponse = {
  attemptId: string;          // UUID
  quizId: string;             // UUID
  mode: AttemptMode;
  totalQuestions: number;
  timeLimitMinutes: number | null;
  startedAt: string;          // ISO (Instant in Java)
};
```

### AttemptDto
```ts
type AttemptDto = {
  attemptId: string;          // UUID
  quizId: string;             // UUID
  userId: string;             // UUID
  startedAt: string;          // ISO (Instant in Java)
  status: AttemptStatus;
  mode: AttemptMode;
};
```

### AttemptDetailsDto
```ts
type AttemptDetailsDto = {
  attemptId: string;          // UUID
  quizId: string;             // UUID
  userId: string;             // UUID
  startedAt: string;          // ISO (Instant in Java)
  completedAt: string | null; // ISO (Instant in Java)
  status: AttemptStatus;
  mode: AttemptMode;
  answers: AnswerSubmissionDto[];
};
```

### AnswerSubmissionRequest
```ts
type AnswerSubmissionRequest = {
  questionId: string; // UUID
  response: any;      // JsonNode in Java, see Answer JSON per Type
};
```

### BatchAnswerSubmissionRequest
```ts
type BatchAnswerSubmissionRequest = {
  answers: AnswerSubmissionRequest[]; // at least 1
};
```

### AnswerSubmissionDto
```ts
type AnswerSubmissionDto = {
  answerId: string;            // UUID
  questionId: string;          // UUID
  isCorrect: boolean | null;   // null if not yet graded
  score: number | null;        // null if not yet graded
  answeredAt: string;          // ISO (Instant in Java)
  nextQuestion?: QuestionForAttemptDto | null; // ONE_BY_ONE mode only
};
```

### CurrentQuestionDto
```ts
type CurrentQuestionDto = {
  question: QuestionForAttemptDto; // safe (no correct answers)
  questionNumber: number;          // 1-based
  totalQuestions: number;
  attemptStatus: AttemptStatus;
};
```

### QuestionForAttemptDto
```ts
type QuestionForAttemptDto = {
  id: string;                   // UUID
  type: QuestionType;
  difficulty: Difficulty;
  questionText: string;
  safeContent: any;             // safe content (no solution fields)
  hint?: string | null;
  attachmentUrl?: string | null;
};
```

### AttemptResultDto
```ts
type AttemptResultDto = {
  attemptId: string;           // UUID
  quizId: string;              // UUID
  userId: string;              // UUID
  startedAt: string;           // ISO
  completedAt: string;         // ISO
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  answers: AnswerSubmissionDto[];
};
```

### AttemptStatsDto
```ts
type QuestionTimingStatsDto = {
  questionId: string;          // UUID
  questionType: QuestionType;
  difficulty: Difficulty;
  timeSpent: string;           // ISO 8601 duration (e.g., PT2M30S)
  isCorrect: boolean;
  questionStartedAt: string;   // ISO
  answeredAt: string;          // ISO
};

type AttemptStatsDto = {
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

## Answer JSON per Type (for `AnswerSubmissionRequest.response`)
Use these shapes when submitting answers.

- MCQ_SINGLE
```json
{ "selectedOptionId": "A" }
```

- MCQ_MULTI
```json
{ "selectedOptionIds": ["A", "C"] }
```

- TRUE_FALSE
```json
{ "answer": true }
```

- OPEN
```json
{ "answer": "Free-text exact expected answer" }
```

- FILL_GAP
```json
{ "answers": [ { "gapId": 1, "answer": "France" } ] }
```

- ORDERING
```json
{ "orderedItemIds": [1, 2, 3] }
```

- HOTSPOT
```json
{ "selectedRegionId": 2 }
```

- COMPLIANCE
```json
{ "selectedStatementIds": [1, 3] }
```

- MATCHING
```json
{ "matches": [ { "leftId": 1, "rightId": 10 }, { "leftId": 2, "rightId": 11 } ] }
```

## Notes
- Safe content: `QuestionForAttemptDto.safeContent` hides solution fields (e.g., no `correct` flags, answers, or mappings).
- Modes:
  - `ONE_BY_ONE`: submit per question; `AnswerSubmissionDto.nextQuestion` may be returned.
  - `ALL_AT_ONCE`: fetch questions, submit via batch, then complete.
  - `TIMED`: respect `timeLimitMinutes` in `StartAttemptResponse`.
- Security: All endpoints require authentication and enforce ownership checks. Users can only access their own attempts unless they have admin privileges.
- Default mode: If no mode is specified in `StartAttemptRequest`, the system defaults to `ALL_AT_ONCE`.
- Grading: `isCorrect` and `score` fields in `AnswerSubmissionDto` may be `null` if answers haven't been graded yet.

## Security and Authorization
- **Ownership enforcement**: Users can only access, modify, or delete their own attempts
- **Admin access**: Users with appropriate permissions can access other users' attempts for administrative purposes
- **Stats access**: Attempt statistics are restricted to the attempt owner or users with admin privileges
- **User filtering**: The `userId` filter in attempt listing respects ownership and permission checks

## Known Issues and Limitations
- **Swagger example drift**: The controller's Swagger example for `StartAttemptResponse` includes `firstQuestion: null` which is no longer present in the actual DTO. The example should be updated to match the current `StartAttemptResponse` structure.
- **Batch submission validation**: Batch answer submission validates that all answers are for the same attempt and prevents duplicate submissions.
- **Grading timing**: Answer grading may be asynchronous, so `isCorrect` and `score` fields might be `null` immediately after submission.
