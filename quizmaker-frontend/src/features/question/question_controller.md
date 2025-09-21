# Question Controller API

Base path: `/api/v1/questions`

Comprehensive reference of endpoints and DTOs for questions. Includes payload examples, TypeScript types, and content JSON shapes per question type.

## Endpoints

### POST `/`
- Purpose: Create a new question
- Auth: Required
- Permission: `QUESTION_CREATE`
- Headers: `Authorization: Bearer <accessToken>`
- Request body (JSON): `CreateQuestionRequest`
```json
{
  "type": "MCQ_SINGLE",
  "difficulty": "MEDIUM",
  "questionText": "What is the capital of France?",
  "content": {
    "options": [
      { "id": "A", "text": "Paris", "correct": true },
      { "id": "B", "text": "Berlin", "correct": false }
    ]
  },
  "hint": "Think Eiffel Tower",
  "explanation": "Paris is the capital of France.",
  "attachmentUrl": "https://example.com/image.png",
  "quizIds": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
  "tagIds":  ["3fa85f64-5717-4562-b3fc-2c963f66afb7"]
}
```
- Response: `201 Created`
```json
{ "questionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6" }
```
- Errors:
  - `400 Bad Request` for validation errors
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions or quiz ownership violations

---

### GET `/`
- Purpose: List questions (optionally filter by quiz)
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Query params:
  - `quizId` (UUID, optional)
  - `pageNumber` (number, default `0`)
  - `size` (number, default `20`)
- Sort: fixed to `createdAt,desc`
- Response: `200 OK` with `Page<QuestionDto>`
- Errors: `401 Unauthorized` for missing or invalid authentication

---

### GET `/{id}`
- Purpose: Get a question by ID
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `id` (UUID)
- Response: `200 OK` with `QuestionDto`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `404 Not Found` if question doesn't exist

---

### PATCH `/{id}`
- Purpose: Update an existing question
- Auth: Required
- Permission: `QUESTION_UPDATE`
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `id` (UUID)
- Request body (JSON): `UpdateQuestionRequest`
```json
{
  "type": "OPEN",
  "difficulty": "HARD",
  "questionText": "Explain mass-energy equivalence",
  "content": { "answer": "E=mc^2 relates mass and energy" },
  "hint": "Think relativity",
  "explanation": "Detailed explanation...",
  "attachmentUrl": "https://example.com/figure.png",
  "quizIds": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
  "tagIds":  ["3fa85f64-5717-4562-b3fc-2c963f66afb7"]
}
```
- Response: `200 OK` with updated `QuestionDto`
- Errors:
  - `400 Bad Request` for validation errors
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions or quiz ownership violations
  - `404 Not Found` if question doesn't exist

---

### DELETE `/{id}`
- Purpose: Delete a question
- Auth: Required
- Permission: `QUESTION_DELETE`
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `id` (UUID)
- Response: `204 No Content`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions or quiz ownership violations
  - `404 Not Found` if question doesn't exist

## DTOs

### `CreateQuestionRequest`
```ts
// Enums used below
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

export type CreateQuestionRequest = {
  type: QuestionType;                 // required (@NotNull)
  difficulty: Difficulty;             // required (@NotNull)
  questionText: string;               // required (@NotBlank), 3-1000 chars
  content: any;                       // required (@NotNull), see Content JSON per type
  hint?: string;                      // <= 500 chars
  explanation?: string;               // <= 2000 chars
  attachmentUrl?: string;             // URL <= 2048 chars
  quizIds?: string[];                 // UUIDs to associate (defaults to empty array)
  tagIds?: string[];                  // UUIDs to associate (defaults to empty array)
};
```

### `UpdateQuestionRequest`
```ts
export type UpdateQuestionRequest = {
  type: QuestionType;                 // required (@NotNull)
  difficulty: Difficulty;             // required (@NotNull)
  questionText: string;               // required (@NotBlank), 3-1000 chars
  content: any;                       // required (@NotNull), see Content JSON per type
  hint?: string;                      // <= 500 chars
  explanation?: string;               // <= 2000 chars
  attachmentUrl?: string;             // URL <= 2048 chars
  quizIds?: string[];                 // UUIDs to (re)associate
  tagIds?: string[];                  // UUIDs to (re)associate
};
```

