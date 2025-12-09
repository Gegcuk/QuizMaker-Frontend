import React from 'react';
import { ArticleData } from '../types';

export const retrievalPracticeArticle: ArticleData = {
  slug: 'retrieval-practice-template',
  title: 'Retrieval Practice Article Template that Drives Quiz Starts',
  description:
    'Use this research-backed outline to explain the testing effect, show how to apply it in university courses or school classes, and nudge readers into a sample quiz or their first assignment.',
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
      value: '+10–14 pp',
      detail:
        'Classroom quizzing with feedback: short-answer exam 81% vs 68% (Δ +13 pp). Lab free-recall after 1 week: 56% vs 42% (Δ +14 pp).',
      link: 'https://pdf.retrievalpractice.org/guide/McDermott_etal_2014_JEPA.pdf',
    },
    {
      label: 'Effect size (meta)',
      value: 'g = 0.50–0.67',
      detail:
        'Overall across studies g≈0.50; in classroom studies g≈0.67. With corrective feedback, effects climb to ~0.73 SD.',
      link: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6288371/',
    },
    {
      label: 'Pre-test boost',
      value: '+7–9 pp',
      detail:
        'Single prequestion at the start of lectures: +7 pp on immediate posttest; across a 10-week course: +8–9 pp on the final exam (no feedback).',
      link: 'https://link.springer.com/article/10.1007/s10648-023-09814-5',
    },
    {
      label: 'Spacing rule',
      value: '10–20%',
      detail:
        'Optimal gap ≈10–20% of the desired retention interval (e.g., learn → test in 30 days ⇒ review after ~3–6 days).',
      link: 'https://files.eric.ed.gov/fulltext/ED536925.pdf',
    },
  ],
  keyPoints: [
    'Use a 1–3 item pre-quiz and a 4–6 item post-quiz; both low-stakes and fast (<5 min).',
    'Show corrective feedback; testing with feedback roughly doubles benefits vs no feedback in several syntheses.',
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
            Retrieval beats re-reading. In middle/high-school classes, quizzed content outperformed restudied or
            non-quizzed content on end-unit exams by <strong>10–13 percentage points</strong> (e.g., 81% vs 68%){' '}
            <a href="https://pdf.retrievalpractice.org/guide/McDermott_etal_2014_JEPA.pdf" target="_blank" rel="noopener">
              McDermott et&nbsp;al., 2014
            </a>
            . In lab free-recall a week later, tested items hit <strong>56%</strong> vs <strong>42%</strong> after
            restudy{' '}
            <a
              href="https://doi.org/10.1037/0033-295X.114.2.193"
              target="_blank"
              rel="noopener"
            >
              Roediger &amp; Karpicke, 2006
            </a>
            .
          </p>
          <p>
            Meta-analyses converge on large impacts: overall <strong>g≈0.50</strong>{' '}
            <a
              href="https://courseware.epfl.ch/assets/courseware/v1/fdde2f0aa590bf3b1324077a6bf1540c/asset-v1%3AEPFL%2BDEMO%2B2020%2Btype%40asset%2Bblock/Rowland2014-meta-analysis.pdf"
              target="_blank"
              rel="noopener"
            >
              Rowland, 2014
            </a>
            ; classroom studies <strong>g≈0.67</strong>{' '}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6288371/" target="_blank" rel="noopener">
              Greving et&nbsp;al., 2018 (summarising Adesope et&nbsp;al., 2017)
            </a>
            . With corrective feedback, effects rise toward <strong>~0.73 SD</strong>{' '}
            <a
              href="https://journals.sagepub.com/doi/10.1177/1475725717695149"
              target="_blank"
              rel="noopener"
            >
              Schwieren et&nbsp;al., 2017
            </a>
            .
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Feedback matters.</strong> Correct-answer feedback boosts gains vs. no feedback (multiple meta-analyses).
            </li>
            <li>
              <strong>MCQ works.</strong> With feedback, multiple-choice quizzing performs on par with short-answer for later exams{' '}
              <a href="https://pdf.retrievalpractice.org/guide/McDermott_etal_2014_JEPA.pdf" target="_blank" rel="noopener">
                McDermott et&nbsp;al., 2014
              </a>
              .
            </li>
            <li>
              <strong>Spacing rules.</strong> For durable memory, set review gaps ≈<strong>10–20%</strong> of your target retention
              interval{' '}
              <a href="https://files.eric.ed.gov/fulltext/ED536925.pdf" target="_blank" rel="noopener">
                Carpenter et&nbsp;al., 2012
              </a>
              .
            </li>
          </ul>
          <p className="mt-2">
            Pre-testing (a quick quiz <em>before</em> the lesson) adds modest but real gains: +<strong>7 pp</strong> on immediate
            post-tests and <strong>+8–9 pp</strong> on high-stakes finals even without feedback{' '}
            <a href="https://link.springer.com/article/10.1007/s10648-023-09814-5" target="_blank" rel="noopener">
              Pan &amp; colleagues, 2023 review
            </a>
            . In-class end-of-lesson questions were remembered <strong>~30% better</strong> on later weekly quizzes than material that
            wasn’t quizzed{' '}
            <a
              href="https://cognitiveresearchjournal.springeropen.com/articles/10.1186/s41235-017-0078-z"
              target="_blank"
              rel="noopener"
            >
              Geller et&nbsp;al., 2017
            </a>
            .
          </p>
        </>
      ),
    },
    {
      id: 'on-page-structure',
      title: 'Structure this article for search and action',
      summary: 'A reusable outline that satisfies intent and nudges readers into the product.',
      content: (
        <>
          <ol>
            <li>Hook + TL;DR with one headline number (e.g., “+10–13 pp on exams when quizzed with feedback”).</li>
            <li>Define testing effect + pre-testing in plain language with 1–2 quick analogies.</li>
            <li>How to apply this week: 1–3 pre-items → lesson → 4–6 post-items with feedback.</li>
            <li>
              Timing: immediate post-quiz; then space reviews using the <strong>10–20%</strong> rule (e.g., 2 days → 2–4 hr gap; 30 days → 3–6 day gap){' '}
              <a href="https://files.eric.ed.gov/fulltext/ED536925.pdf" target="_blank" rel="noopener">
                source
              </a>
              .
            </li>
            <li>CTA: “Try a sample quiz on this topic (2 minutes)” with UTM to GA4.</li>
            <li>References: 2–4 outbound citations to journals/university pages (avoid blogs).</li>
            <li>FAQ: “How many questions?”, “Does MCQ work?”, “Is this graded?”, “How to schedule repeats?”</li>
          </ol>
          <p className="text-theme-text-secondary">
            Keep the tone grade-8–10 and show exactly how to run the sequence in your product: pre-quiz → lesson → post-quiz
            with feedback → spaced follow-up. Clear workflow = higher first-quiz starts.
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
              Mid-article CTA: contextual “Try a sample quiz (2 minutes)” that fires{' '}
              <code className="ml-1 rounded bg-theme-bg-tertiary px-1 py-0.5 text-xs">cta_try_sample_quiz</code>.
            </li>
            <li>End CTA: “Assign this to your class” → login/assignment flow; tag with UTM for content segmentation.</li>
            <li>Track page views with content_group=blog to separate from app traffic.</li>
            <li>Treat <code>quiz_started</code> as the primary conversion; add engaged-time/scroll as micro KPIs early on.</li>
          </ul>
          <p>Match CTAs to intent: information-seekers → sample quiz; ready-to-act teachers → assign/import.</p>
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
              Add <strong>Article</strong> + <strong>FAQPage</strong> schema; include breadcrumbs to expose the blog hierarchy.
            </li>
            <li>
              Internal links: pillar ↔ clusters ↔ research hub. Every post links to the sample quiz + ≥2 related posts.
            </li>
            <li>
              Outbound links: cite journals/university domains to reinforce E-E-A-T (see links above).
            </li>
            <li>Accessibility: correct heading order, descriptive alt text, high-contrast buttons, focus states on CTAs.</li>
          </ul>
        </>
      ),
    },
  ],
  faqs: [
    {
      question: 'How many questions should I use?',
      answer:
        'Pre-test: 1–3 items. Post-lesson: 4–6 items with corrective feedback. Classroom studies show gains with as little as one in-class question and weekly 10–20 item reviews.',
    },
    {
      question: 'Do multiple-choice questions help real learning?',
      answer:
        'Yes. With feedback, MCQ quizzing matched short-answer on later exams in secondary classrooms; format-matching is not required for the benefit.',
    },
    {
      question: 'How often should I repeat questions?',
      answer:
        'Right after learning (same-day), then schedule reviews using the 10–20% rule of your desired retention window (e.g., for a 30-day goal, review after ~3–6 days, then again at ~2–3 weeks).',
    },
    {
      question: 'What should I track in GA4?',
      answer:
        'Track page_view (content_group=blog), CTA clicks (cta_try_sample_quiz), and quiz_started/quiz_completed. Attribute downstream activations to content using UTMs.',
    },
  ],
  references: [
    {
      title: 'McDermott, Agarwal, D\'Antonio et al. (2014) Classroom retrieval practice boosts exam scores',
      url: 'https://pdf.retrievalpractice.org/guide/McDermott_etal_2014_JEPA.pdf',
      sourceType: 'journal',
    },
    {
      title: 'Roediger & Karpicke (2006) Test-enhanced learning',
      url: 'https://doi.org/10.1037/0033-295X.114.2.193',
      sourceType: 'journal',
    },
    {
      title: 'Rowland (2014) The effect of testing versus restudy: A meta-analysis',
      url: 'https://courseware.epfl.ch/assets/courseware/v1/fdde2f0aa590bf3b1324077a6bf1540c/asset-v1%3AEPFL%2BDEMO%2B2020%2Btype%40asset%2Bblock/Rowland2014-meta-analysis.pdf',
      sourceType: 'meta-analysis',
    },
    {
      title: 'Greving et al. (2018) Retrieval practice in classrooms: A synthesis',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6288371/',
      sourceType: 'journal',
    },
    {
      title: 'Carpenter, Cepeda, Rohrer et al. (2012) Spacing instruction improves retention',
      url: 'https://files.eric.ed.gov/fulltext/ED536925.pdf',
      sourceType: 'report',
    },
    {
      title: 'Pan et al. (2023) Prequestioning and pretesting: A review',
      url: 'https://link.springer.com/article/10.1007/s10648-023-09814-5',
      sourceType: 'journal',
    },
    {
      title: 'Geller et al. (2017) Retrieval practice in live classrooms',
      url: 'https://cognitiveresearchjournal.springeropen.com/articles/10.1186/s41235-017-0078-z',
      sourceType: 'journal',
    },
  ],
};
