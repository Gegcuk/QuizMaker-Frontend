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

type GtagEventParams = {
  source?: 'blog_article';
  method?: 'google' | 'github';
  value?: number;
};

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-MJP80B10VH';
const MAX_ANALYTICS_VALUE = 1_000_000;

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
  const pageLocation = typeof window === 'undefined'
    ? path
    : new URL(path, window.location.origin).toString();

  send('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
    page_path: path,
    page_title: title,
    page_location: pageLocation,
    page_referrer: '',
    content_group: contentGroup,
  });
  send('event', 'page_view', {
    page_path: path,
    page_title: title,
    page_location: pageLocation,
    page_referrer: '',
    content_group: contentGroup,
  });
};

export const trackEvent = (eventName: AnalyticsEventName, params?: Readonly<GtagEventParams>) => {
  const safeParams: GtagEventParams = {};
  if (params?.source === 'blog_article') safeParams.source = params.source;
  if (params?.method === 'google' || params?.method === 'github') safeParams.method = params.method;
  if (typeof params?.value === 'number' && Number.isFinite(params.value)) {
    safeParams.value = Math.max(-MAX_ANALYTICS_VALUE, Math.min(MAX_ANALYTICS_VALUE, params.value));
  }

  send('event', eventName, Object.keys(safeParams).length > 0 ? safeParams : undefined);
};

export const getMeasurementId = () => GA_MEASUREMENT_ID;
