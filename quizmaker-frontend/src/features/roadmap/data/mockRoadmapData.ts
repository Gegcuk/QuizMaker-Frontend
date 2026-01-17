// src/features/roadmap/data/mockRoadmapData.ts
// ---------------------------------------------------------------------------
// Roadmap data based on ROADMAP.md
// Source: /docs/ROADMAP.md (as of 2026-01-09)
// ---------------------------------------------------------------------------

import { RoadmapFeature, RoadmapMilestone } from '../types/roadmap.types';

// Helper to determine status based on date
// Roadmap snapshot date: 2026-01-09
const getStatusFromDate = (targetDate: string): 'planned' | 'in-progress' | 'completed' => {
  const snapshotDate = new Date('2026-01-09');
  const target = new Date(targetDate);
  const monthDiff = (target.getFullYear() - snapshotDate.getFullYear()) * 12 + (target.getMonth() - snapshotDate.getMonth());
  
  if (monthDiff < 0) return 'completed';
  if (monthDiff === 0) return 'in-progress';
  return 'planned';
};

// Helper to extract category from feature description
const getCategory = (description: string): string => {
  const lower = description.toLowerCase();
  if (lower.includes('flashcard') || lower.includes('spaced repetition')) return 'Learning';
  if (lower.includes('ai') || lower.includes('generation')) return 'AI';
  if (lower.includes('import') || lower.includes('migration')) return 'Import';
  if (lower.includes('export') || lower.includes('pdf') || lower.includes('html')) return 'Export';
  if (lower.includes('markdown') || lower.includes('image')) return 'Content';
  if (lower.includes('question') || lower.includes('bulk')) return 'Questions';
  if (lower.includes('organization') || lower.includes('multi-tenant')) return 'Organizations';
  if (lower.includes('community') || lower.includes('bookmark') || lower.includes('rating')) return 'Community';
  if (lower.includes('analytics') || lower.includes('insights')) return 'Analytics';
  if (lower.includes('security') || lower.includes('permission')) return 'Security';
  if (lower.includes('login') || lower.includes('passwordless')) return 'Identity';
  if (lower.includes('notification')) return 'Notifications';
  if (lower.includes('audit') || lower.includes('observability') || lower.includes('configuration')) return 'Operations';
  return 'Platform';
};

// Helper to extract priority from description
const getPriority = (description: string): 'low' | 'medium' | 'high' | 'critical' => {
  const lower = description.toLowerCase();
  if (lower.includes('foundation') || lower.includes('core') || lower.includes('security')) return 'critical';
  if (lower.includes('ai') || lower.includes('generation') || lower.includes('flashcard')) return 'high';
  if (lower.includes('export') || lower.includes('import') || lower.includes('bulk')) return 'high';
  if (lower.includes('community') || lower.includes('buffer')) return 'low';
  return 'medium';
};

