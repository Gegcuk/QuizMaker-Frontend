# QuizMaker Frontend — React Code Review

Date: 2025-11-13

This review focuses on React best practices, API contract alignment, code smells, performance, accessibility, and DX across the `quizmaker-frontend` app.

## Executive Summary

- Document preview + page selection flows are well structured and now send only selected content/indices to the backend, aligned with OpenAPI.
- Several quality issues remain: type looseness, inconsistent validations, unsafe HTML rendering without sanitization, and performance considerations for large documents.
- ESLint reports multiple warnings/errors indicating unused variables/imports and `any` usage; addressing them will notably improve hygiene.

## Strengths

- Clear separation of concerns between upload, preview, selection, and generation steps.
- API usage centralized via services with shared axios configuration (`quizmaker-frontend/src/api/axiosInstance.ts`).
- OpenAPI alignment verified for document upload and quiz generation requests.
- Good user feedback (toasts, progress, and states) in critical flows.

## API Contract Alignment

- Corrected `GenerateQuizFromDocumentRequest` to use `questionsPerType` and support `chunkIndices` and optional fields (`quizmaker-frontend/src/features/quiz/types/quiz.types.ts:113`).
- Page-selection flow now posts typed JSON to `generate-from-document` instead of FormData upload (`quizmaker-frontend/src/features/quiz/components/DocumentQuizConfigurationFormWithPageSelector.tsx:152`).
- Upload params (`chunkingStrategy`, `maxChunkSize`) are sent as query parameters, not multipart fields, per spec (`quizmaker-frontend/src/features/document/services/document.service.ts:34`).

## Type Safety

- Use `Record<QuizQuestionType, number>` instead of `Record<string, number>` for `questionsPerType` in local component state where practical. Current conversion to typed map happens only at submit time (safe but weaker during editing) (`quizmaker-frontend/src/features/quiz/components/DocumentQuizConfigurationFormWithPageSelector.tsx:152`).
- Reduce `any` usage in axios interceptors and services (numerous ESLint flags):
  - `quizmaker-frontend/src/api/axiosInstance.ts:97,126,128,256,258,299,329,333,352`
  - `quizmaker-frontend/src/api/base.service.ts:160,166,176,177,191`

## React Patterns & State Management

- Effects: File-driven effects look correct (`FastDocumentPreviewModal` loads on `[file]`). Consider adding cleanups for created object URLs and canvases (`quizmaker-frontend/src/features/document/components/FastDocumentPreviewModal.tsx:110`).
- Derived data: Filtering and memoization could be `useMemo` when lists get large (e.g., `filteredPages`/`filteredChunks`) to prevent unnecessary recomputes in big documents.
- Form data assembly: Good practice of filtering out question types with zero count before sending (`Document*Configuration*` components).

## Performance & Memory

- PDF rendering currently done on main thread; consider enabling pdf.js worker for smoother UX (set `pdfjsLib.GlobalWorkerOptions.workerSrc`).
- Image previews use `toDataURL` (base64) for canvas; this is memory heavy. Prefer blob URLs via `canvas.toBlob()` + `URL.createObjectURL` where possible, and `URL.revokeObjectURL` on cleanup (`quizmaker-frontend/src/features/document/components/FastDocumentPreviewModal.tsx:72`).
- Virtualize large page/chunk lists (e.g., `react-window`) to keep DOM light when documents have 100+ pages (`DocumentPageSelector` grid/list render).

## Accessibility

- Several icon-only buttons could use `aria-label` for better screen reader support (zoom controls, selection toggles) (`quizmaker-frontend/src/features/document/components/FastDocumentPreviewModal.tsx:158`).
- Ensure focus management when opening modals (e.g., focus first actionable element, trap/tab within modal).

## Security

- `dangerouslySetInnerHTML` renders DOCX-to-HTML without sanitization. Sanitize HTML before injecting (DOMPurify or similar) (`quizmaker-frontend/src/features/document/components/FastDocumentPreviewModal.tsx:424`).
- Avoid trusting `mammoth` output directly for untrusted files; sanitization should be mandatory in a public-facing app.

## Consistency & UX

