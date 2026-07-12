import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import PageContainer from './PageContainer';

describe('PageContainer', () => {
  it('renders the page header and constrains page content by default', () => {
    const { container } = renderWithProviders(
      <PageContainer title="Quiz settings" subtitle="Manage this quiz">
        <p>Page body</p>
      </PageContainer>,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Quiz settings' })).toBeInTheDocument();
    expect(screen.getByText('Manage this quiz')).toBeInTheDocument();
    expect(screen.getByText('Page body').parentElement).toHaveClass('max-w-7xl');
    expect(container.firstElementChild).toHaveClass('bg-theme-bg-secondary');
  });

  it('supports full-width pages without a page header', () => {
    renderWithProviders(
      <PageContainer title="Unused title" showHeader={false} fullWidth>
        <p>Full-width body</p>
      </PageContainer>,
      { withAuthProvider: false },
    );

    expect(screen.queryByRole('heading', { name: 'Unused title' })).not.toBeInTheDocument();
    expect(screen.getByText('Full-width body').parentElement).not.toHaveClass('max-w-7xl');
  });
});
