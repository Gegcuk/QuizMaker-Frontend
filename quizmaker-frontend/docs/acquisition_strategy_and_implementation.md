# Quizzence Acquisition Strategy & Implementation Plan

This plan operationalizes the Production Readiness “Acquisition Strategy” into concrete, step‑by‑step actions with justifications and educational notes for junior managers. It aligns with our positioning, pricing, IA, and GA4 analytics choices.

## Objectives

- Grow qualified organic traffic and capture search intent for “research‑backed micro‑quizzes”.
- Convert visitors via product-led touchpoints (Sample Quiz, research credibility, simple pricing).
- Enable teachers to assign a first quiz quickly; nudge students to a second attempt.
- Measure impact end-to-end with GA4 and Search Console; iterate weekly.

## Strategy Summary

- Primary channel: SEO content + search intent capture focused on retrieval practice and study strategies.
- Secondary: Lightweight YouTube explainers embedded in articles and pages.
- Paid at launch: Brand-only Google Ads (exact match on brand) for protective coverage.

Educational note: Channels concentrate focus. One primary plus one secondary avoids dilution and accelerates learning loops.

---

## ICP, Intent, And Messaging Anchors

- ICP: Instructors/TAs who assign weekly readings and want measurable engagement; students as secondary users.
- Core message: “Study smarter with short quizzes before and after you learn.”
- Primary intents to capture (examples)
  - Informational: testing effect, spacing, interleaving, pre‑testing, “how to study after reading”.
  - Navigational: Quizzence brand queries and misspellings.
  - Commercial investigation: “quiz generator from PDF/notes”, “quiz templates for teachers”.

Justification: Matching content to search intent improves click‑through, time on page, and conversions.

Educational note: Classify every keyword by intent (Informational, Navigational, Commercial, Transactional) before prioritizing.

---

## 90‑Day Timeline (Outcome‑Oriented)

- 0–30 days
  - Foundations: GA4 events, Search Console, sitemap/robots/schema, content templates, Research hub scaffolding.
  - Publish: Four research summaries and one anchor blog post tied to “testing effect”.
  - Ads: Launch brand‑only campaign.
- 31–60 days
  - Publish: One authoritative article per week (5–6 total) + two YouTube explainers embedded.
  - Launch Sample Quiz page and optimize end‑screen signup.
  - Pilot outreach to teaching centers; secure 2–3 backlinks and 1 case study in progress.
- 61–90 days
  - Content refresh for top performers; add FAQ schema to two articles.
  - Webinar for instructors; case study published; expand internal linking.
  - Iterate based on GA4/GSC dashboards; prune/merge underperformers if needed.

Educational note: SEO compounds slowly; success comes from consistent shipping and iterative improvement, not one‑off “big posts”.

---

## Foundations (Week 0–1)

1) Analytics & Search Console
- GA4: Confirm events from Production Plan are firing: `view_home`, `cta_try_sample_quiz`, `signup_google`, `quiz_started`, `quiz_completed`, `teacher_checklist_completed`, `class_invite_sent`, `subscription_started`, `subscription_renewed`.
- Content Grouping: Add page‑level dimension for Content Group (e.g., research, blog, for‑teachers, for‑students, sample-quiz).
- Google Search Console (GSC): Verify domain, submit sitemap, set target country if applicable.

Justification: Measurement first enables fast attribution and learning.

Educational note: In GA4, build Explorations per channel and add UTM filters for content cohorts.

2) Technical SEO
- Sitemap: Auto‑generate XML at `/sitemap.xml`; include only public marketing and evergreen blog URLs. Update on release.
- Robots.txt: Allow marketing paths; disallow authenticated app paths.
- Canonicals: Set self‑referencing canonicals; avoid duplicate parameterized URLs.
- Schema: Add JSON‑LD for `Article`, `BreadcrumbList`, and `FAQPage` where applicable; add `VideoObject` where YT videos embedded.
- Performance: Set Core Web Vitals budgets (LCP < 2.5s, CLS < 0.1, INP < 200ms) for marketing pages.

Justification: Clean technical foundations improve crawlability, snippet quality, and rankings.

Educational note: Schema doesn’t guarantee rich results but increases eligibility; keep it consistent with visible content.

