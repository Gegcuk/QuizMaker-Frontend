import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import { diagnostics } from '@/features/diagnostics/reporter';
import ErrorBoundary from './ErrorBoundary';

const ThrowError = () => {
  throw new Error('seeded-render-token-secret');
};

describe('ErrorBoundary', () => {
  afterEach(() => {
    diagnostics.clear();
    vi.restoreAllMocks();
  });

  it('renders the supplied fallback and reports the rendering error', () => {
    const onError = vi.fn();
    const reporter = vi.spyOn(diagnostics, 'report');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderWithProviders(
      <ErrorBoundary fallback={<p>Recovery content</p>} onError={onError}>
        <ThrowError />
      </ErrorBoundary>,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Recovery content')).toBeInTheDocument();
    expect(reporter).toHaveBeenCalledWith(expect.any(Error), 'render');
    expect(JSON.stringify(diagnostics.read())).not.toContain('seeded-render-token-secret');
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'unexpected', stack: undefined }),
      { componentStack: '' },
    );
    expect(JSON.stringify(onError.mock.calls)).not.toContain('seeded-render-token-secret');
  });

  it('renders the standard recovery UI when no fallback is supplied', () => {
    diagnostics.clear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderWithProviders(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument();
    expect(screen.getByText(/Support reference:/)).toBeInTheDocument();
    expect(screen.queryByText('seeded-render-token-secret')).not.toBeInTheDocument();
  });
});
