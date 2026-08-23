# QuizMaker Frontend Agent Instructions

These instructions apply to the whole repository. They complement global agent
instructions and override generic habits when they conflict. They describe the
preferred direction for new work without requiring unrelated legacy cleanup.

## Project Identity

- The application uses React, TypeScript, Vite, React Router, TanStack Query,
  Axios, Tailwind CSS, Vitest, Testing Library, MSW, and Playwright.
- The Vite application lives in `quizmaker-frontend`.
- Run npm commands from `quizmaker-frontend`, not the repository root.
- The codebase is feature-first, but some older shared services and components
  remain. Follow the convention of the feature being changed unless migration
  or refactoring is part of the request.
- Keep each change focused, independently understandable, and reviewable.

## Plain-Language Communication (Required)

Technical accuracy is not enough. Explain work so that a developer who does not
already know this part of the frontend can understand the behavior and the
reasoning.

- Start with the user-visible behavior or development problem, not a list of
  filenames, hooks, or framework terms.
- Explain the cause in ordinary language before introducing technical details.
  Define an uncommon term or acronym the first time it is used.
- For a bug, explain in this order: what the user experiences, why it happens,
  what will change, and why the change prevents the problem.
- For a frontend flow, trace the important path in order: user action, component,
  state or hook, service request, backend response, and rendered result. Omit
  steps that are not relevant.
- Include a realistic before-and-after example when behavior is not obvious.
- State what remains unchanged when scope or compatibility matters.
- Separate verified facts from inference. Use direct wording such as "I verified"
  and "I infer" instead of presenting an assumption as fact.
- Explain meaningful alternatives and tradeoffs when more than one sound design
  exists, then give a recommendation. Do not manufacture alternatives for a
  straightforward fix.
- Avoid jargon-only summaries such as "refactored the state layer". Say what was
  moved, what now owns the state, and what practical problem that solves.
- Progress updates should report what was learned and what is being changed,
  not merely which command is running.
- End completed work with a plain-language summary of the original problem, the
  solution, what a user or operator will experience, verification performed, and
  any remaining risk. Do not provide only a commit hash or file list.

Plain language does not mean hiding useful React or TypeScript concepts. Name the
concept, explain it briefly, and connect it to the concrete behavior in this app.

## Working Method

Before implementation:

1. Verify the current branch and working tree.
2. Read the closest existing component, hook, service, type, and test before
   proposing a new pattern.
3. Trace the current data and interaction flow end to end. Reproduce a reported
   bug when practical.
4. Identify the files that will change, the behavior that will stay unchanged,
   the happy path, and the important loading, empty, error, and retry paths.
5. For substantial work, explain the intended outcome and ordered implementation
   plan in plain language before editing.

During implementation:

- Prefer the repository's existing helpers and patterns over a new abstraction.
- Add an abstraction only when it removes real duplication, models a genuine
  boundary, or makes behavior materially easier to test.
- Keep product policy separate from implementation detail. Ask before changing
  security, permissions, billing, retention, retry policy, public API contracts,
  or another user-visible rule that has more than one valid interpretation.
- Do not stop at snippets when the user explicitly asked for implementation.
- Do not add manual-testing documents or checklist files unless requested. Put
  concise manual verification steps in the final response when they are needed.

## Git Safety

- Never work directly on `main`.
- Before changing source, config, workflows, or docs, check the current branch
  with `git branch --show-current`.
- Before reusing a task branch, fetch remote state and verify that the branch or
  its pull request was not already merged or deleted. Continue a branch when the
  user explicitly asks to continue on that branch.
- Use a dedicated branch for each task, preferably `codex/<short-topic>`.
- When branching from the remote mainline, avoid tracking `origin/main`:

  ```bash
  git switch --no-track -c codex/<short-topic> origin/main
  ```

- Do not push branches unless the user explicitly asks for a push.
- Do not open pull requests unless the user explicitly asks. The repository
  owner opens pull requests manually.
- Do not merge to `main`, force-push `main`, rewrite shared history, publish a
  release, or trigger a deployment.
- A local commit is acceptable when requested or when completing an
  implementation task that the user asked to commit.
- Keep commits focused and exclude unrelated working-tree changes.

## Project Layout And Boundaries

- Shared UI primitives live under `src/components/ui`.
- Shared layout and application-shell components live under
  `src/components/layout`.
