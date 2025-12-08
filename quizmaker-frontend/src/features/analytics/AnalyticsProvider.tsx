// src/features/analytics/AnalyticsProvider.tsx
// ---------------------------------------------------------------------------
// Wraps the app to emit page_view events (with content group) on navigation.
// ---------------------------------------------------------------------------

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent, trackPageView } from './ga4';
import { getContentGroup } from './contentGrouping';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Defer until the next animation frame so <Seo /> has time to update document.title.
    const frame = requestAnimationFrame(() => {
      const path = `${location.pathname}${location.search}`;
      const title = document.title || 'Quizzence';
      const contentGroup = getContentGroup(location.pathname);

      trackPageView({
        path,
        title,
        contentGroup,
      });

      if (location.pathname === '/') {
        trackEvent('view_home', { page_path: path });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [location]);

  return <>{children}</>;
};

export default AnalyticsProvider;
