# QuizMaker Frontend Agent Instructions

These instructions apply to the whole repository. They are intentionally specific to this frontend project and override generic habits when they conflict.

## Git Safety

- Never work directly on `main`.
- Before changing source, config, workflows, or docs, check the current branch with `git branch --show-current`.
- Use a dedicated branch for each task, preferably `codex/<short-topic>`.
- When branching from the remote mainline, avoid tracking `origin/main`:

  ```bash
  git switch --no-track -c codex/<short-topic> origin/main
  ```

- Do not push branches unless the user explicitly asks for a push.
- Do not open pull requests unless the user explicitly asks. The repository owner opens PRs manually.
- Do not merge to `main`, force-push `main`, or rewrite shared history unless the user explicitly asks and the exact risk has been stated.
- A local commit is acceptable only when requested or when completing an implementation task that the user asked to commit.

## Project Layout

- The Vite app lives in `quizmaker-frontend`.
- Run npm commands from `quizmaker-frontend`, not the repository root.
- Shared UI components live under `src/components/ui`.
- Shared layout and app-shell components live under `src/components/layout`.
- Feature code lives under `src/features/<feature>`.
- Page-level route components live under `src/pages`.
- API calls should stay in feature service and endpoint files, not inside presentation components unless the surrounding code already does that.

## Frontend Style

- Prefer existing shared components before adding new controls.
- Use theme tokens and Tailwind utility classes already present in the app.
- Do not hardcode colors in components. Add or reuse theme variables in `src/context/ColorPalettes.ts`, `src/index.css`, and `tailwind.config.js` when new semantic colors are needed.
- Match local component patterns for loading, empty, error, disabled, and feedback states.
- Keep edits scoped to the requested behavior. Avoid unrelated formatting churn.

## Backend And API Contracts

- Verify backend contracts before changing request or response shapes.
- Use Swagger/OpenAPI for live schemas when available, especially question schemas.
- Existing API documentation starts in `quizmaker-frontend/docs/api/ai_api_guide.md`.
- Frontend-to-backend implementation workflow is documented in `quizmaker-frontend/docs/api/frontend_backend_workflow_for_ai.md`.
- Keep frontend DTO/type changes aligned with backend payloads.
- For generated questions, treat `safeContent` as schema-driven content. Do not infer validation rules from UI behavior alone.
- Answer submission payloads must remain compatible with backend attempt endpoints.
- When backend validation fails, check the schema or backend error text before changing frontend assumptions.

## Verification

For source or workflow changes, run the relevant local checks:

```bash
cd quizmaker-frontend
npm run lint -- --quiet
npm run build
```

For docs-only changes, `git diff --check` is usually enough.

Current lint policy allows legacy `any`, unused-symbol, and hook-dependency warnings to remain visible but non-blocking. New work should still avoid adding those warnings.

## CI/CD

- Pull request validation is defined in `.github/workflows/frontend-pr.yml`.
- Production deployment is defined in `.github/workflows/deploy.yml`.
- Do not add deployment secrets or production-only behavior to PR validation workflows.
- Keep PR workflows safe for fork/PR execution: no SSH deploy steps, no production secrets, no writes to protected branches.
