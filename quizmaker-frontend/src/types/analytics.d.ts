// Global types for GA4
interface Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}
