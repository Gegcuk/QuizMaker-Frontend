# Quizzence Commercial Launch Plan

This is a commercial, non‑technical plan to take Quizzence to market. It focuses on positioning, messaging, pricing, acquisition, activation, retention, and measurement. All choices below pick one best option to reduce ambiguity. Analytics: GA4.

## Positioning & Proof

- Core message: “Study smarter with short quizzes before and after you learn.”
- Audience focus: higher‑ed students and teachers (late high school + university). One ICP to prioritize: course instructors and TAs who assign weekly readings and want measurable engagement.
- Proof point: built on research showing that retrieval practice (quizzing right after and before learning) significantly boosts retention and understanding.
- Brand voice: practical, research‑backed, encouraging; not gimmicky.

## Offer & Pricing (single motion)

- Monetization: freemium self‑serve with a single Pro tier for teachers (and power students).
- Free: take quizzes, sample content, limited quiz creation, basic sharing.
- Pro (best option): $12/month or $96/year via Stripe. Includes unlimited quiz generation/imports, class invites, analytics, exports, priority support, and custom branding for classes.
- Discount: 50% student discount with .edu verification or student ID.

## Value Proposition & Messaging

- Student benefits: remember more in less time; quick checks before and after reading; track streaks; feel confident before exams.
- Teacher benefits: fast quiz creation from materials; assign in clicks; see who’s engaged; close knowledge gaps early.
- Homepage headline: “Boost retention with research‑backed micro‑quizzes.”
- Subhead: “Students and teachers use Quizzence to test understanding before and after learning and retain more — in minutes.”

## Acquisition Strategy (choose one primary channel)

- Primary channel: SEO content + search intent capture.
  - Focus topics: retrieval practice (testing effect), spacing, interleaving, effective study strategies, and class engagement tips.
  - Capture long‑tail queries like “best way to study after reading,” “testing effect explained,” “quick quiz templates for teachers.”
- Secondary (lightweight): YouTube explainer videos embedded in articles. No other social at launch.
- Paid: brand‑only Google Ads (exact match on brand name) with small budget; no broad paid at launch.

## Content & Research Strategy

- Create a Research hub (single destination): `/research`.
  - Structure: plain‑language summaries of key findings (Testing Effect, Spacing Effect, Interleaving, Pre‑testing), each with a short abstract, recommended use in class/study, and links to original papers.
  - Tone: accessible summaries, 3–5 bullet “how to use this in practice.”
- Blogging cadence: 1 authoritative article per week (1,500–2,000 words) tied to a quiz template or a micro‑experiment students can try.
- Lead magnets: one “Study Playbook” PDF compiled from research summaries for email capture.
- Distribution: publish on the site and send via newsletter; no cross‑posting at launch.

## Sitemap & Information Architecture (marketing)

- Pages (public):
  - `/` — Home (hero, proof, benefits, sample quiz CTA, testimonials, research snippet).
  - `/pricing` — Free vs Pro, student discount.
  - `/for-students` — Benefits, sample study plan, FAQs.
  - `/for-teachers` — Workflow (import → generate → assign → track), checklist.
  - `/research` — Evidence hub (see above) with outbound links to papers.
  - `/blog` — Articles library.
  - `/sample-quiz` — Instant playable quiz (no login) with end‑of‑quiz signup prompt.
  - `/privacy`, `/terms`, `/contact`.
- Sitemap (single best approach): XML at `/sitemap.xml`, updated at each release; submit to Google Search Console. Include only public marketing pages and evergreen article URLs.
- Robots: allow marketing pages; disallow authenticated app paths.

## Onboarding & Activation (commercial + UX outcomes)

- Students (goal: attempt a quiz in < 2 minutes):
  - Primary entry: “Try a sample quiz” from Home → `/sample-quiz` → end screen prompts signup to save streaks and get personalized reviews.
  - Signup method (best option): Google SSO as the default; email as secondary inside the flow, but not promoted in hero.
  - Activation metric: complete first quiz + start a second within the first session.

