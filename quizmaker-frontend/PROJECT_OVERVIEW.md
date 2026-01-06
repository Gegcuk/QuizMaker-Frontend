# Quizzence Frontend - Current Product Description

This document describes how the Quizzence (QuizMaker) frontend behaves today based on the current codebase. It is intended to be a shared source of truth for user instructions and marketing copy. Where features are mocked or not fully wired to the backend, that is called out explicitly.

## Scope and source
- Source of truth: frontend implementation in `quizmaker-frontend`.
- API behavior is inferred from service and endpoint definitions in `src/api` and `src/features/*/services`.
- A referenced `ai_api_guide.md` file was not found in this repository, so no additional OpenAPI details were loaded.

## Product snapshot
- Quizzence is a web app for creating, managing, and taking quizzes.
- Positioning in the landing page and SEO metadata: "AI quiz generator and quiz maker for teachers and learners" with research-based retrieval practice framing.
- Branding: the user-facing name is "Quizzence". The repo and package name are "quizmaker-frontend".

## Current messaging and claims in the UI
These are explicit statements present in the landing page and blog content.
- "AI quiz generator and quiz maker for teachers and learners."
- "Create quizzes in seconds from text, PDFs or links." (note: link ingestion is not implemented in UI flows.)
- Retrieval practice framing: "pre-quiz -> learn -> post-quiz."
- Research claims shown on the home page:
  - "+10 to 13 percentage points better exam scores"
  - "g = 0.6 to 0.7 effect size"
  - "10 to 20 percent spacing rule"
- "Smart spacing soon" is mentioned as a future capability, not implemented in the app flow.

## Users and roles (role-based access)
Roles exist in auth and admin types, and are enforced in the router via `ProtectedRoute`.
- ROLE_USER: default authenticated user (take quizzes, manage own profile, view own attempts).
- ROLE_QUIZ_CREATOR: can create and manage quizzes, access question management, and document tools.
- ROLE_MODERATOR: access similar creator tools plus moderation capabilities (routes gated, UI varies).
- ROLE_ADMIN: broader admin tools (system and user management endpoints exist; UI partially exposed).
- ROLE_SUPER_ADMIN: access bug report management and billing pack sync.

## Core journeys (what users can do)
### Visitors (not logged in)
- See the landing page at `/` with CTA to log in or register.
- Read blog content at `/blog` and `/blog/:slug`.
- View Terms and Privacy pages.

### Authenticated learners (ROLE_USER)
- View "My Quizzes" and take assigned/owned quizzes.
- Start a quiz attempt, resume paused attempts, and complete attempts.
- View attempt results and summaries.
- Manage profile details and view token balance.

### Quiz creators (ROLE_QUIZ_CREATOR and above)
- Create quizzes manually or with AI from text or documents.
- Manage quizzes (status, visibility, tags, category).
- Maintain a question bank across multiple question types.
- Export quizzes in multiple formats.
- Manage documents used for quiz generation (if the feature is enabled and accessible).

### Admins and super admins
- Super admins can manage bug reports and sync billing packs.
- Admin endpoints exist for roles/permissions and system status, though UI coverage is limited.

## Feature map (current behavior)

### Authentication and onboarding
- Login, register, logout, refresh tokens.
- Email verification flow with resend support.
- Forgot password and reset password flows.
- OAuth login and account linking via `/oauth2/authorization/<provider>` and `/v1/auth/oauth/accounts`.
- If a logged-in user visits `/login` or `/register`, they are redirected to `/my-quizzes`.
- JWT access and refresh tokens are stored in localStorage (with in-memory fallback) and auto-refreshed by Axios interceptors.

### Navigation and layout
- App is a single-page app using React Router.
- The main layout includes Navbar, Footer, and optional Sidebar.
- Navbar shows "My Quizzes", "My Attempts", "Blog", and "Billing" for logged-in users, with a "Found a bug?" quick entry.
- Document navigation exists in routes but is hidden in Navbar and Sidebar.

### Quiz creation and management
- New quiz creation uses a wizard (`/quizzes/create`) with steps:
  1) Select creation method (manual, from text, from document).
  2) Configure quiz settings (title, description, visibility, difficulty, estimated time, timer, repetition, category, tags).
  3) Add questions manually or generate with AI.
  4) Review and complete.
