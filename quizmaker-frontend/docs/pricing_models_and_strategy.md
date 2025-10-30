# Quizzence Pricing Models & Strategy

This document outlines pricing models suitable for Quizzence, with rationale grounded in the current education market, our product’s positioning, and cost/usage dynamics. It complements the production readiness plan and proposes a phased rollout that preserves simplicity at launch while creating headroom for institutional revenue.

## Objectives & Constraints

- Optimize for teacher-led adoption while remaining student-friendly.
- Keep launch simple (one clear Pro plan), but pave a path to Teams/Institution.
- Align to academic cycles (semester-based usage and budget rhythms).
- Protect margins against variable AI generation costs and seasonal usage spikes.
- Maintain credibility with research-backed value messaging and transparent limits.

## Market Landscape (snapshot)

- Patterns: Edtech tools (Kahoot, Quizizz, Quizlet) commonly use freemium + Pro tiers; institutional buyers prefer annual invoices and compliance addenda; teachers have modest discretionary budgets; students are cost-sensitive.
- Willingness to pay: Individual teachers often accept $5–$15/month for productivity and analytics; small departments pay low hundreds per month; campus licenses priced annually by FTE or seats.
- Adoption reality: Fast, self-serve trials convert best when first value is delivered in minutes (aligned with our activation flow).

## Monetization Pillars

- Packaging: Free for evaluation and casual student use; Pro for teachers and power users; optional Teams/Institution later.
- Metering: Limit free usage by “active quizzes” and “plays per month” to contain cost and encourage upgrade.
- AI cost control: Credit bundles/add-ons to keep heavy generation sustainable without penalizing light users.
- Academic alignment: Semester bundles for teachers who dislike continuous subscriptions.

---

## Model A — Freemium + Single Pro (Self‑Serve)

Recommended default at launch (matches production plan) with minor guardrail refinements.

- Free (teachers + students)
  - Includes: take quizzes, sample content, limited quiz creation, basic sharing.
  - Guardrails: up to 3 active quizzes per teacher, 100 plays/month across classes, 10 AI generations/month.
  - Justification: Ensures fast time-to-value while containing infra/AI costs and creating upgrade pressure via clear, honest limits.

- Pro (teachers and power students)
  - Price: $12/month or $96/year. Student discount: 50% with .edu/ID verification.
  - Includes: unlimited quiz generation/imports, class invites, analytics, exports, priority support, basic custom branding.
  - Justification: Transparent, single-step upgrade that aligns with comparable tools and our value (time-saving generation + measurable engagement).

Notes
- Keep the pricing page focused on a single decision: Free vs Pro; defer other choices for later (reduces cognitive load and churn risk).
- Publish limits clearly to avoid support burden.

---

## Model B — Tiered for Teachers (Good/Better/Best)

Alternative once we need higher ARPU and better team collaboration packaging. Not required at launch; introduce after Pro shows pull.

- Starter (Free): as above.
- Pro (Better): $12/month or $96/year.
- Team (Best): $149/month billed monthly or $1,490/year; includes 5 teacher seats, shared templates, team analytics, centralized class roster sync; $19/month per additional seat.

Justification
- Mirrors market expectations (Kahoot/Quizizz/Typeform-style tiers) while anchoring value above individual Pro.
- Team plan unlocks departmental budgets without enterprise overhead.

---

## Model C — Usage‑Based by Active Students (Hybrid)

Add a usage component for classes that exceed inclusive limits. Use as an add-on to Pro/Team, not as the sole model.

- Meter: Monthly Active Students (MAS) across assigned quizzes.
- Inclusive: Pro includes up to 100 MAS; Team includes up to 1,000 MAS.
- Overages: $0.20 per MAS beyond inclusive allowance (billed monthly, with soft caps and alerts).

Justification
- Fairness: Small classes don’t subsidize very large ones.
- Predictability: Inclusive allowances reduce bill shock; soft alerts prevent surprise invoices.
- Cost control: Ties revenue to scale of usage and inference/email costs.

Risks & Mitigations
- Complexity: Keep usage invisible until close to limits; show a simple “Students active this month” meter.
- Procurement: For institutions, prefer seat/FTE over pure usage.

---

## Model D — Semester/Class‑Based Bundles

Tailored to academic rhythms; great for teachers averse to subscriptions.

- Per‑Class Semester Pass: $29 per class per semester for unlimited quizzes and plays for that class.
- Teacher Semester Unlimited: $59 per semester covers all classes for one teacher.

Justification
- Budget fit: Easy to expense and time‑boxed to course duration.
- Conversion: Low‑friction option for hesitant buyers; cross‑sell to annual Pro mid‑semester.

Implementation
- Stripe products for Fall/Spring/Summer with start/end dates; auto‑pause at semester end and prompt renewal.

---

## Model E — AI Generation Credits (Add‑Ons)

Keep base plans generous but monetize heavy generation cleanly.

