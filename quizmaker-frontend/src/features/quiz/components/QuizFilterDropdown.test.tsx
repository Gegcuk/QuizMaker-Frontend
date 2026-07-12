import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import QuizFilterDropdown, { type FilterOptions } from './QuizFilterDropdown';

describe('QuizFilterDropdown', () => {
  it('adds a filter without mutating the filters passed by its parent', async () => {
    const filters: FilterOptions = { difficulty: ['EASY'] };
    const onFiltersChange = vi.fn();
    const { user } = renderWithProviders(
      <QuizFilterDropdown
        filters={filters}
        onFiltersChange={onFiltersChange}
        onClearFilters={vi.fn()}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /Filter/ }));
    await user.click(screen.getByRole('button', { name: 'Medium' }));

    expect(onFiltersChange).toHaveBeenCalledWith({ difficulty: ['EASY', 'MEDIUM'] });
    expect(filters).toEqual({ difficulty: ['EASY'] });
  });

  it('filters categories and clears active filters from the open menu', async () => {
    const onFiltersChange = vi.fn();
    const onClearFilters = vi.fn();
    const { user } = renderWithProviders(
      <QuizFilterDropdown
        filters={{ status: ['PUBLISHED'] }}
        onFiltersChange={onFiltersChange}
        onClearFilters={onClearFilters}
        availableCategories={[{ id: 'category-1', name: 'Architecture' }]}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /Filter/ }));
    await user.click(screen.getByRole('button', { name: 'Architecture' }));

    expect(onFiltersChange).toHaveBeenCalledWith({
      status: ['PUBLISHED'],
      category: ['category-1'],
    });

    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(onClearFilters).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();
  });
});