- Manual creation:
  - Creates a quiz in DRAFT and opens a question manager for adding/removing questions.
- AI generation from text:
  - Requires text input (min 300 characters, max 100,000).
  - Select question counts for MCQ single, MCQ multi, True/False, Fill Gap, Compliance, Ordering, and Matching.
  - Shows a token cost estimate before generation.
  - Starts a background generation job and fetches the generated quiz by job ID.
- AI generation from documents (wizard flow):
  - Upload a document, select pages in a preview modal, and generate from selected content.
  - Selected pages are converted to text and sent to `/v1/quizzes/generate-from-upload`.
  - Chunking is forced to SIZE_BASED with a max chunk size of 100,000 characters.
  - Shows token cost estimates based on selected content.
- AI generation from documents (document management flow):
  - Upload and process documents in `/documents`.
  - Optionally generate a quiz from the processed document.
  - Question counts can include OPEN and HOTSPOT in this flow.
- Quiz settings and status:
  - Status: DRAFT, PUBLISHED, ARCHIVED (additional statuses exist in types: PENDING_REVIEW, REJECTED).
  - Visibility: PUBLIC or PRIVATE.
  - Timers and repetition can be enabled per quiz.
- Quiz groups:
  - Create groups and add or remove quizzes from them.
- Sharing:
  - A share panel creates a public link to the quiz detail page and offers social sharing.
- Export:
  - Export formats: PDF print, HTML print, XLSX editable, JSON editable.
  - Export options include cover page, metadata, separate answer pages, hints, explanations, and grouping by type.

### Question bank and question types
- Question management page supports CRUD for a question bank.
- Supported question types:
  - MCQ single, MCQ multi
  - True/False
  - Open
  - Fill Gap
  - Compliance
  - Ordering
  - Hotspot
  - Matching
- Questions can include hints, explanations, and optional attachments.

### Quiz attempts and results
- Attempt modes: ONE_BY_ONE, ALL_AT_ONCE, TIMED.
- Attempt flow supports:
  - Detecting existing attempts (paused or in progress).
  - Starting new attempts or resuming existing ones.
  - Pausing and resuming attempts.
  - Timers and per-question time tracking (timed mode).
- Answer submission:
  - Single answers or batch answers.
  - Optional correctness feedback and correct answer inclusion in responses.
- Results:
  - Quiz result summary and leaderboard.
  - Attempt review is used by the quiz results page; the answer key endpoint exists for completed attempts.

### Analytics
- Quiz analytics component shows score distribution, question performance, and attempt trends.
- Advanced analytics is feature-flagged.
- Some analytics charts are computed or simulated on the client rather than fetched from a dedicated analytics endpoint.
- Question analytics component currently uses mock data (not wired to an API).

### Documents and content processing
- Document management routes (role-gated for creators and above):
  - `/documents` list, filter, and manage documents.
  - `/documents/upload` upload documents with chunking options.
  - `/documents/:id` view document chunks and search within them.
- Supported upload types in UI validation:
  - PDF, DOCX, RTF, TXT (document management flow).
  - PDF, EPUB, DOC, DOCX, TXT (wizard flow uses its own validation).
- Chunking strategies: AUTO, CHAPTER_BASED, SECTION_BASED, SIZE_BASED, PAGE_BASED.
- Document status: UPLOADED, PROCESSING, PROCESSED, FAILED.
- Document viewer:
  - Paginates chunks, supports search and highlighting, displays metadata.
- Document processing API (`/v1/documentProcess`) supports ingesting text, building structure, and extracting content.
  - These endpoints are present in services but are not exposed in the main route map.

### Tags and categories
- Tag management page for CRUD on tags.
- Category management page for CRUD on categories.
- Quizzes can be tagged and assigned to categories.

### Billing and tokens
- Token balance with available and reserved tokens.
- Token packs fetched from backend; checkout initiated via Stripe.
- Transaction history with filters and pagination.
- Super admin can trigger a "sync packs" action to refresh token packs.
- AI quiz generation can surface "insufficient balance" errors.

