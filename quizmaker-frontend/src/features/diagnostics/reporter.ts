import { getAnalyticsRoute } from '@/features/analytics/routeAnalytics';
import { toApplicationError, type ErrorCategory } from '@/utils/applicationError';

type DiagnosticSource = 'request' | 'render' | 'rejection' | 'route-load' | 'application';
export interface DiagnosticEvent {
  readonly category: ErrorCategory;
  readonly source: DiagnosticSource;
  readonly status?: number;
  readonly route: string;
  readonly release: string;
  readonly occurredAt: number;
  readonly reference: string;
}

const sources = new Set<DiagnosticSource>(['request', 'render', 'rejection', 'route-load', 'application']);
const CAPACITY = 20;
const EXPIRY_MS = 30 * 60 * 1000;
const SUPPRESSION_MS = 60 * 1000;

/** A tab-local, default-deny buffer. This module has no storage or transport. */
export function createDiagnosticReporter(releaseValue: unknown = 'unknown') {
  const release = typeof releaseValue === 'string' && /^[a-f0-9]{40}$/.test(releaseValue)
    ? releaseValue : 'unknown';
  const collectionAllowed = import.meta.env.VITE_DIAGNOSTICS_ENABLED !== 'false';
  let enabled = collectionAllowed;
  let events: DiagnosticEvent[] = [];
  const lastCategory = new Map<ErrorCategory, number>();
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;

  const prune = () => {
    const now = Date.now();
    events = events.filter(event => now - event.occurredAt < EXPIRY_MS);
    for (const [category, time] of lastCategory) {
      if (now - time >= SUPPRESSION_MS) lastCategory.delete(category);
    }
  };
  const scheduleExpiry = () => {
    if (expiryTimer !== undefined) clearTimeout(expiryTimer);
    expiryTimer = undefined;
    if (events.length) {
      expiryTimer = setTimeout(() => {
        prune();
        scheduleExpiry();
      }, Math.max(1, events[0].occurredAt + EXPIRY_MS - Date.now()));
    }
  };
  const clear = () => {
    events = [];
    lastCategory.clear();
    if (expiryTimer !== undefined) clearTimeout(expiryTimer);
    expiryTimer = undefined;
  };

  return {
    report(error: unknown, source: DiagnosticSource, pathname = typeof window === 'undefined' ? '' : window.location.pathname): string | undefined {
      if (!enabled || !sources.has(source)) return undefined;
      const safe = toApplicationError(error);
      // Expected cancellation and stale-session responses need no diagnostic event.
      if (safe.category === 'cancelled') return undefined;
      prune();
      if (lastCategory.has(safe.category)) {
        for (let index = events.length - 1; index >= 0; index -= 1) {
          if (events[index].category === safe.category) return events[index].reference;
        }
        return undefined;
      }
      const now = Date.now();
      const event: DiagnosticEvent = Object.freeze({
        category: safe.category,
        source,
        status: safe.status,
        route: getAnalyticsRoute(pathname)?.template ?? 'unknown',
        release,
        occurredAt: now,
        reference: crypto.randomUUID(),
      });
      events.push(event);
      if (events.length > CAPACITY) events.shift();
      lastCategory.set(safe.category, now);
      scheduleExpiry();
      return event.reference;
    },
    read(): readonly DiagnosticEvent[] {
      prune();
      return events.slice();
    },
    clear,
    setEnabled(value: boolean) {
      enabled = collectionAllowed && value === true;
      if (!enabled) clear();
    },
  };
}

export const diagnostics = createDiagnosticReporter(import.meta.env.VITE_RELEASE_REVISION);
