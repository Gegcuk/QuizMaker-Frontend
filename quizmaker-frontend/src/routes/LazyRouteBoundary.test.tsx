import React, { lazy } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderWithProviders, screen } from '@/test/render';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import LazyRouteBoundary, {
  clearLazyRouteRecovery,
  isLazyRouteLoadError,
  startLazyRouteRecovery,
} from './LazyRouteBoundary';

const ThrowLazyRouteLoadError = () => {
  throw new TypeError('Failed to fetch dynamically imported module: https://www.quizzence.com/assets/QuizAttemptPage.js');
};

const ThrowRenderingError = () => {
  throw new Error('Rendering failed');
};

describe('LazyRouteBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps an accessible loading indicator visible until a deferred route resolves', async () => {
    let resolveModule!: (module: { default: React.ComponentType }) => void;
    const DeferredRoute = lazy(
      () => new Promise<{ default: React.ComponentType }>((resolve) => {
        resolveModule = resolve;
      }),
    );

    renderWithProviders(
      <LazyRouteBoundary>
        <DeferredRoute />
      </LazyRouteBoundary>,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();

    await act(async () => {
      resolveModule({ default: () => <h1>Deferred route content</h1> });
    });

    expect(await screen.findByRole('heading', { name: 'Deferred route content' })).toBeInTheDocument();
  });

  it('recognizes browser lazy-import failures without treating normal errors as route-load failures', () => {
    expect(isLazyRouteLoadError(new TypeError('Failed to fetch dynamically imported module'))).toBe(true);
    expect(isLazyRouteLoadError(new Error('Rendering failed'))).toBe(false);
  });

  it('performs only one automatic recovery attempt for the current route', () => {
    const reload = vi.fn();

    expect(startLazyRouteRecovery(reload)).toBe(true);
    expect(startLazyRouteRecovery(reload)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);

    clearLazyRouteRecovery();

    expect(startLazyRouteRecovery(reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('shows a route-level refresh fallback after an automatic recovery was already attempted', () => {
    startLazyRouteRecovery(vi.fn());
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderWithProviders(
      <LazyRouteBoundary>
        <ThrowLazyRouteLoadError />
      </LazyRouteBoundary>,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Unable to load this page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument();
  });

  it('passes non-lazy rendering errors to the existing global error boundary', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderWithProviders(
      <ErrorBoundary>
        <LazyRouteBoundary>
          <ThrowRenderingError />
        </LazyRouteBoundary>
      </ErrorBoundary>,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
  });
});
