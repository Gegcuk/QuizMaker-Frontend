# Frontend to Backend API Workflow for AI Agents

Use this guide before changing frontend code that depends on backend DTOs,
question schemas, auth behavior, generated quiz content, attempts, documents,
media, or AI generation flows.

The core rule is simple: verify the backend contract first, then update the
frontend endpoint, service, type, adapter, and component in that order. Do not
infer API behavior from the current UI alone.

## Read First

Start with these files when the task touches backend data:

- `quizmaker-frontend/docs/api/ai_api_guide.md` - API discovery, grouped OpenAPI
  specs, question schema endpoints, auth notes, media rules, and import rules.
- `quizmaker-frontend/docs/api/question_schema_contracts.md` - generated versus
  user-authored content, safe attempt content, submission payloads, and review
  payloads for all question types.
- `AGENTS.md` - repository conventions, git safety, API contract rules, and
  verification commands.
- `quizmaker-frontend/src/api/axiosInstance.ts` - API base URL, auth token
  attachment, timeout behavior, and error interception.
- `quizmaker-frontend/src/api/endpoints.ts` and
  `quizmaker-frontend/src/features/*/services/*.endpoints.ts` - endpoint
  constants.
- `quizmaker-frontend/src/features/*/services/*.service.ts` - request methods
  and response handling.
- `quizmaker-frontend/src/features/*/types/*.types.ts` - frontend DTOs that
  should mirror backend request and response shapes.

For question and attempt work, read these next:

- `quizmaker-frontend/src/features/question/types/question.types.ts`
- `quizmaker-frontend/src/features/question/services/question.endpoints.ts`
- `quizmaker-frontend/src/features/question/services/question.service.ts`
- `quizmaker-frontend/src/features/attempt/types/attempt.types.ts`
- `quizmaker-frontend/src/features/attempt/services/attempt.endpoints.ts`
- `quizmaker-frontend/src/features/attempt/services/attempt.service.ts`
- `quizmaker-frontend/src/pages/QuizAttemptPage.tsx`
- `quizmaker-frontend/src/features/attempt/components/*Answer.tsx`

## API Base URL Rules

Runtime browser requests use the Axios instance from
`quizmaker-frontend/src/api/axiosInstance.ts`.

- Default frontend base URL: `/api`
- Local Vite proxy target: `http://localhost:8080`
- Build/prerender override: `VITE_API_BASE_URL`
- Production site URL for deploy smoke checks: `VITE_SITE_URL`

Endpoint constants usually omit `/api` and start at `/v1/...` because
`axiosInstance` supplies the API base. For example:

```ts
QUESTION_ENDPOINTS.GET_SCHEMA_BY_TYPE('FILL_GAP')
// /v1/questions/schemas/FILL_GAP
```

With the default base URL, that becomes:

```text
/api/v1/questions/schemas/FILL_GAP
```

When checking production contracts directly, use:

```text
https://www.quizzence.com/swagger-ui/index.html
https://www.quizzence.com/v3/api-docs/questions
https://www.quizzence.com/api/v1/questions/schemas/FILL_GAP
```

## Endpoint to UI Trace

When adding or changing an API-backed behavior, trace the contract through
these layers.

1. Backend contract

   Verify the endpoint in Swagger or the grouped OpenAPI document. For question
   content, also fetch the type-specific schema from
   `/api/v1/questions/schemas/{TYPE}`.

2. Endpoint constant

   Add or update the constant in the feature endpoint file when one exists.
   Examples:

   - `src/features/question/services/question.endpoints.ts`
   - `src/features/attempt/services/attempt.endpoints.ts`

   Use `src/api/endpoints.ts` for shared or older endpoint groups that already
   live there. Do not hardcode endpoint strings in components.

3. Service method

   Add or update the method in the feature service. Keep Axios calls and error
   mapping in services, not presentation components.

4. Frontend DTO/type

   Update `src/features/<feature>/types/*.types.ts` or `src/types/*` so request
   and response shapes match the backend DTOs. Avoid widening with `any` unless
   the backend field is intentionally schema-driven JSON, such as question
   `content`, attempt `safeContent`, or answer `response`.

5. Page adapter

   Put backend-specific request shaping at the page or container boundary when
   component-local state differs from backend payloads. For attempts, this is
   currently handled in `src/pages/QuizAttemptPage.tsx`.

6. UI component

   Components should render validated DTO data and emit component-level answer
   state. They should not duplicate endpoint paths or invent backend validation
   rules.

## Auth and Request Behavior

`axiosInstance` is the default API client exported through `src/services/index.ts`.
It attaches the access token from token utilities to outgoing requests and
handles token refresh behavior for 401 responses.

Before changing auth-sensitive code, read:

- `quizmaker-frontend/src/api/axiosInstance.ts`
- `quizmaker-frontend/src/utils/tokenUtils.ts`
- `quizmaker-frontend/src/features/auth/services/auth.service.ts`
- `quizmaker-frontend/src/features/auth/types/auth.types.ts`

Do not manually attach `Authorization` headers in individual services unless a
local pattern already requires it. Prefer the shared Axios instance.

## Question Schema Workflow

Question `content` is type-specific JSON. The backend is the source of truth.

