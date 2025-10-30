# Quizzence Value Proposition & Messaging Plan

This plan turns the Production Readiness Plan’s “Value Proposition & Messaging” into a concrete, step‑by‑step implementation guide. It defines the message architecture, copy blocks, placement, proof, and instrumentation so marketing, product, design, and engineering can execute consistently. Educational notes are included for junior managers.

## Goals & Outcomes

- Ship a consistent message across site, product, emails, and pilots.
- Convert teachers quickly (assign in first session) and keep students engaged (second attempt in first session).
- Anchor claims in research and pilot outcomes to build trust.
- Instrument GA4 to measure what messaging and pages drive activation and conversion.

---

## Positioning Summary (from Production Plan)

- Category: research‑backed micro‑quiz platform for pre/post learning.
- Core message: “Study smarter with short quizzes before and after you learn.”
- Audience priority: instructors/TAs who assign weekly readings; students as secondary.
- Differentiators: fast quiz generation from materials, built‑in pre/post flow, instructor analytics.
- Brand voice: practical, research‑backed, encouraging; not gimmicky.

Educational note — Positioning vs messaging: Positioning is the strategic choice about where we play and win; messaging is the specific words we use to express that choice in each context (web, product, email).

---

## Value Proposition Framework

We articulate value in audience‑specific “benefit ladders” that connect features → benefits → outcomes.

- Students
  - Feature: quick pre/post micro‑quizzes; streaks; 3‑minute reviews.
  - Benefit: remember more in less time; confidence before exams.
  - Outcome: higher retention, fewer surprises on tests.
  - Value line: “Remember more in less time.”

- Teachers
  - Feature: generate from materials in minutes; assign with a link; analytics.
  - Benefit: save prep time; see who’s engaged; close gaps early.
  - Outcome: better participation and outcomes with less effort.
  - Value line: “Assign in under 2 minutes. See who’s stuck.”

Educational note — Sell outcomes, not ingredients: Lead with the “so what” (time saved, retention gained). Features support the story; they are not the story.

---

## Message Architecture (the message house)

- Headline (site hero): “Boost retention with research‑backed micro‑quizzes.”
- Subhead: “Students and teachers test understanding before and after learning — in minutes.”

- Pillars (3)
  1) Fast from materials → quiz in minutes
  2) Pre/post flow that builds durable memory (retrieval practice)
  3) See who’s stuck early (instructor analytics)

- Reasons‑to‑Believe (RTBs)
  - Research hub: plain‑language summaries of Testing Effect, Spacing, Interleaving, Pre‑testing with citations.
  - Pilot outcomes: completion rate lifts, second attempt rate, instructor quotes.
  - Product proof: short demo clip of import → generate → assign → track.

- Primary CTAs
  - “Try a sample quiz” (top of funnel → `/sample-quiz`).
  - “Start free” (register) and “Upgrade to Pro” (teachers).

Educational note — Three pillars only: If everything is a pillar, nothing is. Keep it memorable.

---

## Copy Blocks (ready to use)

- Homepage hero
  - Headline: Boost retention with research‑backed micro‑quizzes.
  - Subhead: Students and teachers test understanding before and after learning — in minutes.
  - Primary CTA: Try a sample quiz
  - Secondary CTA: Start free

- Teacher value block
  - Heading: Assign in under 2 minutes
  - Body: Import your materials, generate a quiz in minutes, share a link. See who’s engaged and where to review.
  - CTA: Create a class

- Student value block
  - Heading: Remember more in less time
  - Body: Do a quick check before and after you study. Keep a streak, get 3‑minute reviews, and feel confident for exams.
  - CTA: Take a sample quiz

- Research proof strip
  - “Backed by the Testing Effect” — Short summary with link to `/research/testing-effect`.
  - “Retention improves with spacing” — Link to `/research/spacing-effect`.
  - “Pre‑testing raises attention” — Link to `/research/pre-testing`.

- Pricing highlights (aligns to pricing doc)
  - Free: Create and take quizzes with clear limits.
  - Pro ($12/mo or $96/yr): Unlimited generations/imports, class invites, analytics, exports, priority support, basic class branding. 50% student discount.

Educational note — Plain language wins: Avoid jargon. Read copy aloud. If it feels like ad‑speak, rewrite it.

---

## Placement Map (where each message lives)

- Home (`/`)
  - Hero (headline, subhead, “Try a sample quiz”).
  - RTB strip linking to research.
  - Teacher block → “Create a class” CTA.
  - Student block → “Take a sample quiz” CTA.
  - Testimonial carousel + quantified outcome chips.

- For Teachers (`/for-teachers`)
  - Workflow: Import → Generate → Assign → Track.
  - Case study with outcomes and quote.
  - Checklist to first assignment; FAQs.

