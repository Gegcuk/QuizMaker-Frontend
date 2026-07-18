import React, { Component, ErrorInfo, Suspense, useEffect } from 'react';
import { Button } from '@/components';
import { logger } from '@/utils';
import Spinner from '../components/ui/Spinner';

interface LazyRouteBoundaryProps {
  children: React.ReactNode;
}

interface LazyRouteErrorBoundaryState {
  error: Error | null;
}

const LAZY_ROUTE_RECOVERY_KEY_PREFIX = 'quizzence:lazy-route-recovery:';
const DYNAMIC_IMPORT_ERROR_PATTERNS = [
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /error loading dynamically imported module/i,
  /loading chunk [\d]+ failed/i,
];

const getLazyRouteRecoveryKey = () =>
  `${LAZY_ROUTE_RECOVERY_KEY_PREFIX}${window.location.pathname}${window.location.search}`;

export const isLazyRouteLoadError = (error: unknown): error is Error => {
  if (!(error instanceof Error)) {
    return false;
  }

  return DYNAMIC_IMPORT_ERROR_PATTERNS.some((pattern) => pattern.test(error.message));
};

export const clearLazyRouteRecovery = () => {
  try {
    sessionStorage.removeItem(getLazyRouteRecoveryKey());
  } catch {
    // Storage can be disabled; skipping automatic recovery is safer than looping reloads.
  }
};

export const startLazyRouteRecovery = (reload: () => void) => {
  try {
    const recoveryKey = getLazyRouteRecoveryKey();

    if (sessionStorage.getItem(recoveryKey)) {
      return false;
    }

    sessionStorage.setItem(recoveryKey, 'attempted');
    reload();
    return true;
  } catch {
    return false;
  }
};

const RouteLoadingFallback: React.FC = () => (
  <div className="flex min-h-[16rem] items-center justify-center bg-theme-bg-secondary px-4 py-8">
    <Spinner size="lg" />
  </div>
);

const RouteLoadFailureFallback: React.FC = () => (
  <div className="flex min-h-[16rem] items-center justify-center bg-theme-bg-secondary px-4 py-8">
    <div className="w-full max-w-md bg-theme-bg-primary p-6 shadow-lg rounded-lg">
      <h1 className="text-lg font-medium text-theme-text-primary">Unable to load this page</h1>
      <p className="mt-2 text-sm text-theme-text-tertiary">
        The application may have been updated. Refresh the page to load the latest version.
      </p>
      <div className="mt-4">
        <Button onClick={() => window.location.reload()} variant="primary" size="md">
          Refresh Page
        </Button>
      </div>
    </div>
  </div>
);

class LazyRouteErrorBoundary extends Component<LazyRouteBoundaryProps, LazyRouteErrorBoundaryState> {
  state: LazyRouteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): LazyRouteErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (!isLazyRouteLoadError(error)) {
      return;
    }

    const reloading = startLazyRouteRecovery(() => window.location.reload());
    logger.warn(
      reloading ? 'Reloading after lazy route load failure' : 'Lazy route load failure requires manual refresh',
      'LazyRouteBoundary',
      {
        error: error.message,
        componentStack: errorInfo.componentStack,
      },
    );
  }

  render() {
    if (this.state.error) {
      if (!isLazyRouteLoadError(this.state.error)) {
        throw this.state.error;
      }

      return <RouteLoadFailureFallback />;
    }

    return this.props.children;
  }
}

const LazyRouteRecoveryReset: React.FC = () => {
  useEffect(() => {
    clearLazyRouteRecovery();
  }, []);

  return null;
};

const LazyRouteBoundary: React.FC<LazyRouteBoundaryProps> = ({ children }) => (
  <LazyRouteErrorBoundary>
    <Suspense fallback={<RouteLoadingFallback />}>
      {children}
      <LazyRouteRecoveryReset />
    </Suspense>
  </LazyRouteErrorBoundary>
);

export default LazyRouteBoundary;
