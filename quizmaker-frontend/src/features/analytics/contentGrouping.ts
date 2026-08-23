// src/features/analytics/contentGrouping.ts
// ---------------------------------------------------------------------------
// Compatibility helper for callers that only need the route's safe content group.
// ---------------------------------------------------------------------------

import { getAnalyticsRoute } from './routeAnalytics';

export const getContentGroup = (pathname: string) =>
  getAnalyticsRoute(pathname)?.contentGroup ?? 'marketing';
