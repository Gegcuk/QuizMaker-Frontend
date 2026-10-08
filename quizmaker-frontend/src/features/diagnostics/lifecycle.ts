import { subscribeToSessionTransitions } from '@/features/auth/services/sessionLifecycle';
import { diagnostics } from './reporter';

/** Install once at the browser entry point; retain no rejection reason or identity. */
export function startDiagnostics(target: Window = window): () => void {
  const stopSession = subscribeToSessionTransitions(() => diagnostics.clear());
  const onRejection = (event: PromiseRejectionEvent) => {
    diagnostics.report(event.reason, 'rejection');
    // Prevent the browser's default handler from printing the raw rejection.
    event.preventDefault();
  };
  const onPageHide = () => diagnostics.clear();
  const onError = (event: ErrorEvent) => {
    diagnostics.report(event.error, 'application');
    event.preventDefault();
  };
  target.addEventListener('unhandledrejection', onRejection);
  target.addEventListener('error', onError);
  target.addEventListener('pagehide', onPageHide);
  return () => {
    stopSession();
    target.removeEventListener('unhandledrejection', onRejection);
    target.removeEventListener('error', onError);
    target.removeEventListener('pagehide', onPageHide);
    diagnostics.clear();
  };
}