- Feature code lives under `src/features/<feature>`.
- Page-level route components live under `src/pages`.
- Route declarations and lazy-route boundaries live under `src/routes`.
- Shared providers live under `src/providers`.
- API calls belong in feature service or endpoint files, not presentation
  components, unless the surrounding feature has an established local pattern.
- API DTOs and feature models belong in explicit type files. Do not let transport
  details spread through unrelated presentation components.
- Pages should compose features and route behavior. Reusable interaction logic
  belongs in a feature component or focused custom hook.
- Keep feature-specific behavior inside its feature. Move code to `components`,
  `hooks`, `services`, or `utils` only when it is genuinely shared.

## Read-First References

Use repository examples before inventing a new convention:

- Shared controls: `src/components/ui/Button.tsx`, `FormField.tsx`, `Checkbox.tsx`,
  `Radio.tsx`, and `Modal.tsx`.
- Application routing and lazy-load recovery: `src/routes/AppRoutes.tsx` and
  `src/routes/LazyRouteBoundary.tsx`.
- Authenticated HTTP behavior: `src/api/axiosInstance.ts`.
- Server-state defaults: `src/providers/QueryProvider.tsx`.
- Test providers and route setup: `src/test/render.tsx`.
- Mocked backend behavior: `src/test/msw/handlers.ts` and `src/test/msw/server.ts`.
- Theme definitions: `src/context/ColorPalettes.ts`, `src/index.css`, and
  `tailwind.config.js`.
- Analytics privacy boundaries: `src/features/analytics/routeAnalytics.ts` and
  `src/features/privacy/SensitiveUrlBoundary.tsx`.

Read the adjacent tests with each example. Copy ownership boundaries, accessible
queries, loading and error behavior, and test setup. Do not copy a component's
appearance or abstraction when the new use case has different semantics.

## React And State

- Keep rendering pure: the same props and state should produce the same UI.
- Store the minimum state needed. Calculate derived values during render instead
  of copying them into state and synchronizing them with an effect.
- Keep state in the nearest common owner that needs it. Do not add global context
  for state used by one page or feature subtree.
- Use an effect only to synchronize React with something outside React, such as a
  browser API, subscription, timer, or imperative third-party library.
- Clean up subscriptions, timers, observers, and event listeners. Guard async
  work against stale responses or use cancellation when a request can outlive the
  screen that started it.
- Do not suppress hook dependency warnings to force an effect to run. Restructure
  the code or stabilize the dependency when needed.
- Prefer functional state updates when the next value depends on the previous
  value.
- Preserve stable identity for list keys. Never use an array index as a key when
  items can be inserted, removed, sorted, or reordered.
- Use refs for mutable values that do not affect rendering, not as hidden state.
- Avoid broad memoization. Use `useMemo` or `useCallback` only when it addresses a
  measured cost, preserves a required identity, or matches an existing API
  contract.
- Handle route-level loading and lazy-import failures through the existing route
  boundaries instead of duplicating ad hoc error screens.

## Server Data And API Calls

- Use TanStack Query for new server-state flows when the feature already follows
  that pattern. Do not migrate unrelated legacy requests as part of a small fix.
- Give query keys stable, serializable values that include every input affecting
  the response.
- Let queries own remote loading, error, stale, and retry state. Do not duplicate
  the same server response into component state without a clear editing need.
- Mutations must expose a pending state, prevent accidental duplicate submission,
  show a useful failure message, and update or invalidate the affected query
  data deliberately.
- Use the shared Axios client so authentication refresh, error normalization, and
  request policy remain consistent. Use a different transport only when the
  protocol requires it and explain why.
- Keep request construction and response mapping in services. Components should
  express user intent rather than know endpoint details.
- Treat network responses as untrusted at the boundary. Model them with explicit
  TypeScript types and validate ambiguous data before use.
- Follow the backend's `ProblemDetail` response semantics. Preserve useful,
  user-safe messages and do not expose stack traces or internal details.

## TypeScript

- Prefer precise domain types, discriminated unions, and literal unions over
  broad strings, untyped objects, or parallel booleans.
- Avoid adding `any`. Use `unknown` at an uncertain boundary and narrow it before
  reading fields.
- Avoid non-null assertions unless an invariant is both unavoidable and obvious.
  Represent optional and loading states in the type instead.
- Keep API request and response types distinct when their fields or lifecycle
  differ. Do not cast one shape into another to bypass a contract mismatch.
