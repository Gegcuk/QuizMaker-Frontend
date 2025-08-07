## UX Improvements – Implementation Plan

### Scope and goals
- **Improve navigation clarity**: integrate `Sidebar`, consistent breadcrumbs, active states, focus management.
- **Strengthen feedback**: global toasts, clear loading skeletons, robust error/empty states.
- **Upgrade attempt flow**: stepper, keyboard shortcuts, unanswered confirmation, timer polish, flag for review.
- **Harden forms**: accessible inputs, schema validation, error summary and focus.
- **Consistency and a11y**: unify headers, skip-to-content, modal a11y, dark mode.

### Phasing overview (recommended order)
1) Foundations (inputs, buttons, toasts)  2) Navigation  3) Loading/error/empty  4) Attempt flow  5) Forms  6) Consistency cleanup  7) A11y  8) Lists performance  9) Personalization  10) Search/filters polish

---

## 1) Foundations

### 1.1 Accessible input ids + ARIA
- Files:
  - `src/components/ui/Input.tsx`
- Steps:
  1. Use `useId()` for stable `id` instead of random id.
  2. When `error`, add `aria-invalid="true"` and `aria-describedby="${inputId}-error"`.
  3. Give the error paragraph an `id="${inputId}-error"`.
- Acceptance:
  - Labels always associate with inputs; screen readers announce error text when present.

### 1.2 Button component standardization
- Files:
  - `src/components/ui/Button.tsx` (extend)
- Steps:
  1. Ensure variants: `primary | secondary | danger | ghost`; sizes: `sm | md | lg`.
  2. Add `loading` prop with spinner and `aria-busy`.
  3. Replace ad-hoc buttons on high-traffic pages incrementally (login/register, quiz attempt actions).
- Acceptance:
  - All key actions visually consistent; `loading` disables and shows spinner.

### 1.3 Toast notifications (global feedback)
- Files (new + wiring):
  - `src/components/ui/Toast.tsx` (simple portal + queue)
  - `src/hooks/useToast.ts` (expose `toast.success/error/info`)
  - Wire into: `src/context/AuthContext.tsx`, forms, uploads
- Steps:
  1. Implement a small toast system (or optionally use `sonner` or `react-hot-toast`).
  2. Show success/error for login/register/logout, quiz create/update, answer submit fallback, document upload.
- Acceptance:
  - All critical async flows surface success/error via non-blocking toasts.

---

## 2) Navigation and IA

### 2.1 Integrate `Sidebar` into `Layout`
- Files:
  - `src/components/layout/Layout.tsx`
  - `src/components/layout/Sidebar.tsx`
- Steps:
  1. Render `Sidebar` alongside `Navbar` with responsive toggle (already built-in props).
  2. Wrap page content in a container that accounts for sidebar width on desktop.
  3. Ensure mobile overlay works; close sidebar on route change.
- Acceptance:
  - Consistent left navigation; mobile behaves with slide-in overlay.

### 2.2 Active state in `Navbar`
- Files:
  - `src/components/layout/Navbar.tsx`
- Steps:
  1. Use `useLocation()` to add active link styles.
  2. Convert user menu into avatar dropdown (optional if time).
- Acceptance:
  - Current route highlighted in top nav; no confusion on location.

### 2.3 Breadcrumbs
- Files:
  - `src/components/layout/Breadcrumb.tsx`
  - `src/components/layout/Layout.tsx` or top of each `pages/*`
- Steps:
  1. Render breadcrumbs for deep routes: quiz detail, attempt, documents, questions.
  2. Ensure last crumb is current page and not a link.
- Acceptance:
  - Users can orient and navigate up quickly.

---

## 3) Loading, empty, and error states

### 3.1 Route-level skeletons
- Files (new):
  - `src/components/ui/Skeleton.tsx`
  - Page-specific: `QuizDetailPage`, `QuizAttemptFlowPage`, `QuestionManagementPage`, documents pages
- Steps:
  1. Build generic skeleton blocks (text line, avatar, card, list item).
  2. Replace `<Spinner />` on initial loads with skeletons matching layout.
- Acceptance:
  - Perceived performance improved; fewer “blank” waits.

### 3.2 Error banners and retry
- Files:
  - Affected pages under `src/pages/*` that fetch
- Steps:
  1. Standardize an inline error banner with a clear message, a `Retry` button, and optional support link.
  2. Ensure network errors are human-readable (map API error type → message via `types/common.types.ts`).
- Acceptance:
  - All data loads have consistent failure UI and retry.