- For Students (`/for-students`)
  - Benefits, streaks, quick reviews, research snippet; FAQ.

- Research (`/research`)
  - Summaries of Testing Effect, Spacing, Interleaving, Pre‑testing with application tips and citations.

- Blog (`/blog`)
  - Weekly article aligned to research queries; each includes a template quiz.

- Sample Quiz (`/sample-quiz`)
  - Instant playable quiz (no login) with end‑screen prompt to sign up.

Educational note — Proof at the point of doubt: Place evidence next to the claim it supports rather than on a separate “about” page only.

---

## Implementation Guide (site + product)

This section translates messaging into concrete changes in this repo and the app routes.

1) Update the homepage hero
- Actions
  - Replace current tagline in `src/pages/HomePage.tsx` with the new headline and subhead.
  - Add a prominent primary CTA button “Try a sample quiz” linking to `/sample-quiz`.
- Acceptance criteria
  - Headline and subhead match “Copy Blocks”.
  - GA4 event `cta_try_sample_quiz` fires on click.

2) Add marketing routes
- Actions (routes live in `src/routes/AppRoutes.tsx`)
  - Create pages: `ForTeachersPage.tsx`, `ForStudentsPage.tsx`, `ResearchPage.tsx`, `BlogListPage.tsx`, `SampleQuizPage.tsx`, `PricingPage.tsx` under `src/pages/`.
  - Register routes: `/for-teachers`, `/for-students`, `/research`, `/blog`, `/sample-quiz`, `/pricing`.
- Acceptance criteria
  - Each route renders content scaffold with headings and placeholder components for copy blocks defined above.
  - Public access (no auth) for marketing pages and sample quiz.

3) Implement the Research hub
- Actions
  - Create `docs/research/` summaries (Testing Effect, Spacing, Interleaving, Pre‑testing) and render them on `/research`.
  - Include citations with outbound links to journals/DOIs.
- Acceptance criteria
  - Each summary has: abstract (80–120 words), “How to apply” (3–5 bullets), and references.

4) Sample quiz flow
- Actions
  - Implement `/sample-quiz` as an immediately playable quiz (mock or curated), with an end‑screen prompt: “Save your streaks — Start free”.
- Acceptance criteria
  - No login required; end‑screen has signup CTA; GA4 `quiz_started`/`quiz_completed` fire.

5) Pricing page messaging
- Actions
  - Build `/pricing` comparing Free vs Pro; include student discount (50%).
  - Publish limits (e.g., free guardrails) clearly for trust.
- Acceptance criteria
  - Matches “Pricing highlights” and mirrors the pricing strategy doc.

6) Schema, SEO, and metadata
- Actions
  - Add page titles and meta descriptions for all marketing pages.
  - Add JSON‑LD schema: `WebSite` on home, `Product` on pricing, `FAQPage` on teacher/student FAQs.
- Acceptance criteria
  - Lighthouse shows valid schema; pages have descriptive titles and unique meta descriptions.

7) GA4 instrumentation (events already defined in the production plan)
- Actions
  - Fire: `view_home`, `cta_try_sample_quiz`, `signup_google`, `quiz_started`, `quiz_completed`, `teacher_checklist_completed`, `class_invite_sent`, `subscription_started`, `subscription_renewed`.
  - Add content grouping or parameters to test headlines/CTAs (e.g., `hero_headline_version`).
- Acceptance criteria
  - Events appear in GA4 DebugView; funnels configured for Home → Sample Quiz → Signup → First Assigned Quiz (teachers) / Second Attempt (students).

8) In‑app messaging alignment
- Actions
  - Teacher onboarding checklist copy: “Create a class → Import → Generate → Share link”.
  - Student nudges: “Review in 3 minutes” reminders; streak badges copy encouraging weekly return.
- Acceptance criteria
  - Copy mirrors message architecture; no contradictions with website promises.

Educational note — Acceptance criteria prevent bikeshedding: Agree on “done” definitions before building. It accelerates reviews and reduces rework.

---

## Editorial & Voice Guidelines

- Tone: practical, research‑backed, encouraging; avoid hype.
- Reading level: target Grade 7–9 for marketing pages; use shorter sentences.
- Style
  - Use active voice (“Assign in under 2 minutes”).
  - Prefer concrete words over abstractions (“quizzes” not “assessments”).
  - Avoid absolutes; be precise and testable.

Educational note — Consistency compounds: A clear voice repeated across touchpoints builds brand memory and trust faster than sporadic cleverness.

---

## A/B Tests & Experiments

- Hero headline (Home)
  - A: “Boost retention with research‑backed micro‑quizzes.”
  - B: “Study smarter with quick pre/post quizzes.”
  - Success metric: click‑through on `cta_try_sample_quiz` and progression to `quiz_started`.