- Exhaustively handle closed unions where a missing case would produce incorrect
  UI behavior.
- Export the smallest useful public surface from a module. Do not create generic
  utilities for one call site.

## Forms And User Interaction

- Existing values must be visible and selected when an edit form opens.
- Keep a clear distinction between untouched, invalid, submitting, successful,
  and failed states.
- Validate at the user-input boundary, but treat backend validation as
  authoritative. Map backend field errors to the relevant control when possible.
- Disable only actions that would be unsafe while submitting. Do not make the
  whole form appear unusable without a reason.
- Preserve keyboard behavior, including logical focus order, Enter submission
  where appropriate, Escape dismissal for dialogs, and visible focus states.
- Confirmation dialogs must remain interactive, focus-managed, and usable on
  small screens. Destructive actions need clear names and a cancel path.
- Do not rely on color alone to communicate selection, correctness, status, or
  errors.

## Components, Styling, And Accessibility

- Prefer existing shared components before adding new controls.
- Use theme tokens and Tailwind utility classes already present in the app.
- Do not hardcode colors in components. Add or reuse semantic theme variables in
  `src/context/ColorPalettes.ts`, `src/index.css`, and `tailwind.config.js` when a
  new semantic color is genuinely required.
- Match local patterns for loading, empty, error, disabled, and feedback states.
- Use semantic HTML first. A control must have an accessible name, and form
  labels, descriptions, and errors must be programmatically associated.
- Use real buttons and links for actions and navigation. Do not make a generic
  `div` keyboard-interactive when a native element provides the behavior.
- Preserve focus when content changes and restore it after a modal closes when
  appropriate.
- Check text wrapping, touch targets, overflow, and fixed-width content at mobile
  and desktop sizes. Do not solve layout problems by hiding essential content.
- Respect reduced-motion preferences for non-essential animation.
- Keep edits scoped to the requested behavior. Avoid unrelated styling or
  formatting churn.

## Security And Privacy

- Never place access tokens, secrets, passwords, authorization codes, private
  content, or sensitive identifiers in logs, analytics events, URLs, or error
  messages.
- Do not persist sensitive data in `localStorage` or `sessionStorage` unless the
  existing security design explicitly requires it.
- Analytics must use approved low-cardinality event fields. Do not send raw route
  query strings, fragments, free-form user content, or backend error bodies.
- Treat all rendered HTML as untrusted. Use the existing DOMPurify path before
  `dangerouslySetInnerHTML`; do not add an unsanitized bypass.
- Frontend permission checks improve UX but do not provide authorization. The
  backend remains responsible for enforcing permissions, ownership, visibility,
  and organization boundaries.
- Preserve the shared authentication and refresh flow. Ask before changing token
  handling, OAuth behavior, protected-route policy, or session invalidation.
- External links opened in a new tab must prevent opener access.

## Backend And API Contracts

- Verify backend contracts before changing request or response shapes.
- Treat the live API as the only contract authority. Start with
  `GET https://www.quizzence.com/api/v1/api-summary`, then fetch the relevant live
  group specification at `GET https://www.quizzence.com/v3/api-docs/{group}` or a
  live question schema at
  `GET https://www.quizzence.com/api/v1/questions/schemas/{type}`.
- Local API Markdown files describe discovery and frontend code paths only. Do
  not use them as evidence for field names, limits, safe-content rules,
  submission payloads, or review payloads.
- If the live specification does not answer a contract question, inspect a real
  backend response or validation error. Do not infer the contract from the UI.
  Create a follow-up issue when backend clarification or contract work is needed.
- API discovery instructions start in
  `quizmaker-frontend/docs/api/ai_api_guide.md`.
- The frontend-to-backend workflow is documented in
  `quizmaker-frontend/docs/api/frontend_backend_workflow_for_ai.md`.
- Keep frontend DTO and type changes aligned with backend payloads.
- For generated questions, treat `safeContent` as schema-driven content. Do not
  infer validation rules from UI behavior alone.
- Answer submission payloads must remain compatible with backend attempt
  endpoints.
- When backend validation fails, check the live schema or backend error before
  changing frontend assumptions.
- If work requires both repositories, create linked issues in
  `Gegcuk/QuizMaker` and `Gegcuk/QuizMaker-Frontend`. Put the detailed contract,
  validation, security, and compatibility requirements in the backend issue.