### User profile and settings
- Profile page allows editing username, email, display name, and bio.
- Avatar upload supported (PNG/JPEG/WEBP) via `/v1/users/me/avatar`.
- Resend verification email from the profile.
- Linked OAuth accounts view and unlink actions.
- Settings page has UI for notifications, privacy, preferences, and security, but is not wired to backend persistence.
- User activity and statistics pages use mock data and are not wired to backend APIs.

### Bug reporting
- In-app bug report modal collects a short message and optional details.
- Bug report management page (super admin only) supports filtering, editing, and deleting reports.

### Blog and SEO
- Blog index and article pages are public.
- SEO metadata is set per page using a shared `Seo` component.
- Sitemap and robots files are present in `public/`.

### Theme system
- Multi-color scheme theme system with light, dark, blue, purple, and green palettes.
- Theme selection persists in localStorage and can follow system theme.
- Theme toggle and color scheme selector are built-in UI components.

## Feature flags (environment-controlled)
Feature flags are read from `VITE_FEATURE_*` environment variables:
- VITE_FEATURE_ADVANCED_ANALYTICS
- VITE_FEATURE_REALTIME_STATS
- VITE_FEATURE_EXPORT
- VITE_FEATURE_AI_GENERATION
- VITE_FEATURE_SOCIAL_SHARING

## Integrations and telemetry
- GA4 page view and custom event tracking via `VITE_GA_MEASUREMENT_ID`.
- Stripe checkout for token purchases.
- OAuth providers via Spring Security OAuth2 endpoints.

## Technical architecture (frontend)
- React + TypeScript + Vite.
- Tailwind CSS with a custom theme system.
- React Router for routing.
- React Query for server state.
- Axios with a shared instance:
  - Base URL `/api`
  - Automatic token injection
  - Single-flight refresh handling
  - File upload and long-running request helpers

## Route map (selected, current)
Public:
- `/` home
- `/login`, `/register`
- `/forgot-password`, `/reset-password`
- `/verify-email`
- `/terms`, `/privacy`
- `/blog`, `/blog/:slug`
- `/oauth/callback`, `/oauth2/redirect`
- `/theme-demo` (internal showcase)

Authenticated (any role):
- `/my-quizzes`
- `/quizzes/:quizId` (details)
- `/quizzes/:quizId/attempt/start` (attempt flow)
- `/quizzes/:quizId/attempt` (attempt execution)
- `/quizzes/:quizId/results` and `/quizzes/:quizId/results-summary`
- `/quizzes/:quizId/generation` (AI generation jobs page)
- `/quizzes/create`, `/quizzes/:quizId/edit`
- `/my-attempts`
- `/questions`, `/tags`, `/categories` (available to authenticated users; navigation may hide these for some roles)
- `/profile`, `/settings`
- `/billing` (+ `/billing/success`, `/billing/cancel`)
- `/ai-analysis` and `/form-test` (internal/test pages)

Role-gated:
- `/documents`, `/documents/upload`, `/documents/:id` (creator and above)
- `/bug-reports` (super admin only)

## Known gaps, placeholders, and hidden features
- Quiz generation jobs page uses mock data and is not connected to API.
- User settings, activity, and statistics pages use mock data and do not persist changes.
- Question analytics component uses mock data and is not connected to API.
- Admin user management UI is not implemented, though endpoints exist.
- Document navigation is hidden in main menus even though document routes are active.
- A "public quiz list" page exists in components but is not wired to routes.
- Media library services exist (uploads/search/delete), but there is no dedicated UI page wired to them.

## Glossary (terms used in UI and API)
- Quiz: a collection of questions with metadata (title, difficulty, visibility, status).
- Question: a single item with a type (MCQ, True/False, etc) and content schema.
- Attempt: a user session taking a quiz (can be paused or completed).
- Result: aggregated performance data for a quiz or an attempt.
- Document: an uploaded file processed into chunks for AI generation.
- Chunk: a portion of a document used for quiz generation.
- Generation job: a background AI task that creates quiz questions.
- Token: billing unit used for AI generation and related operations.
