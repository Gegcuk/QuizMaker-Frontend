export type AnalyticsContentGroup =
  | 'home'
  | 'blog'
  | 'legal'
  | 'auth'
  | 'app'
  | 'marketing';

export interface AnalyticsRoute {
  template: string;
  title: string;
  contentGroup: AnalyticsContentGroup;
}

interface DynamicAnalyticsRoute extends AnalyticsRoute {
  pattern: RegExp;
}

const route = (
  template: string,
  title: string,
  contentGroup: AnalyticsContentGroup,
): AnalyticsRoute => ({ template, title, contentGroup });

const exactRoutes = new Map<string, AnalyticsRoute>([
  ['/', route('/', 'Home', 'home')],
  ['/login', route('/login', 'Log in', 'auth')],
  ['/register', route('/register', 'Register', 'auth')],
  ['/forgot-password', route('/forgot-password', 'Forgot password', 'auth')],
  ['/reset-password', route('/reset-password', 'Reset password', 'auth')],
  ['/verify-email', route('/verify-email', 'Verify email', 'auth')],
  ['/oauth/callback', route('/oauth/callback', 'OAuth callback', 'auth')],
  ['/oauth2/redirect', route('/oauth2/redirect', 'OAuth callback', 'auth')],
  ['/theme-demo', route('/theme-demo', 'Theme demo', 'marketing')],
  ['/terms', route('/terms', 'Terms', 'legal')],
  ['/privacy', route('/privacy', 'Privacy', 'legal')],
  ['/faq', route('/faq', 'FAQ', 'marketing')],
  ['/values', route('/values', 'Values', 'marketing')],
  ['/roadmap', route('/roadmap', 'Roadmap', 'marketing')],
  ['/blog', route('/blog', 'Blog', 'blog')],
  [
    '/blog/retrieval-practice-template',
    route('/blog/retrieval-practice-template', 'Article template', 'blog'),
  ],
  ['/sitemap_articles.xml', route('/sitemap_articles.xml', 'Article sitemap', 'marketing')],
  ['/quizzes', route('/quizzes', 'Quizzes', 'app')],
  ['/my-quizzes', route('/my-quizzes', 'My quizzes', 'app')],
  ['/quizzes/create', route('/quizzes/create', 'Create quiz', 'app')],
  ['/tags', route('/tags', 'Tags', 'app')],
  ['/categories', route('/categories', 'Categories', 'app')],
  ['/questions', route('/questions', 'Questions', 'app')],
  ['/bug-reports', route('/bug-reports', 'Bug reports', 'app')],
  ['/admin', route('/admin', 'Admin workspace', 'app')],
  ['/documents', route('/documents', 'Documents', 'app')],
  ['/documents/upload', route('/documents/upload', 'Upload document', 'app')],
  ['/ai-analysis', route('/ai-analysis', 'AI analysis', 'app')],
  ['/form-test', route('/form-test', 'Form test', 'app')],
  ['/profile', route('/profile', 'Profile', 'app')],
  ['/settings', route('/settings', 'Settings', 'app')],
  ['/billing', route('/billing', 'Billing', 'app')],
  ['/billing/success', route('/billing/success', 'Checkout confirmation', 'app')],
  ['/billing/cancel', route('/billing/cancel', 'Checkout cancelled', 'app')],
  ['/my-attempts', route('/my-attempts', 'My attempts', 'app')],
]);

const dynamicRoutes: DynamicAnalyticsRoute[] = [
  {
    pattern: /^\/quizzes\/[^/]+\/attempt\/start$/,
    ...route('/quizzes/:quizId/attempt/start', 'Start quiz attempt', 'app'),
  },
  {
    pattern: /^\/quizzes\/[^/]+\/attempt$/,
    ...route('/quizzes/:quizId/attempt', 'Quiz attempt', 'app'),
  },
  {
    pattern: /^\/quizzes\/[^/]+\/results-summary$/,
    ...route('/quizzes/:quizId/results-summary', 'Quiz results summary', 'app'),
  },
  {
    pattern: /^\/quizzes\/[^/]+\/results$/,
    ...route('/quizzes/:quizId/results', 'Quiz results', 'app'),
  },
  {
    pattern: /^\/quizzes\/[^/]+\/questions$/,
    ...route('/quizzes/:quizId/questions', 'Quiz questions', 'app'),
  },
  {
    pattern: /^\/quizzes\/[^/]+\/generation$/,
    ...route('/quizzes/:quizId/generation', 'Quiz generation', 'app'),
  },
  {
    pattern: /^\/quizzes\/[^/]+\/edit$/,
    ...route('/quizzes/:quizId/edit', 'Edit quiz', 'app'),
  },
  {
    pattern: /^\/quizzes\/[^/]+$/,
    ...route('/quizzes/:quizId', 'Quiz details', 'app'),
  },
  {
    pattern: /^\/documents\/[^/]+$/,
    ...route('/documents/:documentId', 'Document details', 'app'),
  },
  {
    pattern: /^\/blog\/[^/]+$/,
    ...route('/blog/:slug', 'Blog article', 'blog'),
  },
];

const normalizePathname = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

export const getAnalyticsRoute = (pathname: string): AnalyticsRoute | null => {
  const normalizedPath = normalizePathname(pathname);
  const exact = exactRoutes.get(normalizedPath);
  if (exact) return exact;

  const dynamic = dynamicRoutes.find(({ pattern }) => pattern.test(normalizedPath));
  if (!dynamic) return null;

  return {
    template: dynamic.template,
    title: dynamic.title,
    contentGroup: dynamic.contentGroup,
  };
};