## Errors And Resilience

- Give users a useful recovery path. A generic error boundary is the last resort,
  not a replacement for expected loading and error states.
- Distinguish validation, authentication, authorization, not-found, conflict,
  rate-limit, server, and offline failures when the response supports it.
- Do not retry unsafe mutations automatically unless the operation is known to be
  idempotent.
- Avoid infinite loading states. Every async path should resolve to content, an
  empty state, or an actionable error state.
- Route chunk-load failures, stale deployment assets, and authentication expiry
  must follow the existing centralized recovery behavior.
- Logging should be structured, concise, and free of secrets or personal data.
  Do not leave routine `console.log` debugging in production paths.

## Testing

- Test behavior a user or API consumer can observe, not component implementation
  details.
- Use Vitest and Testing Library for components and hooks. Interact through
  `user-event` and query by role, label, or visible text where practical.
- Use the shared render helpers under `src/test` so providers, routing, and query
  behavior match the application.
- Use MSW or focused service doubles for backend behavior. Automated tests must
  not call production APIs, OAuth providers, billing providers, or other remote
  services.
- Add focused tests for the happy path and the most important loading, empty,
  validation, error, permission, and retry paths in proportion to the change's
  risk.
- For forms, test initial edit values, keyboard interaction, pending submission,
  backend validation, successful submission, and recovery from failure when
  applicable.
- Keep tests deterministic and order-independent. Avoid arbitrary sleeps, real
  clocks, and assertions that race rendering or network state.
- Prefer a focused test first, then broaden to the affected feature and required
  repository quality gates.
- For user-facing layout or routing changes, run the relevant browser test and
  inspect desktop and mobile rendering when practical.
- A test that passes only after a rerun is failing. Find and remove the race or
  shared state instead of adding retries that conceal it.

## Verification

For source or workflow changes, run the relevant local checks from the app
directory:

```bash
cd quizmaker-frontend
npm run lint -- --quiet
npm test
npm run build
```

Run additional checks when the change affects their behavior:

- `npm run test:e2e` for critical user journeys or responsive layout.
- `npm run test:smoke` for production browser startup and basic rendering.
- `npm run test:privacy:production` for analytics or sensitive-data handling.
- `npm run test:seo` and prerender checks for public pages or metadata.
- `npm run test:nginx` for route fallback or static-server behavior.
- `npm run test:deployment-policy` for deployment workflow policy.
- `npm run audit:production` for dependency or release-readiness changes.

For docs-only changes, `git diff --check` is usually enough.

Current lint policy allows legacy `any`, unused-symbol, and hook-dependency
warnings to remain visible but non-blocking. New work should not add those
warnings. Report exactly which checks ran and whether any relevant check could
not be run.

## CI/CD

- Pull request validation is defined in `.github/workflows/frontend-pr.yml`.
- Production deployment is defined in `.github/workflows/deploy.yml`.
- Do not add deployment secrets or production-only behavior to pull request
  validation workflows.
- Keep pull request workflows safe for fork execution: no SSH deployment steps,
  production secrets, or writes to protected branches.
- Required checks must pass before deployment. Deployment health checks must
  validate the version that was actually deployed.
- Do not close an implementation issue until its change is merged and verified in
  production. A local commit or passing pull request checks is not deployment.

## Issue Discipline

- Verify that an issue still describes the current code and behavior before
  implementing it. Check for merged fixes, duplicate issues, and dependencies.
- Record a clear acceptance outcome, not only a list of files or layers to edit.
- Keep issue work vertical: implementation, focused tests, and user-visible error
  handling should normally be reviewable together.
- Update an issue when meaningful portions are completed, but leave it open until
  the deployed behavior has been verified.
- Create a linked follow-up issue for a real out-of-scope problem. Do not hide it
  in a local issue Markdown file or silently expand the current task.

## Hard Noes

- No direct work on `main`, automatic pushes, pull requests, merges, or deploys.
- No API contract assumptions based only on local documentation or UI behavior.
- No hardcoded component colors that bypass the theme.
- No duplicated server state without a documented reason.
- No effects used only to derive renderable state.
- No unsanitized HTML, secrets in browser-visible locations, or sensitive data in
  analytics and logs.
- No inaccessible custom controls when a semantic HTML control exists.
- No broad cleanup refactor hidden inside a feature or bug fix.
- No flaky-test retries used as a substitute for fixing the underlying race.
