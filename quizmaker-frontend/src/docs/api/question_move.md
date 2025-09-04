# Question Move Implementation Plan

This plan migrates question creation and management into the quiz create/edit form. It shows a quiz-only list with edit/delete actions per item, reuses the existing question form UI, and fixes logic gaps found in the current flow.

## Implementation Status

- Step 1 — Inline manager: Implemented (QuizQuestionInline with Add/Edit/Delete, modal-based form).
- Step 2 — Wire into QuizForm: Implemented (replaced bank selector with inline list).
- Step 3 — Diff add/remove on edit: Implemented (tracks initial IDs, applies adds/removals on save).
- Step 4 — Split validation (draft vs publish): Implemented (draft doesn’t require questions; publish does).
- Step 5 — Reuse QuestionForm in modal: Implemented and enhanced (type-specific editors, hint field, compact mode, default difficulty, Save & Add Another, stable callbacks to prevent loops).
- Step 6 — Route to Questions tab: Implemented (query param parsing + deep-link from Quiz Detail).
- Step 7 — Deprecate old page: Implemented via redirect to the Questions tab.
- Step 8 — Attach Existing (optional): Not implemented (placeholder reserved for later).

Additional fixes implemented
- Toast notifications: Added global `ToastProvider` and used toasts for add/edit/remove question and quiz save outcomes.
- Navigation stability: Prevent parent form submission by setting `type="button"` on inline actions and `stopPropagation()` in modal submit handler.
- Infinite render fix: Stabilized editor callbacks in `QuestionForm` with `useCallback` to avoid "Maximum update depth exceeded" when editors call `onChange` inside effects.
- Consistent fallbacks: When not using modal `onSuccess`, `QuestionForm` navigates back to `/quizzes/:quizId/edit?tab=questions`.

## Current State Analysis

### Where Things Are Today (original)

- Quiz edit/create: `src/components/quiz/QuizForm.tsx` builds a tabbed form whose Questions tab initially used a global question bank selector.
- Standalone question creation UI: `src/components/question/QuestionForm.tsx` existed but lacked edit loader and modal-friendly behavior.
- Separate Manage Questions page duplicated list and creation UI.
- Services were present for quiz/question CRUD.

### Where Things Are Now (after implementation)

- Questions tab shows a quiz-only list via `QuizQuestionInline` with Add/Edit/Delete and a modal `QuestionForm`.
- `QuestionForm` provides full parity with the rich editors (MCQ, TF, Open, Fill Gap, Compliance, Ordering, Hotspot), plus Hint, Save & Add Another, compact layout, and default difficulty.
- Legacy route `/quizzes/:quizId/questions` redirects to `/quizzes/:quizId/edit?tab=questions`; Quiz Detail’s “Questions” button deep-links to that tab.

### Requirements Summary
Move creation/edit inline into the Quiz form; list only this quiz's questions (not the full bank); each item has edit and delete icons; reuse the same question form with minor UX polish; fix any logic flaws.

## Target UX

### In QuizForm's "Questions" tab
- Show a quiz-only "Current Questions" list.
- Each item shows summary + action icons (edit pencil, delete trash).
- "Add Question" opens a modal with the same creation UI.
- Optional: "Attach Existing" opens a compact search modal to attach items from the bank; keep it behind a button to keep the default view quiz-only.
- From QuizDetail, the Questions action routes to QuizForm with the Questions tab active.

## Implementation Steps

### Step 1 — Add inline manager component

Create `src/components/quiz/QuizQuestionInline.tsx`.

Props
- `quizId?: string` — undefined while creating a new quiz.
- `questionIds: string[]`, `onChange(ids: string[])` — sync with `QuizForm`’s selection state.

State
- `questions: QuestionDto[]`, `loading`, `error`.
- Modal state: `showModal`, `editingQuestionId?: string`.

Behavior
- If `quizId` present (editing), load `getQuizQuestions(quizId)` on mount to populate `questions` and ensure `onChange([...ids])` reflects that set.
- Add Question
  - Open modal with `QuestionForm` (see Step 5).
  - On success:
    - If editing (`quizId` defined): `addQuestionToQuiz(quizId, newId)` then `getQuestionById(newId)` and append to `questions` and `onChange([...ids, newId])`.
    - If creating (no `quizId`): `getQuestionById(newId)`, append to local `questions`, call `onChange([...ids, newId])`.
- Edit Question
  - Open modal with `questionId` to edit in place; on success, refetch via `getQuestionById` and replace the item.