- Definition: 1 credit = 1 quiz generation from source material (reasonable token budget envelope per generation).
- Base: Free includes 10 credits/month; Pro includes 300 credits/month; Team includes 3,000 credits/month.
- Add‑ons: $8 for 300 credits, $25 for 1,200 credits, $80 for 5,000 credits.

Justification
- Cost containment: Separates heavy content creators from typical users.
- Transparency: Users understand “per quiz generated” better than token counts.

Operational Note
- Implement soft caps with “queue until next month” or “purchase more credits” prompt to avoid blocking flows mid‑class.

---

## Model F — Department & Campus (Enterprise)

Enable institutional deals with straightforward packaging and procurement paths.

- Department Plan: $2,500/year for up to 25 teacher seats, 5,000 MAS, SSO (optional), admin analytics, priority support, DPIA/security pack.
- Campus License: Priced by FTE bands (e.g., up to 5k FTE: $12k/year; 5k–15k FTE: $20k/year; >15k: custom). Includes unlimited seats within policy, enterprise support, data export, and LMS integration roadmap.

Justification
- Procurement reality: Annual invoice, centralized admin, and compliance are table stakes for institutions.
- Economics: Predictable ARR with low per-seat effective pricing supports wide distribution and case studies.

Rollout
- Only after documented departmental pull and 2–3 successful pilots (as per production plan).

---

## Recommended Rollout (Pragmatic Path)

Phase 1 — Launch (0–90 days)
- Ship Model A (Free + Pro at $12/mo or $96/yr) with student 50% discount.
- Enforce transparent free limits and include modest Pro AI credits.
- Add a single AI credit add‑on pack ($8 for 300) to handle edge cases.

Phase 2 — Early Scale (90–180 days)
- Introduce Semester/Class bundles (Model D) and a light usage‑based overage for MAS on Pro (Model C).
- Offer Team plan privately to interested departments (beta pricing: $149/mo for 5 seats).

Phase 3 — Institutionalization (180–360 days)
- Public Team plan, Department plan SKU, and Campus pricing on request.
- Formalize security pack, DPIA, SOC 2 roadmap note, and invoice flow.

---

## Price Points Summary (Initial Settings)

- Free
  - 3 active quizzes, 100 plays/mo, 10 AI credits/mo.
- Pro
  - $12/mo or $96/yr; 300 AI credits/mo; 100 MAS included; overage $0.20/MAS.
- Team (post-launch)
  - $149/mo (5 seats) or $1,490/yr; $19/additional seat; 3,000 AI credits/mo; 1,000 MAS included.
- Semester/Class
  - $29/class/semester (unlimited for that class) or $59/teacher/semester (all classes).
- AI Add‑Ons
  - $8/300 credits, $25/1,200, $80/5,000.
- Institution
  - Department: $2,500/yr (25 seats). Campus: FTE‑banded ($12k+).

Notes
- Keep “.edu” student discount at 50%. Consider faculty verification for discounted Pro if needed.
- Annual = ~2 months free vs monthly.

---

## Justifications by Dimension

- Simplicity at Launch
  - One Pro plan reduces friction, aligns with our activation goals, and fits the website IA in the production plan.

- Guardrails on Free
  - Clearly stated limits prevent AI/infra overuse while letting users succeed. Honest constraints raise trust and conversion.

- Academic Rhythm
  - Semester SKUs map to purchasing habits and planning cycles, preventing churn during off months and supporting reactivation each term.

- Usage Fairness
  - MAS overage ensures large classes contribute proportionally without penalizing typical small classes.

- Institutional Readiness
  - Department/Campus tiers introduce admin controls and support to match procurement needs and unlock larger contracts.

---

## Experiments & Measurement

- Pricing A/B
  - Test Pro annual price anchors: $96 vs $108 with 10% additional credits.
  - Test Pro monthly $12 vs $14 with extra AI credits.

- Packaging Tests
  - Toggle MAS inclusion from 100 → 150 for Pro and measure conversion vs margin.
  - Trial a limited‑time Semester Pass banner during enrollment periods.

- Metrics to Track
  - Free → Pro conversion rate, Pro churn, MAS distribution, AI credit attach rate, ARPA/ARPU, gross margin by cohort, refund rate (<3% target).

---

## Operational Considerations

- Billing: Stripe for self‑serve; invoices for Department/Campus. Auto‑proration and seat management for Team.
- Tax/VAT: Collect where required (EU VAT, UK VAT), show tax‑inclusive prices when mandated.
- Verification: Student discounts via .edu domain or ID verification provider; consider faculty verification for educator discounts.
- Communication: Clear limit meters (active quizzes, plays, MAS, AI credits) and proactive in‑app alerts.
- Grandfathering: Honor legacy price/features for 12 months; communicate changes 30 days in advance.

---

## Final Recommendation

Launch with Model A (Free + Pro) exactly as in the production plan, adding explicit free limits and a small AI credit add‑on for cost control. Introduce Semester/Class bundles and light MAS overage in Phase 2 to capture varied willingness to pay without complicating the initial decision. As pull from departments emerges, ship Team and then Department/Campus packages with minimal sales overhead. This sequence balances clarity, margin protection, and scalable revenue.

