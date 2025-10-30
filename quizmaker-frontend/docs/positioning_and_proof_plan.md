# Quizzence Positioning & Proof Strategy

This document expands the Production Readiness Plan’s Positioning & Proof into a concrete, step‑by‑step implementation guide. It is written for PMMs, content, design, and engineering partners to execute together. Educational notes are included for junior managers.

## Purpose & Outcomes

- Establish a crisp market position that’s consistent across site, product, and outreach.
- Ship credible, repeatable proof that Quizzence improves learning outcomes via retrieval practice.
- Enable fast adoption by instructors and students through clear messaging and visible evidence.
- Create a repeatable playbook to generate and refresh proof over time.

## Summary Choices (aligns to production plan)

- Core message: “Study smarter with short quizzes before and after you learn.”
- Audience priority: instructors/TAs for weekly readings; students as secondary.
- Category: research‑backed micro‑quiz platform for pre/post learning.
- Differentiators: built‑in pre/post flow, fast generation from materials, instructor analytics.
- Brand voice: practical, research‑backed, encouraging; not gimmicky.

---

## Step‑by‑Step Plan (with justification)

1) Define Category, ICP, and JTBD
- Actions
  - Choose category label used on site and sales: “Research‑backed micro‑quiz platform.”
  - Prioritize ICP: course instructors and TAs (late high school + university) who assign weekly readings and need measurable engagement.
  - Document top Jobs‑To‑Be‑Done (JTBD): assign quick checks; see who’s stuck; help students retain.
- Justification
  - Category clarity reduces cognitive friction and SEO ambiguity.
  - ICP focus improves conversion and informs copy, examples, and templates.
- Educational note (for juniors)
  - Positioning is a choice. If you don’t choose, the market chooses for you. Write one sentence that a stranger can repeat.

2) Write the Positioning Statement (single source of truth)
- Template: For [ICP], who [job], Quizzence is a [category] that [core benefit]. Unlike [alternatives], it [differentiators].
- Draft
  - For instructors and TAs who need students to engage with readings and retain more, Quizzence is a research‑backed micro‑quiz platform that makes pre‑ and post‑learning checks fast and measurable. Unlike quiz games or flashcard apps, Quizzence generates quizzes from your materials in minutes and shows who’s at risk early.
- Usage
  - Place in internal docs, brief writers/designers, and validate every headline against it.
- Educational note
  - Your positioning statement isn’t website copy; it’s a north star to keep all messaging consistent.

3) Build the Message Architecture
- Actions
  - Headline: “Boost retention with research‑backed micro‑quizzes.”
  - Subhead: “Test understanding before and after learning — in minutes.”
  - Pillars (3)
    - Fast from materials → quiz in minutes.
    - Pre/post flow that builds durable memory (retrieval practice).
    - See who’s stuck early (instructor analytics).
  - Reasons‑to‑Believe (RTBs)
    - Research summaries hub (`/research`), citations.
    - Pilot results: completion rates, improvement deltas.
    - Testimonials from TAs/instructors; quantified outcomes when available.
- Justification
  - Pillars keep pages and ads consistent. RTBs are the proof that de‑risks claims.
- Educational note
  - Limit to three pillars. If everything is important, nothing is.

4) Design the Proof System (what evidence we show and where)
- Proof asset types
  - Research‑backed: plain‑language summaries of Testing Effect, Spacing, Interleaving, Pre‑testing; link to journals/DOIs.
  - Social proof: testimonials, logos of pilot departments (with permission).
  - Product proof: short demo clip or animated walkthrough of the pre/post flow.
  - Outcome proof: simple metrics from pilots (e.g., “+18% second‑week completion”, “2× quiz attempts before midterm”).
- Placement map
  - Home: hero→RTB strip→sample quiz CTA→testimonial carousel→research snippet.
  - For Teachers: outcome metrics, workflow, case study sidebar.
  - For Students: benefits, streaks, quick review, research snippet.
  - Research hub (`/research`): summaries + links + “how to apply.”
  - Blog: articles with “References” section.