### 3.3 Empty states
- Files (new):
  - `src/components/ui/EmptyState.tsx`
  - Used in list pages (quizzes, questions, documents)
- Steps:
  1. Provide title, description, and CTA (e.g., “Create Quiz”).
  2. Replace bare “No data” text with `EmptyState`.
- Acceptance:
  - Empty screens guide users on next steps.

---

## 4) Attempt flow enhancements

### 4.1 Visual stepper (Continuation → Start → Attempt)
- Files:
  - `src/pages/QuizAttemptFlowPage.tsx`
  - `src/components/ui/Stepper.tsx` (new)
- Steps:
  1. Add a top stepper that reflects `currentStep`.
  2. Style with Tailwind; indicate progress and current step.
- Acceptance:
  - Users understand where they are in the flow.

### 4.2 Keyboard shortcuts
- Files:
  - `src/pages/QuizAttemptPage.tsx`
  - `src/components/attempt/AttemptNavigation.tsx` (only for visual hints)
- Steps:
  1. Bind `ArrowLeft/Right` for prev/next when not typing in inputs.
  2. Bind number keys 1–9 to jump; `Enter` to submit when valid; `F` to flag.
  3. Add `useEffect` with keydown listeners; clean up on unmount.
- Acceptance:
  - Keyboard hints work; no interference while typing answers.

### 4.3 Unanswered questions confirmation
- Files:
  - `src/pages/QuizAttemptPage.tsx`
  - `src/components/common/ConfirmationModal.tsx` (reuse)
- Steps:
  1. Before final submit, compute unanswered indexes.
  2. Show modal listing unanswered with jump links.
  3. Allow proceed anyway or go to first unanswered.
- Acceptance:
  - Reduces accidental submission with missing answers.

### 4.4 Sticky timer + ARIA announcements
- Files:
  - `src/components/attempt/AttemptTimer.tsx`
  - `src/pages/QuizAttemptPage.tsx`
- Steps:
  1. Wrap timer in a sticky container at top on timed modes.
  2. Add `aria-live="polite"` and announce warnings; optional subtle sound/vibrate.
- Acceptance:
  - Timer remains visible; warnings accessible.

### 4.5 Flag for review
- Files:
  - `src/pages/QuizAttemptPage.tsx` (state + filter)
  - `src/components/attempt/AttemptNavigation.tsx` (badge style for flagged)
- Steps:
  1. Maintain `flaggedQuestionIndexes: number[]`.
  2. Toggle flag per question; filter to review flagged before submit.
  3. Style flagged number chips distinctly (e.g., amber).
- Acceptance:
  - Users can mark and revisit questions easily.

---

## 5) Forms and validation

### 5.1 Schema-based validation
- Files:
  - `src/components/ui/Form.tsx`
  - Add schemas per form (e.g., `src/components/auth/LoginForm.tsx`), using `zod` (recommended)
- Steps:
  1. Add optional `resolver` prop to `Form` that receives values and returns errors map.
  2. In forms, define `zod` schemas and pass as resolver.
  3. Validate on submit and on blur; set field errors via `setError`.
- Acceptance:
  - Consistent validation messages; invalid fields blocked gracefully.

### 5.2 Error summary + focus management
- Files:
  - `src/components/ui/Form.tsx`
- Steps:
  1. On submit failure, focus first invalid input (track refs in `register`).
  2. Ensure the error summary container has `role="alert" aria-live="assertive"`.
- Acceptance:
  - Keyboard/screen reader users immediately land on first problem.

---

## 6) Consistency and cleanup

### 6.1 Unify page headers and breadcrumbs
- Files:
  - Choose one: `src/components/layout/PageHeader.tsx` OR `src/components/ui/PageHeader.tsx`
  - Replace usages across pages.
- Steps:
  1. Merge features (title, actions, description) into the chosen component.
  2. Remove duplicates to avoid divergence.
- Acceptance:
  - Single source of truth for page headers used consistently.

### 6.2 Cards and spacing
- Files:
  - `src/components/ui/Card.tsx`, page containers
- Steps:
  1. Normalize container widths (`max-w-7xl` outer, `max-w-4xl` content) and vertical rhythm (`space-y-6`).
  2. Use `Card` for information blocks for visual consistency.
- Acceptance:
  - Uniform layout structure across pages.

---

## 7) Accessibility upgrades

### 7.1 Focus on route change + skip link
- Files:
  - `src/components/layout/Layout.tsx`
  - `src/components/layout/PageContainer.tsx`