### `QuestionDto`
```ts
export type QuestionDto = {
  id: string;              // UUID
  type: QuestionType;
  difficulty: Difficulty;
  questionText: string;
  content: any | null;     // see safe content notes
  hint?: string | null;
  explanation?: string | null;
  attachmentUrl?: string | null;
  createdAt: string;       // ISO date-time (UTC)
  updatedAt: string;       // ISO date-time (UTC)
  quizIds: string[];       // UUIDs
  tagIds: string[];        // UUIDs
};
```

### `Page<T>`
```ts
export type Sort = { sorted: boolean; unsorted: boolean; empty: boolean };
export type Pageable = {
  sort: Sort;
  pageNumber: number;
  pageSize: number;
  offset: number;
  paged: boolean;
  unpaged: boolean;
};
export type Page<T> = {
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

## Content JSON per Question Type
Use these shapes in `content` when creating or updating questions.

- MCQ_SINGLE: one correct option
```json
{
  "options": [
    { "id": "A", "text": "Option A", "correct": true },
    { "id": "B", "text": "Option B", "correct": false }
  ]
}
```

- MCQ_MULTI: one or more correct options
```json
{
  "options": [
    { "id": "A", "text": "Option A", "correct": true },
    { "id": "B", "text": "Option B", "correct": false },
    { "id": "C", "text": "Option C", "correct": true }
  ]
}
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
{
  "text": "The capital of ___ is Paris.",
  "gaps": [ { "id": 1, "answer": "France" } ]
}
```

- ORDERING
```json
{
  "items": [
    { "id": 1, "text": "First" },
    { "id": 2, "text": "Second" },
    { "id": 3, "text": "Third" }
  ]
}
```

- HOTSPOT
```json
{
  "imageUrl": "https://example.com/image.png",
  "regions": [
    { "id": 1, "x": 10, "y": 20, "width": 100, "height": 80, "correct": true },
    { "id": 2, "x": 150, "y": 20, "width": 120, "height": 90, "correct": false }
  ]
}
```

- COMPLIANCE
```json
{
  "statements": [
    { "id": 1, "text": "Always wear safety goggles", "compliant": true },
    { "id": 2, "text": "Ignore warning signs", "compliant": false }
  ]
}
```

- MATCHING
```json
{
  "left":  [
    { "id": 1, "text": "H2O",  "matchId": 10 },
    { "id": 2, "text": "NaCl", "matchId": 11 }
  ],
  "right": [
    { "id": 10, "text": "Water" },
    { "id": 11, "text": "Salt" }
  ]
}
```

## Notes for Frontend
- **Authentication**: All endpoints require Bearer token authentication.
- **Permissions**: 
  - `POST /` requires `QUESTION_CREATE` permission
  - `PATCH /{id}` requires `QUESTION_UPDATE` permission  
  - `DELETE /{id}` requires `QUESTION_DELETE` permission
- **Ownership Validation**: 
  - Users can only create questions for quizzes they own or have moderation permissions for
  - Quiz ownership is validated for all referenced `quizIds`
  - Users with `QUIZ_MODERATE` or `QUESTION_ADMIN` permissions can create questions for any quiz
- **Validation**:
  - `questionText` 3–1000 chars; `hint` <= 500; `explanation` <= 2000; `attachmentUrl` <= 2048.
  - Content must match the shapes above; handlers enforce constraints (counts, uniqueness, required fields, etc.).
- **Safe content**: `QuestionDto.content` may omit correct answers to prevent leakage to clients.

## Known Issues and Limitations
- **Authentication requirement**: All endpoints require authentication, including read operations, which may limit public access scenarios.
- **Permission-based authorization**: Uses `@RequirePermission` annotations instead of role-based checks, requiring specific permissions for each operation.
- **Quiz ownership validation**: Strict ownership checks for quiz associations may prevent cross-quiz question sharing.
- **Content validation**: Content JSON validation is handled by type-specific handlers, but error messages may not be user-friendly.
- **Default collections**: `quizIds` and `tagIds` default to empty arrays in `CreateQuestionRequest`, but are nullable in `UpdateQuestionRequest`.
- **JsonNode content**: Uses `JsonNode` for content instead of strongly-typed objects, which may lead to runtime validation issues.
- **Missing Swagger examples**: While OpenAPI annotations are present, comprehensive examples for each question type are missing.
- **Error handling**: Generic exception handling may not provide specific error details for validation failures.
