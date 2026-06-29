# Question Schema Contracts

Use this reference when changing AI generation, question create/edit forms,
attempt answer components, or answer review UI. Question `content` is
schema-driven JSON, so TypeScript types and current rendering behavior are not
the source of truth by themselves.

Last verified: 2026-06-29 against backend commit `a8c55c4`.

## Source of Truth

Check these sources in this order:

1. `GET /api/v1/questions/schemas/{TYPE}` for the public schema and example.
2. `GET /v3/api-docs/questions` for create/update request envelopes.
3. `GET /v3/api-docs/attempts` for attempt DTO envelopes.
4. Backend question handlers and `SafeQuestionContentBuilder` when generated
   and user-authored validation intentionally differ.

Useful production URLs:

- `https://www.quizzence.com/api/v1/questions/schemas`
- `https://www.quizzence.com/api/v1/questions/schemas/FILL_GAP`
- `https://www.quizzence.com/v3/api-docs/questions`
- `https://www.quizzence.com/v3/api-docs/attempts`
- `https://www.quizzence.com/swagger-ui/index.html`

If the endpoint and this document disagree, the endpoint wins. Update this
document in the same change that updates frontend DTOs or adapters.

## Frontend Integration Points

- Authoring DTOs and content types:
  `src/features/question/types/question.types.ts`
- Create/edit form and preview shaping:
  `src/features/question/components/QuestionForm.tsx`
- Type-specific editors:
  `src/features/question/components/*Editor.tsx`
- Attempt DTOs:
  `src/features/attempt/types/attempt.types.ts`
- Attempt response adapter:
  `src/pages/QuizAttemptPage.tsx`
- Attempt answer controls:
  `src/features/attempt/components/*Answer.tsx`
- Result and review rendering:
  `src/features/result/components/QuizResultPage.tsx`

`QuestionDto.content` is authoring content and includes solution fields.
`QuestionForAttemptDto.safeContent` is learner-facing and must omit solution
fields. `AnswerSubmissionRequest.response` is the learner's answer.
`AnswerSubmissionDto.correctAnswer` is review-only output returned when
`includeCorrectAnswer` is true.

## Generated Versus User-Authored Content

The backend deliberately applies different constraints in these paths:

- AI generation uses the strict schema from `QuestionSchemaRegistry`. AI
  schemas remove item-level `media` fields and require text instead.
- Create/update requests use the question handler for the selected type.
  User-authored MCQ, ordering, and matching questions may accept fewer items
  than AI generation requires.
- AI-generated `FILL_GAP` requires `content.options`. Legacy and manually
  authored fill-gap questions may omit it.
- If authored content does include fill-gap options, it must satisfy the same
  answer-pool validation as generated content.

Do not copy an AI-only item count into an editor unless the product intends to
enforce that stricter authoring rule.

| Type | AI generation constraints | User create/update constraints |
| --- | --- | --- |
| `MCQ_SINGLE` | Exactly 4 options | At least 2 options |
| `MCQ_MULTI` | 4-6 options | At least 2 options |
| `TRUE_FALSE` | Boolean answer | Boolean answer |
| `OPEN` | String model answer | Non-blank model answer |
| `FILL_GAP` | 1-3 gaps and required option pool | At least 1 gap; option pool optional |
| `COMPLIANCE` | 2-6 statements | 2-6 statements |
| `ORDERING` | 3-10 items | 2-10 items |
| `HOTSPOT` | 2-6 regions | 2-6 regions |
| `MATCHING` | At least 4 items per side | At least 2 items per side |

## Common Authoring Envelope

Question create and update requests contain the type-specific object under
`content`:

```json
{
  "type": "TRUE_FALSE",
  "difficulty": "MEDIUM",
  "questionText": "The statement to evaluate.",
  "content": {
    "answer": true
  },
  "hint": "Optional hint",
  "explanation": "Optional explanation",
  "attachmentAssetId": null,
  "quizIds": [],
  "tagIds": []
}
```

Required request fields are `type`, `difficulty`, `questionText`, and
`content`. The AI structured-output envelope additionally requires `hint`,
`explanation`, and `confidence`. Do not send AI-only `confidence` as part of a
question create/update request unless the API contract adds it.

For MCQ options, compliance statements, ordering items, and matching items,
authored content may use either non-blank `text` or a valid
`media.assetId`. AI output must use text and must not invent media IDs.

