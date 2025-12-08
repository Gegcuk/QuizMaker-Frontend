// src/features/analytics/ga4.ts
// ---------------------------------------------------------------------------
// Lightweight GA4 helpers for SPA-friendly page views and custom events.
// Keeps the measurement ID in one place and avoids throwing when gtag is absent.
// ---------------------------------------------------------------------------

export type AnalyticsEventName =
  | 'view_home'
  | 'cta_try_sample_quiz'
  | 'signup_google'
  | 'quiz_started'
  | 'quiz_completed'
  | 'teacher_checklist_completed'
  | 'class_invite_sent'
  | 'subscription_started'
  | 'subscription_renewed';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-MJP80B10VH';

type GtagEventParams = Record<string, unknown> & {
  value?: number;
  method?: string;
};

type PageViewPayload = {
  path: string;
  title?: string;
  contentGroup?: string;
};

const canSend = () => typeof window !== 'undefined' && typeof window.gtag === 'function' && !!GA_MEASUREMENT_ID;

const send = (command: 'config' | 'event', name: string, params?: Record<string, unknown>) => {
  if (!canSend() || !window.gtag) return;
  window.gtag(command, name, params);
};

export const trackPageView = ({ path, title, contentGroup }: PageViewPayload) => {
  send('config', GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title,
    content_group: contentGroup,
  });
};

export const trackEvent = (eventName: AnalyticsEventName | string, params?: GtagEventParams) => {
  send('event', eventName, params);
};

export const getMeasurementId = () => GA_MEASUREMENT_ID;