- Teachers (goal: assign a quiz to a class in first session):
  - After signup, show a 4‑step checklist: Create a class → Import material → Generate quiz → Share link.
  - Provide 2 ready‑to‑assign templates so teachers can feel success in minutes.
  - Activation metric: share an assignment link with at least 5 students.

## Engagement & Retention (one core loop)

- Core loop: weekly micro‑quizzes tied to readings + streaks/reminders + analytics insights that prompt the next action.
- Student retention lever: streak badges and “review in 3 minutes” nudges after class.
- Teacher retention lever: weekly email digest “who’s at risk + suggested quick checks.”

## Partnerships & Distribution (single best route)

- Best route: university teaching and learning centers + TA programs.
  - Offer free Pro for a semester in exchange for a pilot with 2–3 classes and testimonials.
  - Provide a turnkey slide and email template for instructors.

## Measurement & Analytics (GA4)

- Platform: Google Analytics 4 (GA4) only. Configure key conversions and funnels.
- Core events (commercial names):
  - `view_home`, `cta_try_sample_quiz`, `signup_google`, `quiz_started`, `quiz_completed`, `teacher_checklist_completed`, `class_invite_sent`, `subscription_started`, `subscription_renewed`.
- Funnels to monitor:
  - Home → Sample Quiz → Signup → First Assigned Quiz (teachers) → Subscription.
  - Home → Sample Quiz → Signup → Second Attempt (students) → Weekly return.
- Reporting cadence: weekly review of GA4 dashboards; monthly growth retro on acquisition and activation.

## Support & Trust

- Support channel (best option): Crisp live chat + email for cost‑effective support and a simple help center.
- Social proof: rotate testimonials from pilot classes on the homepage; show 2–3 quantified outcomes (e.g., “+18% quiz completion in week 2”).

## 30/60/90‑Day Commercial Plan

- 0–30 days (Launch readiness)
  - Finalize pricing page and checkout (Stripe), Research hub with 4 summaries, homepage copy, sample quiz, GA4 conversions, sitemap submission.
  - Outreach: secure 3 pilot classes via teaching centers or TA networks.

- 31–60 days (Acquisition + Activation)
  - Publish 5–6 blog posts tied to research queries; each includes a template quiz.
  - Run a webinar for instructors (“How to use pre‑/post‑quizzes to boost retention”).
  - Convert pilots to testimonials; add case study.

- 61–90 days (Retention + Monetization)
  - Ship weekly teacher digest emails and student streak reminders.
  - Launch Pro tier publicly; offer semester pilot discount for early cohorts.
  - Expand pilots to 2 more departments.

## KPIs & Targets

- Traffic: 5k monthly organic visits by day 90.
- Activation: 60% of new students complete a quiz; 30% start a second.
- Teacher activation: 40% share a class link in week 1.
- Conversion: 5–8% of active teachers start Pro; refund rate < 3%.
- Retention: 25% WAU/MAU for students by day 90.

## Where to Place Research Links (clear guidance)

- Dedicated page: `/research` as the permanent hub for plain‑language summaries with outbound links to studies (journals, DOIs, reputable blogs).
- In‑content references: each blog article includes a short “References” section at the end linking to the most relevant papers.
- Navigation: add “Research” to the top navigation and footer.
- Lead magnet: compile summaries into a “Study Playbook” PDF for email capture.

## Risks & Mitigations

- Risk: slow top‑of‑funnel growth from SEO in the first 60 days. Mitigation: seed traffic via pilots, webinar, and internal links from partner departments.
- Risk: teacher setup feels heavy. Mitigation: promote templates first; “assign in under 2 minutes” flow; checklist with progress.
- Risk: student churn after exams. Mitigation: habit loops via streaks and quick post‑class reviews; semester‑long plans tied to syllabi.

This plan keeps choices singular and commercial: GA4 for analytics, Stripe for payments, Google SSO as the primary signup, SEO as the growth engine, and a Research hub for credibility and backlinks.