- Remove Question
  - If editing: `removeQuestionFromQuiz(quizId, id)`; update local state and `onChange(ids.filter(...))`.
  - If creating: just update local arrays and `onChange`.

UI
- Use `QuestionRenderer` in read-only mode or a compact summary with type/difficulty badges (as in `QuizQuestionPage.tsx`).
- Action icons from `@heroicons/react` with tooltips.
- Buttons: primary "Add Question", secondary "Attach Existing" (optional small selector modal).

### Step 2 — Wire it into QuizForm

Replace the global bank selector with the new inline list.

In `src/components/quiz/QuizForm.tsx:376`, replace the `QuizQuestionManager` block with:

```tsx
<QuizQuestionInline
  quizId={quizId || undefined}
  questionIds={selectedQuestionIds}
  onChange={handleQuestionsChange}
/>
```

Keep `selectedQuestionIds` as the single source of truth for save logic.

### Step 3 — Save logic: add/remove diffs (fixes a bug)

Problem: on edit, the current code only adds selected questions and never removes deselected ones.

Track initial ids and diff on save:

```tsx
const [initialQuestionIds, setInitialQuestionIds] = useState<string[]>([]);

// In the edit loader after fetching questions
setSelectedQuestionIds(questions.content.map((q: any) => q.id));
setInitialQuestionIds(questions.content.map((q: any) => q.id));

// In handleCreateQuiz for edit
const toAdd = selectedQuestionIds.filter(id => !initialQuestionIds.includes(id));
const toRemove = initialQuestionIds.filter(id => !selectedQuestionIds.includes(id));
for (const id of toAdd) await addQuestionToQuiz(resultQuizId, id);
for (const id of toRemove) await removeQuestionFromQuiz(resultQuizId, id);
```

Keep the "add all" behavior for creating a new quiz.

### Step 4 — Split validation: allow draft without questions

Current `isQuizReady` requires questions for both draft and publish. Split it:

```tsx
const isQuizMetaValid = () => {
  const title = quizData.title?.trim() || '';
  const hasTitle = title.length >= 3 && title.length <= 100;
  const hasEstimatedTime = quizData.estimatedTime && quizData.estimatedTime >= 1 && quizData.estimatedTime <= 180;
  const hasTimerDuration = !quizData.timerEnabled || (quizData.timerDuration && quizData.timerDuration >= 1 && quizData.timerDuration <= 180);
  return hasTitle && hasEstimatedTime && hasTimerDuration;
};

const isReadyToPublish = () => isQuizMetaValid() && selectedQuestionIds.length > 0;
```

Buttons
- Draft buttons: `disabled={isSaving || !isQuizMetaValid()}`.
- Publish buttons: `disabled={isSaving || !isReadyToPublish()}`.

Also update validation messages so the Questions requirement only appears when publishing.

### Step 5 — Reuse QuestionForm in a modal

Implement the edit loader and success callbacks to avoid navigating away from the Quiz form.

In `src/components/question/QuestionForm.tsx`
- Load on edit:

```tsx
import { getQuestionById } from '../../api/question.service';

const loadQuestionData = async () => {
  if (!questionId) return;
  setLoading(true);
  setError(null);
  try {
    const q = await getQuestionById(questionId);
    setFormData({
      type: q.type,
      questionText: q.questionText,
      content: q.content,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
      tagIds: q.tagIds || []
    });
  } catch (e: any) {
    setError(e?.message || 'Failed to load question');
  } finally {
    setLoading(false);
  }
};
```

- On create/update: if an `onSuccess` prop is provided, do not navigate; instead pass back the created id when available:

```tsx
interface QuestionFormProps { onSuccess?: (res?: { questionId?: string }) => void; }

if (questionId) {
  await updateQuestion(questionId, formData);
  onSuccess?.();
} else {
  const res = await createQuestion(formData); // { questionId }
  onSuccess?.({ questionId: res.questionId });
}
```

Optional UI polish
- Add `compact?: boolean` to hide big headers when embedded in a modal. Implemented.
- Pre-fill difficulty from the quiz via a prop if provided. Implemented.
- Include type-specific editors and Hint field for parity. Implemented.
- Add "Save & Add Another" for faster authoring. Implemented.

### Step 6 — Route "Questions" to the tab inside QuizForm

1) From QuizDetail, navigate to the edit route with a tab query:

```ts
// src/pages/QuizDetailPage.tsx
navigate(`/quizzes/${quizId}/edit?tab=questions`);
```

2) In `QuizFormPage`, read `tab` query param and pass down:

```tsx
import { useSearchParams } from 'react-router-dom';

const [params] = useSearchParams();
const defaultTab = (params.get('tab') as 'management' | 'questions' | 'preview') ?? undefined;

<QuizForm defaultTab={defaultTab} />
```

3) In `QuizForm`, accept `defaultTab?: 'management' | 'questions' | 'preview'` and initialize state:

```tsx
const [activeTab, setActiveTab] = useState<'management' | 'questions' | 'preview'>(defaultTab || 'management');
```

4) Optionally keep URL/tab in sync on tab switch (non-blocking enhancement).

### Step 7 — Deprecate the separate "Quiz Questions" page

Option A (implemented): Redirect the old route to the new tabbed form.

```tsx
// src/routes/AppRoutes.tsx
<Route path="/quizzes/:quizId/questions" element={<Navigate to="/quizzes/:quizId/edit?tab=questions" replace />} />
```

Option B: If you must keep the page, refactor it to render `QuizQuestionInline` so the UX stays consistent.

### Step 8 — Optional: Attach Existing behind a button

In `QuizQuestionInline`, provide a secondary button to open a small selector modal that calls `getAllQuestions({ pageNumber, size, ...filters })` to attach existing questions. Keep the default view quiz-only.

## Logic Flaws To Repair

1) Edit flow doesn’t remove deselected questions.
- Fix via initial/selected diff and call both add and remove (Step 3).

2) Draft blocked by missing questions.
- Split validation so draft creation works without questions; require ≥1 only for publish (Step 4).

3) `QuizQuestionPage.tsx` loads questions twice and destructures incorrectly.
- Remove duplicate call and handle 404 once if this page remains.

4) `QuestionForm` edit loader TODO.
- Implement `getQuestionById` and prefill form (Step 5).

5) Navigation consistency.
- When embedded in a modal, avoid route changes on save by using `onSuccess` (Step 5).

## Small UI/UX Tweaks

List rows
- Show type and difficulty badges (same styles as `QuizQuestionPage.tsx`).
- `QuestionRenderer` in read-only mode for a compact preview.

Modal form
- Provide "Save & Add Another" to speed up bulk authoring.
- Pre-fill difficulty from quiz when available.

Empty state
- Friendly message with an "Add Question" CTA when the list is empty.

Inline feedback
- Toasts or small success banners on add/edit/remove.

## File Touch-Points

| File | Line | Change |
|------|------|--------|
| `src/components/quiz/QuizForm.tsx` | multiple | Replace bank manager with `QuizQuestionInline`; add add/remove diffing; split validation; initialize `activeTab` from `defaultTab`; success toasts |
| `src/pages/QuizFormPage.tsx` | top | Read `tab` query param and pass `defaultTab` to `QuizForm` |
| `src/pages/QuizDetailPage.tsx` | handler | Navigate to `.../edit?tab=questions` for Manage Questions |
| `src/routes/AppRoutes.tsx` | route | Redirect `/quizzes/:quizId/questions` to `.../edit?tab=questions` |
| `src/components/question/QuestionForm.tsx` | multiple | Implement `getQuestionById`; add compact/defaultDifficulty; add type-specific editors + Hint; add Save & Add Another; use stable callbacks; stopPropagation in submit; fallback navigate to Questions tab |
| New: `src/components/quiz/QuizQuestionInline.tsx` | - | Inline questions manager with modal (add/edit/remove) |
| `src/components/quiz/index.ts` | - | Export `QuizQuestionInline` |
| `src/api/question.service.ts` | - | Export `getQuestionById` for edit loader |
| `src/components/ui/Toast.tsx` | - | New Toast provider and hook |
| `src/components/ui/index.ts` | - | Export `ToastProvider` and `useToast` |
| `src/main.tsx` | - | Wrap app with `ToastProvider` |
| `src/components/quiz/QuizQuestionInline.tsx` | actions | Ensure inline action buttons use `type="button"` to avoid parent submit |

## Acceptance Checklist

Questions tab in QuizForm
- [x] Shows only this quiz’s questions.
- [x] Add opens the same form; on save, list updates.
- [x] Edit opens prefilled; on save, list updates.
- [x] Remove disassociates from quiz (or staged list when creating).
- [x] Publishing requires ≥1 question; drafts don’t.
- [x] From QuizDetail, Questions button lands on the same form with tab active.
- [x] No navigation away when adding/editing via modal.
- [x] Diff logic removes deselected items on edit.
- [x] Editor callbacks stable; no infinite update loops.
- [x] Toast feedback on add/edit/remove/save.
- [ ] Attach Existing flow (optional) available behind a button.