- Primary CTA label
  - A: “Try a sample quiz” vs B: “Test yourself now”.
  - Success metric: CTR, then `quiz_completed` conversion.

- Teacher checklist microcopy
  - A: “Assign in under 2 minutes” vs B: “Share a link in 2 clicks”.
  - Success metric: `teacher_checklist_completed` rate.

- Pricing highlight order
  - Test whether leading with “Unlimited quiz generation” vs “Analytics & exports” improves `subscription_started`.

Educational note — Test one meaningful variable at a time. Changing both headline and CTA at once muddies causality.

---

## Measurement & Reporting

- Core funnels
  - Home → Sample Quiz → Signup → First Assigned Quiz (teachers) → Subscription.
  - Home → Sample Quiz → Signup → Second Attempt (students) → Weekly return.

- Weekly reporting
  - Dashboard review of above funnels and landing page CTRs.
  - Share top 3 insights and 1–2 hypotheses for next tests.

- Monthly retro
  - Analyze Free→Pro conversion, MAS distribution, and any overage triggers (per pricing doc).
  - Publish a “What we’re seeing” post (anonymized aggregates) to build external credibility.

Educational note — Label cohorts: Pilots, semesters, and acquisition sources behave differently. Segment before you conclude.

---

## Risks & Guardrails (for messaging)

- Over‑claiming outcomes
  - Guardrail: Cite sources with cohort and date; prefer “saw X in pilot” over causal claims.

- Voice drift across pages
  - Guardrail: Centralize copy blocks in this doc and link them in briefs; run a monthly copy audit.

- Misaligned product promises
  - Guardrail: PMM reviews key UI copy and onboarding before release.

---

## Execution Timeline & Owners (0–90 days)

- 0–30 days (Launch readiness)
  - Update homepage hero and CTAs; add `/sample-quiz` scaffold.
  - Stand up `/research` with 4 core summaries.
  - Ship `/pricing` with Free vs Pro and student discount.
  - Instrument GA4 events and submit sitemap.

- 31–60 days (Acquisition + Activation)
  - Publish 5–6 blog posts aligned to research queries; each links a template quiz.
  - Add `/for-teachers` and `/for-students` pages with copy blocks and FAQs.
  - Run an instructor webinar; capture testimonials for site.

- 61–90 days (Retention + Monetization)
  - Ship weekly teacher digests and student streak reminders (copy aligned here).
  - Launch Pro tier publicly; add pilot case study to `/for-teachers`.

Suggested owners
- PMM: this plan, copy approvals, research hub oversight.
- Content: page drafts, research summaries, weekly articles.
- Design: hero/RTB/testimonial components and page layouts.
- Frontend: routes/pages, sample quiz, GA4 wiring, schema.
- Data: GA4 dashboards; funnel QA.
- Partnerships: pilots, testimonials, permissions.

---

## Engineering Notes (repo‑specific pointers)

- Routes live in `src/routes/AppRoutes.tsx` (add public routes for marketing pages and sample quiz).
- Existing `HomePage.tsx` copy should be updated to the hero copy above.
- Add page files under `src/pages/` (e.g., `ForTeachersPage.tsx`, `ForStudentsPage.tsx`, `ResearchPage.tsx`, `BlogListPage.tsx`, `SampleQuizPage.tsx`, `PricingPage.tsx`).
- Fire GA4 events using the existing analytics provider or a small wrapper; include parameters for A/B test variants (e.g., `hero_headline_version`).
- Add JSON‑LD in `index.html` or via a head manager library at render time.

Educational note — Keep marketing pages public: Do not wrap marketing routes in `ProtectedRoute`; keep load light for crawlability and speed.

---

## Quick Brief Template (reuse for tickets)

- Goal: e.g., Increase `cta_try_sample_quiz` CTR by 20%.
- Page/placement: Home hero.
- Copy: [paste from Copy Blocks].
- Proof asset: [research link/testimonial ID].
- CTA: [label + destination].
- Instrumentation: GA4 events/params.
- Acceptance criteria: [list].

---

## Appendix — FAQ Talking Points

- Why micro‑quizzes?
  - Retrieval practice strengthens memory pathways. Short checks before and after learning improve retention and metacognition.

- Why pre/post specifically?
  - Pre‑testing increases attention and sets expectations; post‑testing consolidates learning. Together, they produce durable learning gains.

- How is Quizzence different from quiz games or flashcards?
  - It’s designed for quick checks tied to actual course materials, with instructor analytics that surface who needs help now.

- What about students without .edu emails?
  - Accept student IDs; keep the discount policy transparent and documented.

---

This plan is the single source of truth for Quizzence’s value proposition and messaging through the first 90 days. Revisit quarterly as pilots, research summaries, and product capabilities evolve.

