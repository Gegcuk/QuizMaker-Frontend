import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import TransactionFilterDropdown from './TransactionFilterDropdown';

describe('TransactionFilterDropdown', () => {
  it('toggles transaction filters and reports the active filter count', async () => {
    const onFiltersChange = vi.fn();
    const onClearFilters = vi.fn();
    const { user } = renderWithProviders(
      <TransactionFilterDropdown
        filters={{ types: ['PURCHASE'], sources: ['STRIPE'] }}
        onFiltersChange={onFiltersChange}
        onClearFilters={onClearFilters}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /Filter/ }));
    expect(screen.getByText('2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Purchase' }));
    expect(onFiltersChange).toHaveBeenCalledWith({ sources: ['STRIPE'] });

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onClearFilters).toHaveBeenCalledOnce();
    expect(screen.queryByRole('heading', { name: 'Filters' })).not.toBeInTheDocument();
  });

  it('closes when a pointer action occurs outside the menu', async () => {
    const { user } = renderWithProviders(
      <>
        <TransactionFilterDropdown filters={{}} onFiltersChange={vi.fn()} onClearFilters={vi.fn()} />
        <button type="button">Outside</button>
      </>,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /Filter/ }));
    expect(screen.getByRole('heading', { name: 'Filters' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('heading', { name: 'Filters' })).not.toBeInTheDocument();
  });
});