- Unify file size limits and supported MIME types across components:
  - `DocumentPageSelector` allows up to 150MB (`quizmaker-frontend/src/features/document/components/DocumentPageSelector.tsx:43`).
  - `DocumentUpload` uses 130MB (`quizmaker-frontend/src/features/document/components/DocumentUpload.tsx:72`).
  - Align to config from backend (`getDocumentConfig`) and display it consistently.
- Use standard multiplication symbol or plain `x` consistently; we fixed an encoding artifact but it may appear elsewhere (`quizmaker-frontend/src/features/quiz/components/DocumentQuizConfigurationFormWithPageSelector.tsx:324`).

## Code Hygiene (ESLint findings & smells)

- Unused imports/vars across layout components:
  - `quizmaker-frontend/src/components/layout/Breadcrumb.tsx:157` (`isLast`), and missing dependency in `useMemo` (`:128`).
  - `quizmaker-frontend/src/components/layout/Footer.tsx:22` (`TwitterIcon`).
  - `quizmaker-frontend/src/components/layout/Navbar.tsx:12,22,30,46` (unused vars).
  - `quizmaker-frontend/src/components/layout/Sidebar.tsx` many unused icons and props.
- Base service and axios instance have generic `any` and unused types (`AxiosResponse`, `ApiResponse`), suggesting cleanup and stronger typing (`quizmaker-frontend/src/api/base.service.ts:1,3,117`).
- Remove dead/duplicate components. We removed `DocumentPreviewModal` and its exports to avoid confusion; consider reviewing `DocumentPageSelectorModal` and `RawDocumentPageSelector` for redundancy.

## Library Loading Strategy

- `pdfjsLib` and `mammoth` are accessed via `window`. Prefer dependency-managed imports (dynamic/lazy import) instead of global scripts to improve reliability and typing (`quizmaker-frontend/src/features/document/components/FastDocumentPreviewModal.tsx:46,107,206`).

## Networking & Error Handling

- Axios interceptors: Ensure refresh logic is robust for concurrent 401s (code suggests batching). Add typed error envelopes where possible and remove console logs with control characters.
- User-facing errors are surfaced with toasts—good. Consider mapping specific HTTP statuses to user-friendly messages consistently in services.

## Testing & Tooling

- Add unit tests for request building and chunk index selection logic.
- Consider an integration test (e.g., Cypress/Playwright) for the page selection flow to ensure only selected pages are sent.
- Pre-commit hooks with `lint-staged` to catch unused imports/vars early.

## Actionable Checklist

1. Sanitize HTML before `dangerouslySetInnerHTML` (DOMPurify) — high priority.
2. Enable pdf.js worker and prefer blob URLs over base64 for previews — perf win.
3. Tighten types: replace `Record<string, number>` with `Record<QuizQuestionType, number>` where feasible.
4. Fix ESLint issues (unused vars/imports and `any`), especially in axios/base service and layout components.
5. Unify file size/type validation using backend config; surface consistent UX copy.
6. Clean up object URLs (revoke on unmount) and consider list virtualization for large docs.
7. Replace global `window` library access with dynamic imports for `pdfjs-dist` and `mammoth`.
8. Review and remove any remaining redundant components.

## Notable File References

- `quizmaker-frontend/src/features/quiz/types/quiz.types.ts:113` — Corrected generation request shape.
- `quizmaker-frontend/src/features/quiz/components/DocumentQuizConfigurationFormWithPageSelector.tsx:152` — JSON body with `chunkIndices` and filtered `questionsPerType`.
- `quizmaker-frontend/src/pages/QuizFromSelectedPagesPage.tsx:12` — Type guard and correct service call to `generateQuizFromDocument`.
- `quizmaker-frontend/src/features/document/services/document.service.ts:34` — Upload params moved to query.
- `quizmaker-frontend/src/features/document/components/FastDocumentPreviewModal.tsx:424` — HTML injection point requiring sanitization.

---

If you’d like, I can follow up by:

- Implementing DOM sanitization and pdf.js worker setup.
- Converting preview canvases to blob URLs with cleanup.
- Tightening types in quiz configuration components and axios services.
- Fixing the lint errors incrementally with a PR.

