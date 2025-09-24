# QuizMaker Frontend Contributor Guide

This document captures the conventions and guardrails that keep the QuizMaker frontend consistent. It applies to the entire repository unless a nested `AGENTS.md` overrides it.

## Architecture Principles
- **Feature-first organization**: Place domain-specific code under `src/features/<feature-name>` with the following optional buckets when relevant: `components/`, `hooks/`, `services/`, `types/`, `utils/`, and `index.ts` for curated exports.
- **Cross-cutting layers**: Shared UI goes in `src/components`, global hooks/utilities in `src/hooks` and `src/utils`, API plumbing in `src/api`, and app-level state in `src/context` or `src/providers`.
- **Re-export hubs**: Each feature should expose a single `index.ts` that re-exports public APIs. If a component/hook is meant for external consumption, surface it through that index (and for global UI through `src/components/index.ts`).
- **Routing**: Keep route definitions consolidated in `src/routes/AppRoutes.tsx`. New routes should point to feature entry components rather than duplicating logic.
- **Service separation**: Place network calls and side effects in feature-level `services/` files that use the shared `axiosInstance` from `src/api`. Keep React components lean by delegating data fetching to hooks that wrap TanStack Query or service helpers.

## Styling & Theming
- **Tailwind + CSS variables**: Use Tailwind utility classes backed by the theme system. Prefer semantic theme classes (`theme-bg-*`, `theme-text-*`, `theme-border-*`, etc.) over hard-coded color tokens. Review `THEME_SYSTEM.md` before touching theme logic.
- **Dark mode compatibility**: When custom CSS is unavoidable, scope it with theme variables or Tailwind `dark:` variants so all color schemes stay legible.
- **Component APIs**: Extend existing primitives in `src/components/ui` before introducing new styling patterns. Reuse tokens (spacing, radii, shadows) already defined in the design system.
- **No inline magic numbers**: Promote reusable spacing and sizing decisions into Tailwind classes or extracted constants.

## TypeScript & React Guidelines
- **Strict typing**: Avoid `any`. Define or reuse domain models under `src/types` or `src/features/<feature>/types` and keep type-only imports explicit.
- **Functional components**: Implement components as typed functions (`const Component: React.FC<Props> = ...`). Hooks belong in `hooks/` directories and must follow the `useSomething` naming convention.
- **State management**: Prefer TanStack Query for server state, React Context for cross-cutting client state (see `ThemeContext`), and local `useState` for isolated UI state. Avoid prop drilling when a feature-level context suffices.
- **Side effects**: Encapsulate effects (data fetching, subscriptions) inside hooks to keep presentation components declarative.

## File & Module Conventions
- **Paths & aliases**: Use the configured path aliases (`@/features/...`, `@/components/...`, etc.) instead of relative paths that traverse outside a feature.
- **Documentation**: When adding new architectural concepts or sizeable systems, include a `.md` explainer beside the implementation (mirroring `quiz_controller.md`, `admin_controller.md`, `THEME_SYSTEM.md`). Update existing docs if behavior changes.
- **Project tree**: Update `src/project-tree.txt` if the high-level structure of a feature or shared layer changes noticeably.
- **Testing utilities**: Co-locate reusable test helpers under the relevant feature or a `__tests__/` folder, following the feature-first mindset.

## API & Data Practices
- **HTTP clients**: Go through `axiosInstance` for all HTTP traffic so interceptors and configuration stay centralized.
- **Error handling**: Surface user-facing errors with shared UI components (`Alert`, `Toast`, etc.) and let hooks throw for boundary components when appropriate.
- **DTO transformation**: Normalize API responses in service helpers before exposing data to components. Keep parsing logic isolated for reuse.

## Tooling & Quality Gates
- **Formatting**: Follow the existing code style (TypeScript + Tailwind). Use editor tooling to keep imports ordered and JSX formatted; do not disable ESLint without a compelling reason.
- **Linting**: Run `npm run lint` before committing. Fix or justify warnings—do not ignore them silently.
- **Commit hygiene**: Keep commits scoped and descriptive. Include only files relevant to the change and ensure the working tree is clean.

## Collaboration Tips
- **Accessibility first**: Ensure new UI components support keyboard interaction and have accessible labels/roles.
- **Resilience**: Design components to handle loading, empty, and error states, leveraging shared skeletons or spinners where available.
- **Extensibility**: When introducing new configuration, expose sensible defaults and document extension points so future contributors can build on your work.

Following these guidelines keeps the QuizMaker frontend maintainable and predictable for both humans and LLM collaborators.