Before changing question creation, editing, rendering, or generated quiz
handling:

1. Fetch the schema:

   ```text
   GET /api/v1/questions/schemas/{TYPE}
   ```

2. Compare the schema and example with:

   - `CreateQuestionRequest.content`
   - `UpdateQuestionRequest.content`
   - the matching `*Content` type in `question.types.ts`
   - the editor form for that question type
   - the attempt answer component for that question type

3. Preserve the distinction between authoring content and attempt content:

   - `QuestionDto.content` is used by creation/editing flows and may include
     solution fields.
   - `QuestionForAttemptDto.safeContent` is used by attempt UI and must not
     expose correct answers.
   - `AnswerReviewDto.correctAnswer` is only available in review/feedback flows
     when the backend returns it.

## FILL_GAP Example

Current backend content shape:

```json
{
  "text": "The {1} produces {2}.",
  "gaps": [
    { "id": 1, "answer": "mitochondria" },
    { "id": 2, "answer": "ATP" }
  ],
  "options": ["ATP", "nucleus", "mitochondria", "ribosome"]
}
```

Rules:

- `options` is optional.
- When `options` is missing or empty, the attempt UI supports typed answers.
- When `options` has values, the attempt UI shows a selectable answer pool.
- `options` may include distractors and must not be treated as ordered.
- Do not reveal which options are correct in attempt mode.
- Backend validation may require correct answers plus a specific distractor
  count. If validation fails, use the backend error text and schema instead of
  guessing.

During the attempt, `FillGapAnswer` stores component-local answers as a gap map:

```json
{
  "1": "mitochondria",
  "2": "ATP"
}
```

`QuizAttemptPage.tsx` converts that map to the backend submission format:

```json
{
  "answers": [
    { "gapId": 1, "answer": "mitochondria" },
    { "gapId": 2, "answer": "ATP" }
  ]
}
```

The attempt service wraps this as `AnswerSubmissionRequest.response`:

```json
{
  "questionId": "QUESTION_UUID",
  "response": {
    "answers": [
      { "gapId": 1, "answer": "mitochondria" },
      { "gapId": 2, "answer": "ATP" }
    ]
  },
  "includeCorrectness": true,
  "includeCorrectAnswer": true,
  "includeExplanation": true
}
```

Keep that response shape stable unless Swagger or backend code explicitly
changes it.

## Attempt Submission Workflow

Attempt endpoints live in:

- `src/features/attempt/services/attempt.endpoints.ts`
- `src/features/attempt/services/attempt.service.ts`
- `src/features/attempt/types/attempt.types.ts`

Common flow:

1. Start or resume an attempt.
2. Load current or shuffled safe questions.
3. Render `QuestionForAttemptDto.safeContent` in an answer component.
4. Store component-local answer state.
5. Convert answer state to backend `response` in `QuizAttemptPage.tsx`.
6. Submit via `AttemptService.submitAnswer` or `submitBatchAnswers`.
7. Use returned correctness, correct answer, and explanation only when the
   backend response includes those fields.

Question response examples currently shaped in `QuizAttemptPage.tsx`:

```json
{ "selectedOptionId": "a" }
```

```json
{ "selectedOptionIds": ["a", "c"] }
```

```json
{ "answer": true }
```

```json
{ "orderedItemIds": [3, 1, 2] }
```

```json
{ "matches": [{ "leftId": 1, "rightId": 4 }] }
```

The complete response table, including fill-gap, compliance, open, and hotspot,
lives in [`question_schema_contracts.md`](./question_schema_contracts.md).
Verify each shape against Swagger or the backend handler before changing it.
Do not assume submission and review shapes use the same field names.

## Backend Validation Errors

When the backend returns validation errors, do not patch around them by guessing
new frontend rules. First inspect:

- HTTP status and response body in the browser network tab.
- `ProblemDetail` fields such as `title`, `detail`, `errors`, or validation
  `details`.
- The endpoint schema in Swagger.
- Type-specific question schema for question content.
- Existing service error handling for the same feature.

Then decide whether the frontend should:

- fix a request-shaping bug,
- add a form validation message that mirrors backend constraints,
- update stale frontend DTOs,
- update generated content handling, or
- leave the backend error visible because the constraint is server-owned.

For question validation, backend error messages often contain the exact rule,
such as required distractor counts or valid field names. Prefer preserving and
surfacing those messages over introducing independent frontend-only rules.

## Docs to Update With API Changes

When a task changes backend-facing behavior, update docs in the same branch when
relevant:

- `quizmaker-frontend/docs/api/ai_api_guide.md` for API discovery, AI
  generation, question schemas, media rules, and import/export notes.
- `quizmaker-frontend/docs/api/question_schema_contracts.md` for type-specific
  authoring, safe-content, submission, and review contracts.
- This file for frontend-to-backend trace workflow.
- `AGENTS.md` when agent operating rules change.
- Feature docs under `quizmaker-frontend/docs/` when a product workflow changes.

For docs-only changes, run:

```bash
git diff --check
```

For source, workflow, or config changes, also run from `quizmaker-frontend`:

```bash
npm run lint -- --quiet
npm test
npm run build
```
