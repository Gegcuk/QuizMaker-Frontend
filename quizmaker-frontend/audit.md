# Frontend Architecture Audit

## App architecture
- The codebase is nominally feature-first, but some top-level pages live under `features/.../components` (for example `QuizListPage`) while routing still imports them via a shared components barrel, which blurs ownership boundaries between page shells, feature modules, and shared primitives and makes it hard to reason about cross-feature coupling.【F:src/features/quiz/components/QuizListPage.tsx†L1-L45】【F:src/components/index.ts†L5-L38】
- Route registration happens in a single monolithic file that eagerly imports every page/feature component, leaving no seams for route-level code splitting or for wiring error/suspense boundaries per segment.【F:src/routes/AppRoutes.tsx†L10-L260】
- The layout stack is shallow (navbar + outlet) and lacks a dedicated app shell for cross-cutting providers such as analytics, theme, or i18n; as a result those concerns would need to be threaded manually when they arrive.【F:src/components/layout/Layout.tsx†L1-L15】【F:src/main.tsx†L1-L21】
- `ProtectedRoute` is implemented as a component rather than a router-level loader/guard, which forces extra React renders during auth resolution and scatters logging noise into the console; consider lifting auth gating into data routers or lazy route wrappers instead.【F:src/components/layout/ProtectedRoute.tsx†L32-L82】

## Data layer design
- `@tanstack/react-query` is installed but never initialised (no `QueryClientProvider` in `main.tsx`), so each page owns ad‑hoc `useEffect` fetches with local `useState` and no shared caching, deduplication, or background refresh.【F:package.json†L13-L25】【F:src/main.tsx†L1-L21】
- Feature screens create service instances inside component bodies and fetch imperatively (`QuizListPage`, `DocumentList`, `QuizAttemptFlowPage`), leading to duplicated loading/error flows, lack of retry semantics, and zero cache invalidation across the app.【F:src/features/quiz/components/QuizListPage.tsx†L24-L107】【F:src/features/document/components/DocumentList.tsx†L48-L130】【F:src/pages/QuizAttemptFlowPage.tsx†L16-L71】
- Client-side filtering/sorting/pagination is derived from the entire result set in memory, which breaks once lists exceed a single page and prevents the backend from performing efficient queries or returning authoritative totals.【F:src/features/quiz/components/QuizListPage.tsx†L36-L126】
- API configuration hard-codes `/api` as the base URL, so environment-specific endpoints or mock adapters cannot be injected without editing source; prefer environment-driven configuration and dependency injection for testability.【F:src/api/axiosInstance.ts†L35-L46】

## Routing & auth
- Because `AppRoutes` eagerly imports every page and uses component-based guards, none of the protected routes benefit from lazy loading or from `createBrowserRouter` error boundaries; network/render errors will surface as blank screens.【F:src/routes/AppRoutes.tsx†L10-L260】
- `ProtectedRoute` only gates by presence of roles at render time and redirects to `/` on failure, so there is no user feedback or audit trail when access is denied; expose an explicit unauthorized route and surface telemetry from a central auth guard instead.【F:src/components/layout/ProtectedRoute.tsx†L58-L79】
- Navbar role checks are duplicated in presentation logic (e.g., to show Document links), which would be more maintainable if derived from the same routing metadata that powers guards.【F:src/components/layout/Navbar.tsx†L24-L76】

## Performance
- Route-level components are imported synchronously (no `React.lazy` or code-splitting), so initial bundles will include admin, document, AI, and analytics experiences that many users never touch.【F:src/routes/AppRoutes.tsx†L10-L260】
- List screens instantiate services and fetch on every filter change without memoisation; combined with client-side filtering this can lead to wasted renders and expensive array copies for large datasets.【F:src/features/document/components/DocumentList.tsx†L48-L130】【F:src/features/quiz/hooks/useQuizFiltering.ts†L15-L105】
- UI primitives such as `Input` generate random IDs at render time, breaking cacheability and risking hydration mismatches once SSR/Streaming arrives; pre-compute deterministic IDs or require callers to supply them.【F:src/components/ui/Input.tsx†L14-L109】
- Toasts render in the main tree without `aria-live` and rely on `Math.random` IDs, which prevents memoisation and undermines deterministic renders for performance tooling.【F:src/components/ui/Toast.tsx†L31-L101】