- Justification
  - Distributed proof increases trust at decision moments without forcing a separate click.
- Educational note
  - Choose “proof at the point of doubt.” Place evidence next to the claim it supports.

5) Implement Website Content & IA
- Pages and blocks (marketing)
  - `/` Home
    - Hero (headline/subhead/primary CTA: “Try a sample quiz”).
    - RTB proof strip: 3 bullets + link to `/research`.
    - Teacher value block: “Assign in under 2 minutes.”
    - Student value block: “Review in 3 minutes.”
    - Testimonial carousel and quantified outcomes.
  - `/for-teachers`
    - Workflow: Import → Generate → Assign → Track.
    - Case study (pilot) with outcomes and quote.
    - Checklist to first assignment; FAQ.
  - `/for-students`
    - Study plan with pre/post routine; streaks.
    - Research snippet on retrieval practice.
  - `/research`
    - 4 core summaries (Testing, Spacing, Interleaving, Pre‑testing) each with Abstract, “How to use,” References.
  - `/sample-quiz`
    - Instant playable quiz; end‑screen signup prompts.
- Acceptance criteria
  - Every claim on a page has at least one RTB.
  - Research hub contains 4 summaries at launch; each cites at least one peer‑reviewed source.
  - Home and For Teachers include at least one quantified outcome or “coming from pilot” placeholder.
- Educational note
  - Draft copy before designing. Wireframes should reflect the message hierarchy, not the other way around.

6) Copy & Style Guidelines (for writers and reviewers)
- Tone and voice
  - Practical, helpful, research‑backed, and encouraging. Avoid hype.
- Copy rules
  - Use short sentences and active voice.
  - Claims must be specific; avoid “revolutionary,” “guaranteed,” or unqualified absolutes.
  - Link the first mention of a concept (e.g., “testing effect”) to `/research/testing-effect`.
  - Add a one‑line “What this means for you” under each research concept.
- Review checklist
  - Headline matches positioning statement.
  - Each pillar has at least one RTB.
  - Proof sources are linked and attributed correctly.

7) SEO & Schema for Proof
- Actions
  - Add `Article` schema to research summaries; include `citation` links to DOIs.
  - Add `FAQPage` schema to `/for-teachers` and `/for-students` FAQs.
  - Use `BreadcrumbList` schema across marketing pages.
  - Submit `/sitemap.xml` to Search Console; include `/research/*` and evergreen posts.
- Justification
  - Schema increases visibility and credibility; research terms capture high‑intent informational queries.
- Educational note
  - SEO for proof is about intent alignment: someone searching “testing effect explained” should land on a useful page, not a sales pitch.

8) Pilot Program to Generate Proof
- Target and offer
  - Teaching & Learning centers and TA programs; free Pro for a semester.
  - Commitment: 2–3 classes, share anonymized outcomes, provide testimonial and logo.
- Setup checklist
  - Consent and privacy language for pilots; clear data handling.
  - Define success metrics before start: completion rate lift, second attempt rate, weekly return rate.
  - Provide onboarding kit: slides, email template, getting started guide.
- Data to capture (mapped to GA4)
  - `quiz_started`, `quiz_completed`, `second_attempt_started`, `class_invite_sent`, `teacher_checklist_completed`.
  - Segment by pilot cohort (UTM or org ID) and by week.
- Deliverables
  - One 1‑page case study with graphic and quote.
  - 2–3 short testimonial snippets.
  - One blog post summarizing the pilot experiment.
- Educational note
  - Never retrofit metrics after the fact. Define them upfront and instrument early.

9) Analytics & Measurement (proof freshness)
- GA4 events (commercial names; already defined in production plan)
  - `view_home`, `cta_try_sample_quiz`, `signup_google`, `quiz_started`, `quiz_completed`, `teacher_checklist_completed`, `class_invite_sent`, `subscription_started`, `subscription_renewed`.
- Dashboards
  - Funnel: Home → Sample Quiz → Signup → First Assigned Quiz (teachers) / Second Attempt (students).
  - Pilot outcomes: week‑over‑week completion rate and second attempt rate by class.