3) Information Architecture & Templates
- Pages per Production Plan: `/`, `/pricing`, `/for-students`, `/for-teachers`, `/research`, `/blog`, `/sample-quiz`, `/privacy`, `/terms`, `/contact`.
- Templates to create (content system)
  - Research Summary Template (for `/research`)
    - Title (plain language), 1‑paragraph abstract, 3–5 “How to apply”, 2–3 key citations with outbound links, short glossary.
  - Blog Article Template (1,500–2,000 words)
    - H1, intro hook, table of contents, H2/H3 sections, visuals, “Try a sample quiz” CTA, “References”, author bio.
  - YouTube Explainer Script Template (4–6 minutes)
    - Hook (10s), What/Why, How to apply, quick demo or example, CTA; B‑roll notes and on‑screen text.

Justification: Templates enforce consistency and speed; they reduce cognitive load for writers and editors.

Educational note: Write outlines before drafts. Outlines align intent, scope, and CTA placement.

---

## SEO Content Engine (Pillar–Cluster)

1) Keyword Research & Clustering (Week 1–2)
- Seed topics: testing effect, spacing effect, interleaving, pre‑testing, retrieval practice, study strategies, quiz templates.
- Tools: Ahrefs/SEMRush/KeywordsEverywhere + GSC after baseline indexing.
- Process
  - Gather 200–300 keywords; classify by intent.
  - Cluster into pillars (pillar ≈ broad topic) and clusters (supporting subtopics answering specific questions).
  - Prioritize by business relevance (teacher problems), difficulty, and search volume.

Justification: Pillar–cluster strengthens topical authority and internal linking.

Educational note: Long‑tail keywords (“how to quiz after reading”) convert better than trophy terms early on.

2) Pillars & Example Clusters
- Pillar: Testing Effect (Retrieval Practice)
  - Clusters: “testing effect explained”, “retrieval practice vs rereading”, “pre‑testing benefits”, “how to add quick quizzes to readings”.
- Pillar: Spacing & Interleaving
  - Clusters: “spacing effect schedule”, “interleaving examples for STEM”, “spaced retrieval plan for a semester”.
- Pillar: Teacher Workflows
  - Clusters: “quiz templates for teachers”, “generate quizzes from PDFs/notes”, “assign in under 2 minutes”.

3) Content Cadence
- Ship 1 pillar guide (2,000+ words) within first 30 days, then 1 cluster post per week for 6–8 weeks.
- Each article includes: internal links to pillar and related clusters, embedded YT (if available), a sample quiz CTA, and a short checklist.

4) On‑Page SEO Checklist (apply to every article)
- Title tag ≤ 60 chars with primary keyword; compelling but not click‑bait.
- H1 matches intent; H2/H3 structure answers questions clearly.
- Meta description 140–160 chars with value proposition and keyword.
- Schema: Article + FAQ (for Q&A sections).
- Images: descriptive filenames, `alt` text, compressed; add captions where useful.
- Internal links: 3–5 links to related articles; 1–2 links to Research hub; 1 link to `/sample-quiz`.
- Outbound links: cite reputable sources (journals, university sites, foundational posts).

Educational note: Write for users first. If a sentence helps a reader take action, it usually helps SEO.

---

## Research Hub Implementation (`/research`)

1) Structure
- Index page lists four core summaries: Testing Effect, Spacing, Interleaving, Pre‑testing.
- Each summary page structure
  - What it is (100–150 words)
  - Why it matters (student + teacher view)
  - How to apply (3–5 bullets with class/study examples)
  - References (2–4 links to papers; use DOIs where possible)
  - Related articles (auto list from blog cluster)

2) Execution Steps (Week 0–2)
- Draft and publish 4 summaries; review with an expert if available.
- Add internal links from Home, `/for-teachers`, and 2 blog articles.
- Implement `BreadcrumbList` and `Article` schema; ensure canonical URLs.

Justification: The hub is our credibility anchor and natural link magnet.

Educational note: Keep language plain; add “how to apply” so research feels actionable, not academic.

---

## Product‑Led Touchpoints

1) Sample Quiz (`/sample-quiz`)
- Experience: No login; 1–2 minute micro‑quiz; end screen highlights streaks and “assign to a class” for teachers.
- CTA: “Save your progress” (students) and “Assign this template” (teachers).
- UTM: Tag CTAs from articles to track content→quiz flow.

2) Inline CTAs
- Mid‑article box: “Try a sample quiz on this topic (2 minutes)” with context‑matching template.
- End‑of‑article: “Assign this to your class in under 2 minutes.”