## Accessibility
- The navbar’s mobile toggle lacks `aria-expanded`/`aria-controls` wiring, and the layout misses a “skip to content” link, making keyboard navigation through repeated nav content cumbersome.【F:src/components/layout/Navbar.tsx†L78-L109】【F:src/components/layout/Layout.tsx†L5-L12】
- Tables and lists do not announce semantics (e.g., `DocumentList`’s data grid lacks captions and relies entirely on iconography), which will frustrate screen-reader users when scanning results.【F:src/features/document/components/DocumentList.tsx†L170-L238】
- The toast system renders purely visual feedback with clickable SVGs but no assistive cues (`role=alert` / `aria-live`), so notifications are invisible to non-visual users.【F:src/components/ui/Toast.tsx†L74-L99】

## Security & privacy
- Access and refresh tokens are stored in `localStorage`, making them available to any injected script; move long-lived credentials to httpOnly cookies or encrypted storage, and confine access tokens to in-memory lifetimes where possible.【F:src/utils/tokenUtils.ts†L5-L28】
- Multiple components render backend-provided HTML via `dangerouslySetInnerHTML` without sanitisation (`QuestionRenderer`, `QuizResultPage`, `DocumentViewer`), creating XSS sinks—strip or sanitise rich text before rendering and escape user-provided search terms before building regexes.【F:src/features/question/components/QuestionRenderer.tsx†L168-L209】【F:src/features/result/components/QuizResultPage.tsx†L287-L358】【F:src/features/document/components/DocumentViewer.tsx†L109-L140】【F:src/features/document/components/DocumentViewer.tsx†L288-L320】
- Manual string replacement inside `highlightSearchTerm` injects unsanitised user input into HTML, enabling attackers to craft search terms that break markup; escape special characters and avoid directly concatenating markup strings.【F:src/features/document/components/DocumentViewer.tsx†L109-L114】

## Delivery pipeline & operations
- The build pipeline exposes only `dev`, `build`, `lint`, and `preview`; there is no automated test, bundle analysis, or performance budget enforcement step to guard regressions during CI/CD.【F:package.json†L7-L21】
- Axios is hard-wired to `/api`, but there is no environment abstraction for staging/prod hosts or for setting CSP/feature flags at build time; lean on Vite’s env system and an app-level config module to centralise deployment differences.【F:src/api/axiosInstance.ts†L35-L46】
- There is no client-side error reporting or RUM hook in the provider stack, so production issues will be silent; plan to integrate logging/observability providers in the root app shell.【F:src/main.tsx†L1-L21】

## Design system & theming
- The component barrel re-exports feature components wholesale, so downstream code can bypass design-system primitives and couple directly to feature internals; isolate shared UI primitives under a dedicated package and avoid re-exporting feature-level widgets globally.【F:src/components/index.ts†L5-L38】
- UI primitives rely on hard-coded Tailwind classes with no token abstraction, so swapping themes or enforcing design decisions centrally will be brittle; extract shared style tokens and variants into a theming module before the component surface area grows further.【F:src/components/ui/Input.tsx†L29-L57】

## Future options & recommendations
- If SEO or first-paint speed becomes critical, consider migrating the router layer to Next.js/Remix or adding Vite SSR so you can stream authenticated shells while reusing React Query caches; this will also force you to resolve the random-id patterns noted above.【F:src/main.tsx†L1-L21】【F:src/components/ui/Input.tsx†L14-L109】
- The current monolith could evolve into route-based micro-frontends once the route table is code-split and feature modules expose clear public APIs (remove the broad component re-exports first).【F:src/routes/AppRoutes.tsx†L10-L260】【F:src/components/index.ts†L5-L38】
- Introduce an experimentation/feature-flag layer at the provider root so you can progressively roll out advanced quiz/AI capabilities without shipping bespoke builds to each environment.【F:src/main.tsx†L1-L21】