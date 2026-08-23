// src/features/analytics/AnalyticsProvider.tsx
// ---------------------------------------------------------------------------
// Wraps the app to emit page_view events (with content group) on navigation.
// ---------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent, trackPageView } from './ga4';
import { getAnalyticsRoute } from './routeAnalytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    const analyticsRoute = getAnalyticsRoute(location.pathname);
    if (!analyticsRoute) return;

    // Coalesce the committed router navigation into one browser-frame page view.
    const frame = requestAnimationFrame(() => {
      trackPageView({
        path: analyticsRoute.template,
        title: analyticsRoute.title,
        contentGroup: analyticsRoute.contentGroup,
      });

      if (analyticsRoute.template === '/') {
        trackEvent('view_home');
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [location.key, location.pathname]);

  return <>{children}</>;
};

export default AnalyticsProvider;