## Content by Question Type

### MCQ_SINGLE

```json
{
  "options": [
    { "id": "a", "text": "Option A", "correct": false },
    { "id": "b", "text": "Option B", "correct": true },
    { "id": "c", "text": "Option C", "correct": false },
    { "id": "d", "text": "Option D", "correct": false }
  ]
}
```

Option IDs must be non-blank and unique. Exactly one option must be correct.
The attempt payload is:

```json
{ "selectedOptionId": "b" }
```

### MCQ_MULTI

The content shape is the same as `MCQ_SINGLE`, but one or more options may be
correct. Option IDs remain non-blank and unique.

```json
{ "selectedOptionIds": ["a", "c"] }
```

The backend compares selected and correct IDs as sets, so answer order is not
significant.

### TRUE_FALSE

```json
{ "answer": true }
```

The attempt payload uses the same field and must contain a JSON boolean, not a
string:

```json
{ "answer": false }
```

### OPEN

```json
{ "answer": "A non-empty model answer." }
```

The attempt payload is:

```json
{ "answer": "The learner's answer" }
```

Current automatic grading trims and compares case-insensitively. It does not
perform semantic or fuzzy matching.

### FILL_GAP

Manual or legacy mode omits `options`:

```json
{
  "text": "The {1} produces {2}.",
  "gaps": [
    { "id": 1, "answer": "mitochondria" },
    { "id": 2, "answer": "ATP" }
  ]
}
```

Option-pool mode adds every correct answer plus distractors:

```json
{
  "text": "The {1} produces {2}.",
  "gaps": [
    { "id": 1, "answer": "mitochondria" },
    { "id": 2, "answer": "ATP" }
  ],
  "options": [
    "ATP",
    "nucleus",
    "mitochondria",
    "ribosome",
    "glucose",
    "chloroplast",
    "DNA",
    "cytoplasm"
  ]
}
```

Validation rules:

- `text` is non-blank and uses `{N}` markers.
- Gap IDs are unique, sequential positive integers starting at 1.
- Every marker has a matching gap, and every gap appears in `text`.
- Gap answers are non-blank.
- AI output must include `options`; manual and legacy content may omit it.
- When `options` exists, its values are internally unique and the gap answers
  are internally unique after trim and case-insensitive comparison.
- `options` includes every gap answer plus exactly 6-7 distractors. Total size
  is therefore `gaps.length + 6` through `gaps.length + 7`.
- Option order is not meaningful. Safe attempt content randomizes it.
- Distractors must not be marked or otherwise reveal correctness.

Both typed and option-pool modes submit the same response:

```json
{
  "answers": [
    { "gapId": 1, "answer": "mitochondria" },
    { "gapId": 2, "answer": "ATP" }
  ]
}
```

`FillGapAnswer` stores a gap-ID map locally. `QuizAttemptPage.tsx` converts it
to the ordered `answers` array above.

### COMPLIANCE

```json
{
  "statements": [
    { "id": 1, "text": "Compliant action", "compliant": true },
    { "id": 2, "text": "Non-compliant action", "compliant": false }
  ]
}
```

Statement IDs must be unique. At least one statement must be compliant. The
attempt payload contains every selected statement ID:

```json
{ "selectedStatementIds": [1] }
```

The selected list is compared as a set. Duplicate IDs make the answer
incorrect.

### ORDERING

Items are stored in correct order. The attempt service shuffles safe content
for display.

```json
{
  "items": [
    { "id": 1, "text": "First step" },
    { "id": 2, "text": "Second step" },
    { "id": 3, "text": "Third step" }
  ]
}
```

Item IDs must be unique. Generated content uses sequential IDs matching the
correct position. The attempt payload sends the learner's full ordering:

```json
{ "orderedItemIds": [2, 1, 3] }
```

Some export/shuffle paths may include a `correctOrder` array. Preserve it when
round-tripping existing content, but do not add it to newly authored content
unless the backend schema explicitly exposes it.

### HOTSPOT

```json
{
  "imageUrl": "https://example.com/image.png",
  "regions": [
    { "id": 1, "x": 10, "y": 20, "width": 40, "height": 40, "correct": true },
    { "id": 2, "x": 60, "y": 20, "width": 40, "height": 40, "correct": false }
  ]
}
```