export const mockFeatures: RoadmapFeature[] = [
  // January 2026
  {
    id: 'jan-1',
    title: 'Import Quizzes',
    description: 'Import quizzes from other platforms or files. Preview before importing to ensure everything looks right.',
    status: getStatusFromDate('2026-01-31'),
    priority: getPriority('import'),
    quarter: 'Q1 2026',
    estimatedDate: '2026-01-31',
    category: getCategory('import'),
    tags: ['import', 'migration'],
    progress: getStatusFromDate('2026-01-31') === 'in-progress' ? 35 : undefined
  },
  {
    id: 'jan-2',
    title: 'Image-Based Questions',
    description: 'Image-based questions and answer options (upload/URL, validation, export).',
    status: 'completed',
    priority: 'high',
    quarter: 'Q1 2026',
    estimatedDate: '2026-01-31',
    category: 'Content',
    tags: ['images', 'questions', 'upload', 'validation'],
    progress: 100
  },
  // February 2026
  {
    id: 'feb-1',
    title: 'Flashcards and Spaced Repetition Core',
    description: 'Flashcards and spaced repetition core: decks, cards, review sessions, scheduling.',
    status: getStatusFromDate('2026-02-28'),
    priority: 'high',
    quarter: 'Q1 2026',
    estimatedDate: '2026-02-28',
    category: 'Learning',
    tags: ['flashcards', 'spaced-repetition', 'decks', 'scheduling'],
    progress: undefined
  },
  {
    id: 'feb-2',
    title: 'Markdown Authoring',
    description: 'Markdown authoring for questions and options (code blocks, accents).',
    status: getStatusFromDate('2026-02-28'),
    priority: 'high',
    quarter: 'Q1 2026',
    estimatedDate: '2026-02-28',
    category: 'Content',
    tags: ['markdown', 'authoring', 'code-blocks'],
    progress: undefined
  },
  // March 2026
  {
    id: 'mar-1',
    title: 'AI-Powered Generation from Multiple Sources',
    description: 'AI-powered generation from documents, links, audio, and video with job tracking and safety.',
    status: getStatusFromDate('2026-03-31'),
    priority: 'high',
    quarter: 'Q1 2026',
    estimatedDate: '2026-03-31',
    category: 'AI',
    tags: ['ai', 'generation', 'documents', 'audio', 'video', 'links']
  },
  // April 2026
  {
    id: 'apr-2',
    title: 'Generate More Questions for Existing Quiz',
    description: 'Generate more questions for an existing quiz with dedupe.',
    status: getStatusFromDate('2026-04-30'),
    priority: 'high',
    quarter: 'Q2 2026',
    estimatedDate: '2026-04-30',
    category: 'AI',
    tags: ['ai', 'generation', 'dedupe', 'questions']
  },
  // May 2026
  {
    id: 'may-1',
    title: 'Generate Questions from Previous Resources',
    description: 'Generate more questions from previously uploaded resources.',
    status: getStatusFromDate('2026-05-31'),
    priority: 'high',
    quarter: 'Q2 2026',
    estimatedDate: '2026-05-31',
    category: 'AI',
    tags: ['ai', 'generation', 'resources']
  },
  // June 2026
  {
    id: 'jun-1',
    title: 'Question Management at Scale',
    description: 'Question management at scale: bulk update, delete, duplicate, import/export, translations.',
    status: getStatusFromDate('2026-06-30'),
    priority: 'high',
    quarter: 'Q2 2026',
    estimatedDate: '2026-06-30',
    category: 'Questions',
    tags: ['bulk', 'management', 'import', 'export', 'translations']
  },
  {
    id: 'jun-2',
    title: 'Passwordless Login and Notifications',
    description: 'Passwordless login and user notifications.',
    status: getStatusFromDate('2026-06-30'),
    priority: 'medium',
    quarter: 'Q2 2026',
    estimatedDate: '2026-06-30',
    category: 'Identity',
    tags: ['passwordless', 'login', 'notifications']
  },
  // July 2026
  {
    id: 'jul-1',
    title: 'Organization and Multi-Tenant Management',
    description: 'Organization and multi-tenant management (profiles, directories, invites).',
    status: getStatusFromDate('2026-07-31'),
    priority: 'high',
    quarter: 'Q3 2026',
    estimatedDate: '2026-07-31',
    category: 'Organizations',
    tags: ['organizations', 'multi-tenant', 'profiles', 'invites']
  },
  {
    id: 'jul-2',
    title: 'Attempt Results Export and Audit Log',
    description: 'Attempt results export and audit log search for admins.',
    status: getStatusFromDate('2026-07-31'),
    priority: 'medium',
    quarter: 'Q3 2026',
    estimatedDate: '2026-07-31',
    category: 'Export',
    tags: ['export', 'audit', 'results', 'admin']
  },
  // August 2026
  {
    id: 'aug-1',
    title: 'Community Features',
    description: 'Community features: bookmarks, ratings, discussions, social following.',
    status: getStatusFromDate('2026-08-31'),
    priority: 'medium',
    quarter: 'Q3 2026',
    estimatedDate: '2026-08-31',
    category: 'Community',
    tags: ['community', 'bookmarks', 'ratings', 'discussions', 'social']
  },
  // September 2026
  {
    id: 'sep-1',
    title: 'Analytics and Insights',
    description: 'Analytics and insights: usage, engagement, organization reporting.',
    status: getStatusFromDate('2026-09-30'),
    priority: 'high',
    quarter: 'Q3 2026',
    estimatedDate: '2026-09-30',
    category: 'Analytics',
    tags: ['analytics', 'insights', 'usage', 'engagement', 'reporting']
  },
  // October 2026
  {
    id: 'oct-1',
    title: 'Configuration Management and Observability',
    description: 'Configuration management and platform observability UI.',
    status: getStatusFromDate('2026-10-31'),
    priority: 'medium',
    quarter: 'Q4 2026',
    estimatedDate: '2026-10-31',
    category: 'Operations',
    tags: ['configuration', 'observability', 'operations']
  },
  // November 2026
  {
    id: 'nov-1',
    title: 'Quality Improvements and Feedback',
    description: 'Buffer for quality improvements and feedback-driven updates.',
    status: getStatusFromDate('2026-11-30'),
    priority: 'low',
    quarter: 'Q4 2026',
    estimatedDate: '2026-11-30',
    category: 'Platform',
    tags: ['quality', 'feedback', 'improvements']
  },
  // December 2026
  {
    id: 'dec-1',
    title: 'Stability, Polish, and Planning',
    description: 'Buffer for stability, polish, and year-end planning.',
    status: getStatusFromDate('2026-12-31'),
    priority: 'low',
    quarter: 'Q4 2026',
    estimatedDate: '2026-12-31',
    category: 'Platform',
    tags: ['stability', 'polish', 'planning']
  },
  // Beyond 2026
  {
    id: 'beyond-1',
    title: 'Future Enhancements',
    description: 'Additional personalization, analytics, and content workflows based on demand.',
    status: 'planned',
    priority: 'low',
    quarter: 'Beyond 2026',
    estimatedDate: '2027-01-01',
    category: 'Platform',
    tags: ['future', 'exploration', 'personalization']
  }
];