Justification: Product exposure during content consumption increases conversion to activation.

Educational note: Match CTA to reader intent. Informational intent → Sample quiz; commercial intent → Assign/Generate.

---

## YouTube Explainers (Secondary Channel)

1) Topics (launched in parallel with pillar content)
- “What is the Testing Effect?” (embed in pillar)
- “Spacing vs Cramming: a 3‑minute plan for your class”
- “How to generate a quiz from your reading in minutes” (light product demo)

2) Production Pipeline
- Script outline → record voiceover + simple slides/screen capture → light edits → upload to YT → embed in article.
- Optimize on YT: keyword‑rich title/description, chapters, end screens pointing to site.

3) Implementation Notes
- Add `VideoObject` schema on pages with embeds; ensure lazy‑loading to protect LCP.
- Keep to 4–6 minutes; prioritize clarity over polish.

Justification: Video increases dwell time and helps capture different learning preferences; embeds support SEO.

Educational note: Good audio > fancy visuals. Use a USB mic and quiet room.

---

## Brand‑Only Google Ads (Protective)

1) Setup (Week 0–1)
- Campaign: Search → Exact match keywords for brand and common misspellings.
- Ads: 2–3 RSA variants; sitelinks to `/pricing`, `/sample-quiz`, `/research`.
- Budget: Small daily cap (e.g., $5–$15/day) just to protect brand terms; add negatives to avoid generic study keywords.

2) Measurement
- Track `view_home`, `cta_try_sample_quiz`, and brand conversions separately in GA4; label with `utm_campaign=brand-protect`.

Justification: Prevent competitors from capturing high‑intent navigational queries; low cost, high control.

Educational note: Pause brand when you consistently own top organic with high CTR and no competitor hijacking. Re‑enable during promos.

---

## Internal Linking & Link Earning

1) Internal Linking Rules
- From every new article, link to: its pillar, 2 related clusters, and `/research`.
- From pillar, link out to all clusters and 2 cross‑pillars.
- From `/for-teachers`, link to workflow posts and the Sample Quiz.

2) Ethical Link Earning (Week 3–6)
- Outreach to Teaching & Learning centers: share the Research hub; offer a short guide or webinar; request inclusion on resource pages.
- Guest contributions: short evidence‑backed posts on department blogs; include author bio with link.
- EDU partnerships: offer semester‑long pilot with testimonial exchange; secure case‑study links.

Justification: Relevant, editorial links from EDU/department pages are high‑quality signals and referral sources.

Educational note: Avoid paid link schemes. Focus on usefulness and credible references.

---

## Editorial Workflow & Quality Bar

Roles
- PMM: topic selection, briefs, final approval.
- Content: research, draft, optimize, publish.
- Design: diagrams, thumbnails, visuals.
- Dev: schema, sitemap updates, performance checks.
- Analytics: dashboard upkeep, QA events.

Workflow (each piece)
1) Brief: intent, target queries, outline, primary CTA, internal links.
2) Draft: use templates; add references; add visuals.
3) SEO pass: titles, meta, schema, internal/external links.
4) Review: fact check; style; accessibility; tone.
5) Publish: add to sitemap; test on mobile; capture baseline in GSC.
6) Distribute: newsletter send; post to relevant communities sparingly.
7) Measure: 7/14/28‑day performance; iterate headline/snippet; add FAQ if needed.

Quality Standards
- Evidence‑based; cite sources. Plain language. Actionable “how to apply”.
- Readability target: Grade 8–10 for general posts; higher okay for research pages.
- Accessibility: descriptive alt text, color contrast, headings in order.

Educational note: Ship small improvements fast. Headlines, intros, and CTAs often drive the biggest gains.

---

## Measurement & Dashboards (GA4 + GSC)

1) GA4 Configuration
- Events (per Production Plan); ensure marketing pages trigger `view_*` events.
- Content Grouping: set page path → group mapping to analyze by section.
- Conversions: `cta_try_sample_quiz`, `signup_google`, `subscription_started`.
- UTMs: Standardize taxonomy
  - `utm_source` (google, youtube, newsletter, referral)
  - `utm_medium` (organic, cpc, video, email, social)
  - `utm_campaign` (pillar‑name, brand‑protect, webinar‑YYYYMM)
  - `utm_content` (post‑slug, video‑id)

