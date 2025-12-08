// src/features/analytics/contentGrouping.ts
// ---------------------------------------------------------------------------
// Maps paths to a GA4 Content Group so reports can be sliced by site section.
// ---------------------------------------------------------------------------

const rules: { pattern: RegExp; group: string }[] = [
  { pattern: /^\/$/, group: 'home' },
  { pattern: /^\/blog/i, group: 'blog' },
  { pattern: /^\/research/i, group: 'research' },
  { pattern: /^\/sample-quiz/i, group: 'sample-quiz' },
  { pattern: /^\/for-teachers/i, group: 'for-teachers' },
  { pattern: /^\/for-students/i, group: 'for-students' },
  { pattern: /^\/pricing/i, group: 'pricing' },
  { pattern: /^\/terms/i, group: 'legal' },
  { pattern: /^\/privacy/i, group: 'legal' },
  { pattern: /^\/(login|register|forgot-password|reset-password|verify-email|oauth)/i, group: 'auth' },
  {
    pattern: /^\/(quizzes|my-quizzes|my-attempts|categories|tags|questions|documents|profile|settings|billing|ai-analysis)/i,
    group: 'app',
  },
];

export const getContentGroup = (pathname: string) => {
  const match = rules.find(rule => rule.pattern.test(pathname));
  return match ? match.group : 'marketing';
};