- Reporting cadence
  - Weekly dashboard review; monthly publication of a public “What we’re seeing” post with anonymized aggregates.
- Educational note
  - Proof stales. Refresh public numbers at least quarterly or label them with “from Fall ’24 pilot.”

10) Governance, Risk, and Compliance for Claims
- Standards
  - All quantitative claims must cite a source and date; include cohort size and period.
  - Avoid causal claims unless study design supports it; prefer “associated with” or “saw X in pilot”.
  - Maintain a simple source registry (sheet) with links and approvals.
- Risks & mitigations
  - Risk: over‑promising outcomes. Mitigation: conservative copy, multiple RTBs, clear context.
  - Risk: research misinterpretation. Mitigation: expert review for the four core summaries.
- Educational note
  - Credibility compounds. It’s better to be slightly under‑claiming than to walk back a promise.

---

## Implementation Checklist by Role

- PMM
  - Finalize positioning statement, message architecture, and proof plan approval.
  - Own pilot selection, success metrics, and public case study briefs.

- Content
  - Draft homepage, `/for-teachers`, `/for-students` copy; create four research summaries.
  - Write 1 weekly article for 6 weeks tied to research queries; each with a template quiz.

- Design
  - Wireframe hero, RTB strip, testimonial carousel, research snippet; ensure accessibility.
  - Produce case study layout and simple data visualizations.

- Frontend Engineering
  - Build pages/sections listed above; add schema; ensure GA4 events fire.
  - Create `/sample-quiz` flow with end‑screen signup prompt.

- Data/Analytics
  - Implement GA4 events, cohort tagging for pilots, and dashboards.
  - Validate events against acceptance criteria.

- Partnerships
  - Secure 3 pilot classes; collect testimonials/assets; manage permissions.

---

## Copy Blocks (ready to use)

- Homepage headline: “Boost retention with research‑backed micro‑quizzes.”
- Subhead: “Students and teachers test understanding before and after learning — in minutes.”
- Teacher value: “Import your materials, generate a quiz in minutes, assign in a click, and see who’s at risk early.”
- Student value: “Take a quick quiz before and after you study. Build confidence, keep a streak, and remember more.”
- Proof strip (3 bullets)
  - Built on the testing effect and spaced practice.
  - Designed for pre‑ and post‑learning checks.
  - Pilot classes saw higher second‑week completion.

---

## 0/30/60/90 for Positioning & Proof

- 0–30 days (Launch readiness)
  - Approve positioning statement and message architecture.
  - Ship `/research` with 4 summaries and schema.
  - Implement homepage RTB strip, testimonial placeholder, and sample quiz CTA.
  - GA4 events and dashboards live; submit sitemap.

- 31–60 days (Acquire + Prove)
  - Run pilots; collect metrics; publish 1 case study and 2 testimonials.
  - Add quantified outcomes to home and `/for-teachers`.
  - Publish 4–6 research‑aligned articles; embed short demo clip.

- 61–90 days (Refresh + Scale)
  - Quarterly proof refresh; add comparison page vs. “quiz games” alternatives if needed.
  - Expand pilot partners; add second case study.
  - Begin outreach to teaching centers with turnkey kit.

---

## Acceptance Criteria (Definition of Done)

- Positioning statement approved and referenced in briefs.
- All live claims on marketing pages have at least one RTB (link or metric).
- `/research` contains 4 summaries with at least one peer‑reviewed citation each and `Article` schema.
- GA4 shows events firing correctly and dashboards populated for pilots.
- At least one public case study published; at least two testimonial quotes with permission.

---

## Educational Appendix

- Why research‑backed positioning works
  - In education, credibility and evidence reduce perceived risk and procurement friction.

- Common pitfalls
  - Vague claims (“improves learning”) without context; unlinked references; buried proof on separate pages.

- How to run a lightweight pilot
  - Keep setup minimal, pre‑define metrics, get consent, and timebox to one unit or two weeks for fast feedback.

- Proof hygiene checklist
  - Every number: source + date + cohort size. Refresh quarterly or label vintage.