`imageUrl` must be non-blank. Region IDs must be unique, coordinates and sizes
must be non-negative integers, and at least one region must be correct.

The backend handler expects:

```json
{ "selectedRegionId": 1 }
```

Contract warning: as of the verification date, `buildQuestionResponse` in
`QuizAttemptPage.tsx` emits `{ "regionId": ... }`. That adapter does not match
the backend handler's `selectedRegionId` field and should be corrected in a
focused source change with an answer-shape test.

### MATCHING

Each left item points to the correct right item through `matchId`:

```json
{
  "left": [
    { "id": 1, "text": "Term A", "matchId": 11 },
    { "id": 2, "text": "Term B", "matchId": 12 }
  ],
  "right": [
    { "id": 11, "text": "Definition A" },
    { "id": 12, "text": "Definition B" }
  ]
}
```

IDs are integers and unique within each side. Every `left.matchId` must refer
to an existing right-side ID. Safe content removes `matchId` and shuffles the
right column.

The attempt payload is:

```json
{
  "matches": [
    { "leftId": 1, "rightId": 11 },
    { "leftId": 2, "rightId": 12 }
  ]
}
```

## Safe Attempt Content

The attempt UI must consume `safeContent`, not authoring `content`.

| Type | Safe content behavior |
| --- | --- |
| `MCQ_SINGLE`, `MCQ_MULTI` | Keeps option `id`, `text`/`media`; removes `correct` |
| `TRUE_FALSE`, `OPEN` | Empty object; question text is sufficient |
| `FILL_GAP` | Keeps `text`, gap IDs, and optional shuffled options; removes gap answers |
| `COMPLIANCE` | Keeps statement `id`, `text`/`media`; removes `compliant` |
| `ORDERING` | Keeps items and shuffles them during an active attempt |
| `HOTSPOT` | Keeps image and geometry; removes `correct` |
| `MATCHING` | Keeps both sides, removes `matchId`, and shuffles the right side |

Never reconstruct solution fields from ordering, option position, IDs, or
other presentation details. Treat all display order as non-semantic.

## Correct Answer Review Shapes

When `includeCorrectAnswer` is true, `AnswerSubmissionDto.correctAnswer` uses
these normalized shapes:

| Type | `correctAnswer` shape |
| --- | --- |
| `MCQ_SINGLE` | `{ "correctOptionId": "b" }` |
| `MCQ_MULTI` | `{ "correctOptionIds": ["a", "c"] }` |
| `TRUE_FALSE` | `{ "answer": true }` |
| `OPEN` | `{ "answer": "model answer" }` |
| `FILL_GAP` | `{ "answers": [{ "id": 1, "text": "Paris" }] }` |
| `COMPLIANCE` | `{ "compliantIds": [1, 3] }` |
| `ORDERING` | `{ "order": [1, 2, 3] }` |
| `HOTSPOT` | `{ "regionId": 1 }` |
| `MATCHING` | `{ "pairs": [{ "leftId": 1, "rightId": 11 }] }` |

These review shapes are not interchangeable with submission shapes. For
example, matching submits `matches` but review returns `pairs`.

## Editor and Adapter Rules

When creating or editing questions:

1. Preserve unknown schema-compatible fields when editing existing content.
2. Keep correctness fields in authoring content, but remove them from local
   attempt previews just as the backend safe-content builder does.
3. Do not derive validation solely from visible UI limits. Compare the public
   schema with the relevant backend create/update behavior.
4. Keep IDs stable while editing. Do not rely on array position as identity.
5. Do not sort randomized answer pools or matching options into a pattern that
   reveals the answer.
6. For generated content, require text rather than inventing `media.assetId`.
7. Convert component-local answer state to the exact backend response shape at
   the page/container boundary, currently `QuizAttemptPage.tsx`.

## Contract Change Checklist

For future schema changes:

1. Fetch the type schema and grouped question/attempt OpenAPI documents.
2. Compare generated and create/update validation paths.
3. Update `question.types.ts` and `attempt.types.ts` without widening unrelated
   fields.
4. Update the editor, safe preview adapter, attempt component, submission
   adapter, and review renderer as applicable.
5. Add focused tests for content validation and emitted answer shape.
6. Update this document and `ai_api_guide.md` in the same branch.