export const mockMilestones: RoadmapMilestone[] = [
  {
    id: 'm-jan-2026',
    title: 'January 2026',
    description: 'Import quizzes and image-based questions',
    targetDate: '2026-01-31',
    status: getStatusFromDate('2026-01-31'),
    features: mockFeatures.filter(f => f.id.startsWith('jan-'))
  },
  {
    id: 'm-feb-2026',
    title: 'February 2026',
    description: 'Flashcards, spaced repetition, and markdown authoring',
    targetDate: '2026-02-28',
    status: getStatusFromDate('2026-02-28'),
    features: mockFeatures.filter(f => f.id.startsWith('feb-'))
  },
  {
    id: 'm-mar-2026',
    title: 'March 2026',
    description: 'AI-powered generation from multiple sources',
    targetDate: '2026-03-31',
    status: getStatusFromDate('2026-03-31'),
    features: mockFeatures.filter(f => f.id.startsWith('mar-'))
  },
  {
    id: 'm-apr-2026',
    title: 'April 2026',
    description: 'AI question generation',
    targetDate: '2026-04-30',
    status: getStatusFromDate('2026-04-30'),
    features: mockFeatures.filter(f => f.id.startsWith('apr-'))
  },
  {
    id: 'm-may-2026',
    title: 'May 2026',
    description: 'Generate questions from previous resources',
    targetDate: '2026-05-31',
    status: getStatusFromDate('2026-05-31'),
    features: mockFeatures.filter(f => f.id.startsWith('may-'))
  },
  {
    id: 'm-jun-2026',
    title: 'June 2026',
    description: 'Question management and identity features',
    targetDate: '2026-06-30',
    status: getStatusFromDate('2026-06-30'),
    features: mockFeatures.filter(f => f.id.startsWith('jun-'))
  },
  {
    id: 'm-jul-2026',
    title: 'July 2026',
    description: 'Organization management and admin tools',
    targetDate: '2026-07-31',
    status: getStatusFromDate('2026-07-31'),
    features: mockFeatures.filter(f => f.id.startsWith('jul-'))
  },
  {
    id: 'm-aug-2026',
    title: 'August 2026',
    description: 'Community engagement features',
    targetDate: '2026-08-31',
    status: getStatusFromDate('2026-08-31'),
    features: mockFeatures.filter(f => f.id.startsWith('aug-'))
  },
  {
    id: 'm-sep-2026',
    title: 'September 2026',
    description: 'Analytics and insights platform',
    targetDate: '2026-09-30',
    status: getStatusFromDate('2026-09-30'),
    features: mockFeatures.filter(f => f.id.startsWith('sep-'))
  },
  {
    id: 'm-oct-2026',
    title: 'October 2026',
    description: 'Configuration and observability',
    targetDate: '2026-10-31',
    status: getStatusFromDate('2026-10-31'),
    features: mockFeatures.filter(f => f.id.startsWith('oct-'))
  },
  {
    id: 'm-nov-2026',
    title: 'November 2026',
    description: 'Quality improvements and feedback',
    targetDate: '2026-11-30',
    status: getStatusFromDate('2026-11-30'),
    features: mockFeatures.filter(f => f.id.startsWith('nov-'))
  },
  {
    id: 'm-dec-2026',
    title: 'December 2026',
    description: 'Stability, polish, and planning',
    targetDate: '2026-12-31',
    status: getStatusFromDate('2026-12-31'),
    features: mockFeatures.filter(f => f.id.startsWith('dec-'))
  },
  {
    id: 'm-beyond-2026',
    title: 'Beyond 2026',
    description: 'Future enhancements and exploration',
    targetDate: '2027-01-01',
    status: 'planned',
    features: mockFeatures.filter(f => f.id.startsWith('beyond-'))
  }
];
