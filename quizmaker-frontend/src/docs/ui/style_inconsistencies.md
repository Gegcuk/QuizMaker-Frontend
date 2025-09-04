# UI Style Inconsistencies Audit

This document catalogs current visual/UX inconsistencies across pages and components, grouped by category, with suggested fixes. Use it alongside `src/docs/ui/style_guide.md`.

## Buttons

- Inconsistent use of shared `Button` vs raw Tailwind buttons.
  - Instances (use shared Button with variants/sizes):
    - `src/components/quiz/QuizForm.tsx` — action bars (Create/Publish/Save/Delete).
    - `src/pages/QuizDetailPage.tsx` — header actions (if not all via PageHeader actions).
    - `src/pages/QuizQuestionPage.tsx` — legacy page (redirects now), multiple raw buttons.
    - Question editors — inline small action buttons (add option/item/gap) are raw.
  - Fix: Replace with `Button` (variant: primary/secondary/danger/ghost; size: sm/md). Ensure `type="button"` for non-submit actions inside forms.

## Badges/Chips

- Raw span badges with ad‑hoc colors vs shared `Badge` component.
  - Instances:
    - `src/components/quiz/QuizDetailHeader.tsx` — status/visibility/difficulty chips.
    - `src/pages/QuizQuestionPage.tsx` — type/difficulty badges in lists.
    - Misc list rows elsewhere using raw spans.
  - Fix: Replace spans with `Badge`. Map difficulty to `success|warning|danger` and type to `info` per style guide.

## Lists & Row Actions

- Row hover/click states and icon actions inconsistent.
  - Instances:
    - Older lists use custom padding/colors without `hover:bg-gray-50` or right-aligned icon-only actions.
  - Fix: Standardize list rows to: `p-3 group hover:bg-gray-50 transition-colors`, text `group-hover:text-indigo-700`, icon-only actions using `Button` `variant="ghost" size="sm"`, badges before actions.

## Forms (inputs/selects/textarea)

- Mixed usage of raw Tailwind inputs vs `ui/Input`. Selects/textarea styles vary.
  - Instances:
    - `src/components/quiz/QuizForm.tsx` — multiple raw inputs/selects.
    - `src/components/question/QuestionForm.tsx` — multiple raw inputs/textarea/select.
  - Fix: Use `ui/Input` for text inputs when possible. For `textarea`/`select`, use consistent Tailwind classes per style guide until a shared component is introduced.

## Previews & Question Rendering

- Duplicate previews, inconsistent preview style vs attempt view.
  - Instances:
    - Editors with internal previews (still present):
      - `src/components/question/OrderingEditor.tsx` — Preview section at bottom (needs `showPreview` toggle support).
      - `src/components/question/HotspotEditor.tsx` — Image/preview sections (consider `showPreview`).
    - Legacy page `src/pages/QuizQuestionPage.tsx` renders QuestionRenderer blocks (heavier preview) vs new light list.
  - Fix:
    - Ensure editors accept `showPreview?: boolean` and hide internal previews when used inside `QuestionForm`.
    - In `QuestionForm`, keep single preview using attempt Answer components (already done for most types).

## Modal Sizing

- Inconsistent modal widths for complex forms.
  - Instances:
    - Some modals use `xl` while QuestionForm uses `2xl`.
  - Fix: Use `size="2xl"` for question create/edit; smaller sizes for simple dialogs.

## Tiles & Selectors

- Type selector presentation inconsistent across screens.
  - Instances:
    - Some older pages stack radio lists instead of tile grid.
  - Fix: Use tile grid (`grid grid-cols-1 sm:grid-cols-2`) with button-like tiles per style guide.

## Icon‑only Buttons

- Raw icon buttons with Tailwind; missing `title`/`aria-label`.
  - Instances:
    - `src/pages/QuizQuestionPage.tsx`, editor toolbars.
  - Fix: Use `Button` `variant="ghost" size="sm"`, add `title`.

## Toast vs Alert vs window.alert

- Mixed feedback patterns.
  - Instances:
    - `src/pages/QuizQuestionPage.tsx` uses `alert()` in places.
  - Fix: Use `ToastProvider` for transient messages; `Alert` for inline error blocks.

## Submit Side‑Effects

- Buttons missing `type="button"` submit enclosing forms unintentionally.
  - Instances:
    - Some inline action buttons in forms (fixed in `QuizQuestionInline.tsx`), may appear elsewhere.
  - Fix: Audit all inline actions inside forms and ensure `type="button"` when not submitting.

## Labels & Headings

- Minor inconsistencies in capitalization and spacing (e.g., section headers vs tile labels).
  - Fix: Use `text-lg font-medium text-gray-900` for section headings; consistent sentence case or title case per style guide.

---

# Quick Fix Plan (Prioritized)

1) Badges
   - Replace raw spans with `Badge` in:
     - `src/components/quiz/QuizDetailHeader.tsx`
     - `src/pages/QuizQuestionPage.tsx`

2) Buttons
   - Convert major action bars to `Button`:
     - `src/components/quiz/QuizForm.tsx` (Create/Publish/Save/Delete)
     - `src/pages/QuizQuestionPage.tsx`

3) Editors’ internal previews
   - Add `showPreview` toggle support to:
     - `src/components/question/OrderingEditor.tsx`
     - `src/components/question/HotspotEditor.tsx`
   - Pass `showPreview={false}` from `QuestionForm` for all editors.

4) Form inputs
   - Standardize inputs to `ui/Input` where applicable; align `textarea/select` classes.

5) List/Row pattern
   - Normalize hover/spacing/action patterns across older list pages.

6) Toasts
   - Replace `alert()` usage with `useToast()` feedback.

7) Accessibility
   - Ensure icon-only buttons have `title` and visible focus.

---

# Notes

- Use `src/docs/ui/style_guide.md` for implementation details (variants, sizes, examples).
- When refactoring, limit changes to styling to avoid bundling behavior changes.
- Prefer small, incremental PRs by file/feature area.

