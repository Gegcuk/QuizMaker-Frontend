import React from 'react';
import { ArticleData } from '../types';

export const retrievalPracticeArticle: ArticleData = {
  slug: 'retrieval-practice-template',
  title: 'Retrieval Practice Article Template that Drives Quiz Starts',
  description:
    'Use this research-backed outline to explain the testing effect, show how to apply it, and nudge readers into a sample quiz or their first class assignment.',
  heroKicker: 'Evidence-backed',
  author: { name: 'Quizzence Team', title: 'Learning science & product' },
  publishedAt: '2024-12-10',
  updatedAt: '2025-02-21',
  readingTime: '8 minute read',
  tags: ['Retrieval practice', 'Pre-testing', 'Teaching tips', 'SEO template'],
  primaryCta: {
    label: 'Try a sample quiz (2 minutes)',
    href: '/register?intent=sample-quiz',
    eventName: 'cta_try_sample_quiz',
  },
  secondaryCta: {
    label: 'Log in to build this flow',
    href: '/login',
  },
  stats: [
    {
      label: 'Retention lift',
      value: '30%+',
      detail: 'Students who quiz after studying score ~30% higher than those who reread the same material.',
    },
    {
      label: 'Effect size',
      value: '~0.7',
      detail: 'Meta-analyses show the testing effect delivers a large effect size (~0.5–0.7) across subjects.',
    },
    {
      label: 'Pre-test boost',
      value: '+8–10%',
      detail: 'Short pre-quizzes raise final scores on target and related items by ~8–10% when followed by feedback.',
    },
  ],
  keyPoints: [
    'Pair a 2–3 item pre-quiz with a slightly longer post-quiz; both stay low-stakes.',
    'Deliver immediate feedback so errors get corrected (hypercorrection effect) instead of memorised.',
    'Reuse the same CTA twice: mid-article (contextual sample quiz) and at the end (assign/import flow).',
  ],
  checklist: [
    'Title tag ≤60 chars with a single primary keyword (e.g., “retrieval practice quiz template”).',
    'Add self-referencing canonical and include the URL in the sitemap.',
    'Embed an internal link to your sample quiz and one to the research hub.',
    'Add Article + FAQ schema; include 2–3 outbound citations to journals/universities.',
    'Compress/async-load media so LCP stays under 2.5s on mobile.',
  ],
  sections: [
    {
      id: 'research',
      title: 'Evidence in plain English',
      summary: 'What the testing effect and pre-testing show in classrooms and labs.',
      content: (
        <>
          <p>
            More than a century of studies show that active recall beats re-reading. When learners take a quick quiz
            after studying, their final performance jumps (often 30%+). Meta-analyses report large effect sizes (~0.7),
            meaning retrieval practice moves a typical student from the 50th to roughly the 76th percentile.
          </p>
          <p>
            Pre-testing is newer but promising: short, low-stakes pre-questions raise final scores on the same items and
            related concepts by ~8–10%. The mechanism is simple: prediction primes attention, exposes knowledge gaps,
            and sparks curiosity so the subsequent lesson “sticks”.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Immediate feedback matters: it corrects errors and improves transfer, not just fact recall.</li>
            <li>Multiple-choice works when feedback is present; it is not inferior to short-answer for learning.</li>
            <li>Spacing retrieval attempts across days/weeks outperforms a single cram session.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'on-page-structure',
      title: 'Structure this article for search and action',
      summary: 'A reusable outline that satisfies intent and nudges readers into the product.',
      content: (
        <>
          <ol className="list-decimal list-inside space-y-2">
            <li>Hook + TL;DR (why retrieval beats re-reading; show the 30% lift stat).</li>
            <li>What it is (testing effect + pre-testing) in plain language with 1–2 short analogies.</li>
            <li>How to apply it this week: a 2–3 question pre-quiz + 5 question post-quiz + feedback toggle.</li>
            <li>Timing guide: same-day quiz, then 72-hour revisit; include a simple schedule table.</li>
            <li>CTA: “Try a sample quiz on this topic (2 minutes)” with UTM to GA4.</li>
            <li>References: 2–4 outbound citations to journals/universities.</li>
            <li>FAQ block that answers “Does multiple choice work?”, “How many questions?”, “Is this graded?”</li>
          </ol>
          <p className="text-theme-text-secondary">
            Keep the tone plain-language (grade 8–10) and show exactly how to run the sequence in your product:
            pre-quiz → lesson → post-quiz with feedback → spaced follow-up. The clearer the workflow, the better the
            conversion to a first attempt.
          </p>
        </>
      ),
    },
    {
      id: 'cta-and-analytics',
      title: 'CTA placement + analytics',
      summary: 'Where to place CTAs and how to measure them in GA4.',
      content: (
        <>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Mid-article CTA: contextual “Try a sample quiz on retrieval practice (2 minutes)” that fires
              <code className="ml-1 rounded bg-theme-bg-tertiary px-1 py-0.5 text-xs">cta_try_sample_quiz</code>.
            </li>
            <li>
              End-of-article CTA: “Assign this to your class” linking to login/assignment flow; add a UTM so GA4 can
              segment by content.
            </li>
            <li>Track page views with content_group=blog to separate from app traffic.</li>
            <li>
              Treat the sample quiz start as a conversion; add scroll-depth or engaged-time if you want a micro KPI while
              traffic is small.
            </li>
          </ul>
          <p>
            Keep CTAs aligned with intent: informational readers get the sample quiz; teachers ready to act get the
            assign/import option. Both should link to the same canonical article to avoid splitting signals.
          </p>
        </>
      ),
    },
    {
      id: 'schema-and-accessibility',
      title: 'Structured data, links, and accessibility',
      summary: 'Set up the article for rich results and easy navigation.',
      content: (
        <>
          <ul className="list-disc list-inside space-y-2">
            <li>
              Add <strong>Article</strong> + <strong>FAQPage</strong> schema; include breadcrumbs to expose the blog
              hierarchy.
            </li>
            <li>
              Internal links: pillar ↔ clusters ↔ research hub. Every post should link to the sample quiz and at least
              two related articles.
            </li>
            <li>
              Outbound links: cite journals or university sites to reinforce E-E-A-T; keep them relevant to the claims
              you make.
            </li>
            <li>
              Accessibility: heading order, descriptive alt text, and high-contrast buttons for CTAs so keyboard users
              can reach them easily.
            </li>
          </ul>
        </>
      ),
    },
  ],
  faqs: [
    {
      question: 'How long should the quizzes be?',
      answer: 'Use 2–3 questions for pre-testing and 4–6 for post-lesson retrieval. Keep them low-stakes and quick (<5 minutes).',
    },
    {
      question: 'Do multiple-choice questions still help with learning?',
      answer:
        'Yes. With feedback, MCQ performs on par with short-answer for retention. The key is requiring an initial retrieval attempt before showing options.',
    },
    {
      question: 'How often should I repeat questions?',
      answer:
        'Quiz immediately after learning, then again ~72 hours later. Revisit core items weekly for the first month to reinforce long-term memory.',
    },
    {
      question: 'What should I track in GA4?',
      answer:
        'Track page_view with content_group=blog, CTA clicks (cta_try_sample_quiz), and quiz_started / quiz_completed so you can attribute activations back to content.',
    },
  ],
};
