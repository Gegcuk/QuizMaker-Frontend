import React, { lazy } from 'react';
import { describe, expect, it } from 'vitest';
import { act, renderWithProviders, screen } from '@/test/render';
import LazyRouteBoundary from './LazyRouteBoundary';

describe('LazyRouteBoundary', () => {
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
});
