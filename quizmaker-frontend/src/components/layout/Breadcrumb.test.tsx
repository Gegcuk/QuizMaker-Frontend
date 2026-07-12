import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import Breadcrumb from './Breadcrumb';

describe('Breadcrumb', () => {
  it('builds accessible links and a current-page label from a known route', () => {
    renderWithProviders(<Breadcrumb />, { route: '/settings', withAuthProvider: false });

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Settings')).toHaveAttribute('title', 'Settings');
  });

  it('collapses long custom trails without losing the current page', () => {
    renderWithProviders(
      <Breadcrumb
        maxItems={3}
        customItems={[
          { label: 'Home', path: '/' },
          { label: 'Administration', path: '/admin' },
          { label: 'Quizzes', path: '/admin/quizzes' },
          { label: 'Review', path: '/admin/quizzes/review' },
          { label: 'Current quiz', path: '/admin/quizzes/review/1', isCurrent: true },
        ]}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Administration' })).not.toBeInTheDocument();
    expect(screen.getByText('Current quiz')).toHaveAttribute('title', 'Current quiz');
  });
});
