import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import { logger } from '@/utils';
import ErrorBoundary from './ErrorBoundary';

const ThrowError = () => {
  throw new Error('Rendering failed');
};

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the supplied fallback and reports the rendering error', () => {
    const onError = vi.fn();
    const loggerError = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderWithProviders(
      <ErrorBoundary fallback={<p>Recovery content</p>} onError={onError}>
        <ThrowError />
      </ErrorBoundary>,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Recovery content')).toBeInTheDocument();
    expect(loggerError).toHaveBeenCalledWith(
      'Error boundary caught an error',
      'ErrorBoundary',
      expect.objectContaining({ error: 'Rendering failed' }),
    );
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Rendering failed' }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });

  it('renders the standard recovery UI when no fallback is supplied', () => {
    vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderWithProviders(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument();
  });
});