- Steps:
  1. Add a visually hidden "Skip to content" link at top.
  2. Give the main `<main>` a `tabIndex={-1}` and programmatically focus on route change.
- Acceptance:
  - Keyboard users can jump to content; focus moves to page heading on navigation.

### 7.2 Modal a11y
- Files:
  - `src/components/common/ConfirmationModal.tsx`
- Steps:
  1. Ensure focus trap, `aria-modal="true"`, labelled by the title, and restore focus to trigger on close.
- Acceptance:
  - Modal fully accessible via keyboard and SR.

### 7.3 Spinner semantics
- Files:
  - `src/components/ui/Spinner.tsx` usages
- Steps:
  1. Wrap large loading regions with `aria-busy="true"` and a visually-hidden text describing the load.
- Acceptance:
  - Loading states accessible.

---

## 8) Lists performance and media

### 8.1 Virtualize heavy lists
- Files:
  - List pages (questions, documents)
- Steps:
  1. Integrate `react-window` or `react-virtualized` for long lists.
  2. Keep item heights consistent or use dynamic measuring.
- Acceptance:
  - Smooth scrolling on large datasets.

### 8.2 Image lazy loading and placeholders
- Files:
  - `src/components/attempt/AnswerForm.tsx` (attachments), previews
- Steps:
  1. Add `loading="lazy"` and a fixed aspect ratio container.
  2. Optional blur-up placeholder.
- Acceptance:
  - Faster initial render; stable layout while images load.

---

## 9) Personalization

### 9.1 Dark mode
- Files:
  - `tailwind.config.js` (set `darkMode: 'class'`)
  - Theme toggle in `Navbar`
- Steps:
  1. Add toggle switching `document.documentElement.classList`.
  2. Persist preference in local storage.
- Acceptance:
  - Users can switch themes; selection persists.

---

## 10) Search and filters

### 10.1 Quiz list filters + URL params
- Files:
  - `src/components/quiz/QuizFilters.tsx`, `src/hooks/useQuizFiltering.ts`
- Steps:
  1. Add chips for active filters and "Clear all".
  2. Sync filters to query params; prefetch on hover for details page.
- Acceptance:
  - Filters persist across navigation and refresh; quick back-and-forth is snappy.

---

## Optional dependencies (install if choosing libs)
- Toasts: `npm i sonner` or `npm i react-hot-toast`
- Validation: `npm i zod`
- Virtualization: `npm i react-window`

---

## Risks and mitigations
- Scope creep → keep to phased delivery; ship after each phase is green.
- A11y regressions → add manual keyboard and screen reader checks to QA.
- Visual drift → centralize primitives (Button, Card, PageHeader) before widescale changes.

---

## QA checklist (per feature)
- Keyboard-only navigation works; focus order makes sense.
- Screen reader announces page title on route change.
- Loading, error, and empty states reachable and look consistent.
- Forms: invalid inputs show error, summary focuses first invalid.
- Attempt flow: stepper reflects state; shortcuts don’t interfere with typing; unanswered modal lists correct items.

---

## Milestones and rough estimates
- Phase 1 Foundations: 0.5–1 day
- Phase 2 Navigation: 0.5–1 day
- Phase 3 Loading/Empty/Error: 0.5–1 day
- Phase 4 Attempt flow: 1–2 days
- Phase 5 Forms/Validation: 0.5–1 day
- Phase 6 Consistency/A11y/Perf/Dark: 1–2 days (optional depth)

---

## Concrete edit map (first passes)
- Inputs: `src/components/ui/Input.tsx` (useId + aria)
- Buttons: `src/components/ui/Button.tsx` (variants + loading)
- Toasts: `src/components/ui/Toast.tsx`, `src/hooks/useToast.ts`, use in `src/context/AuthContext.tsx`
- Layout: integrate `src/components/layout/Sidebar.tsx` in `src/components/layout/Layout.tsx`; add breadcrumbs
- Skeletons: `src/components/ui/Skeleton.tsx`; use in `src/pages/QuizDetailPage.tsx`, `src/pages/QuizAttemptFlowPage.tsx`, `src/pages/QuestionManagementPage.tsx`
- Attempt: keyboard + unanswered modal + sticky timer in `src/pages/QuizAttemptPage.tsx`; minor styles in `src/components/attempt/AttemptNavigation.tsx`, `src/components/attempt/AttemptTimer.tsx`
- Forms: `src/components/ui/Form.tsx` add resolver + focus first error
- A11y: skip link + focus on main in `src/components/layout/Layout.tsx` and/or `PageContainer.tsx`