2) Dashboards
- Acquisition: sessions by channel, new users, CTR (from GSC), top landing pages.
- Content: article performance (views, avg engagement time, scroll depth proxy), CTA click‑through rate, Sample Quiz starts.
- Conversion: teacher checklist completions, class invite sent, Pro starts.
- SEO: indexed pages, impressions, average position, clicks, brand vs non‑brand.

3) Cadence
- Weekly: review top 10 pages; 3 actions (title test, add FAQ, internal link update).
- Monthly: cohort analysis; publish a “what we learned” internal memo; refresh one article.

Educational note: Treat every piece as a mini product with a lifecycle: launch → learn → improve → maintain.

---

## Risks & Mitigations

- Slow early SEO growth
  - Mitigation: leverage pilots/webinars for seed traffic; strong internal linking; submit updated sitemaps.
- Thin or generic content
  - Mitigation: prioritize original examples, templates, and data; embed product demo snippets.
- Performance regressions from embeds
  - Mitigation: lazy load videos, compress images, measure CWV on publish.
- Over‑reliance on a single topic
  - Mitigation: maintain two pillars in parallel; diversify with teacher workflow content.

---

## Checklists

Launch Foundations
- [ ] GA4 events verified on marketing pages
- [ ] Domain verified in GSC; sitemap submitted
- [ ] Robots and canonicals correct
- [ ] Article/FAQ/Breadcrumb schema live
- [ ] Research hub: 4 summaries published
- [ ] Brand search campaign running
- [ ] Sample Quiz page live with GA4 conversion

Pre‑Publish (every article)
- [ ] Brief approved with intent + keywords
- [ ] H1/H2 outline answers core questions
- [ ] Title/meta meet length and clarity
- [ ] Internal links added; outbound citations present
- [ ] Images optimized with alt text
- [ ] CTA matched to intent; UTM set
- [ ] Schema validated (Rich Results Test)

Post‑Publish
- [ ] Test mobile and desktop CWV
- [ ] Add to sitemap; fetch in GSC
- [ ] Add to 1 pillar + 2 related posts
- [ ] Review in 7/14/28 days; iterate headline/snippet as needed

---

## Educational Notes for Junior Managers (Quick Glossary)

- Search Intent: The “why” behind a query. Align content and CTA to it.
- E‑E‑A‑T: Experience, Expertise, Authoritativeness, Trustworthiness. Demonstrate via citations, bios, and transparent claims.
- Pillar–Cluster: One broad page (pillar) supported by several focused articles (clusters). Helps topical authority and internal linking.
- Canonical: Tag that tells search engines the preferred URL to index when duplicates exist.
- Schema/Structured Data: Machine‑readable JSON‑LD to help search engines understand content and qualify for rich results.
- Core Web Vitals: Performance metrics affecting UX and rankings; optimize LCP, CLS, INP.
- UTM Parameters: Tags in URLs to attribute traffic source/medium/campaign in analytics.

---

## Implementation Ownership & Handoffs

- PMM: Own roadmap, briefs, pillar prioritization, and approval.
- Content: Draft and ship cadence; keep quality bar; maintain editorial calendar.
- Design: Visuals, diagrams, thumbnails; ensure accessibility.
- Dev: Templates, schema, sitemap, performance; implement `/sample-quiz` flow.
- Analytics: GA4/GSC setup, dashboards, data QA.
- Partnerships: Pilot outreach to T&L centers; case studies; link earning.

---

## Appendices

Appendix A — Sample Keyword Seeds
- “testing effect explained”, “retrieval practice benefits”, “pre‑testing effect”, “spaced repetition schedule”, “interleaving examples”, “quiz templates for teachers”, “generate quiz from notes”, “quiz from PDF”.

Appendix B — Example YouTube Script Outline
- Hook: “Want students to remember more in 3 minutes?”
- What: Testing effect in plain language.
- Why: Better retention than rereading; quick class use.
- How: Show generating a 3‑question quiz from notes.
- CTA: “Try a sample quiz” (link in description) + end card.

Appendix C — UTM Taxonomy Examples
- Article → Sample Quiz: `?utm_source=google&utm_medium=organic&utm_campaign=testing-effect-pillar&utm_content=post-slug`
- YouTube → Site: `?utm_source=youtube&utm_medium=video&utm_campaign=spacing-explainer&utm_content=video-id`

