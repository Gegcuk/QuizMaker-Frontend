import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { CategoryDto } from '@/types';
import { CategorySelector } from './CategorySelector';

const categoryMocks = vi.hoisted(() => ({
  getCategories: vi.fn(),
}));

vi.mock('@/services', () => ({
  categoryService: categoryMocks,
}));

const categories: CategoryDto[] = [
  { id: 'category-1', name: 'Architecture', description: 'System design' },
  { id: 'category-2', name: 'Security', description: 'Application security' },
];

describe('CategorySelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryMocks.getCategories.mockResolvedValue({ content: categories });
  });

  it('selects a category in single-select mode and closes the menu', async () => {
    const onSelectionChange = vi.fn();
    const { user } = renderWithProviders(
      <CategorySelector selectedCategories={[]} onSelectionChange={onSelectionChange} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Select categories...' }));
    await user.click(await screen.findByRole('button', { name: /Architecture System design/ }));

    expect(onSelectionChange).toHaveBeenCalledWith([categories[0]]);
    expect(screen.queryByPlaceholderText('Search categories...')).not.toBeInTheDocument();
  });

  it('prevents additions beyond the configured multi-select limit and supports clearing', async () => {
    const onSelectionChange = vi.fn();
    const { user } = renderWithProviders(
      <CategorySelector
        selectedCategories={[categories[0]]}
        onSelectionChange={onSelectionChange}
        multiple
        maxSelections={1}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /Architecture/ }));
    await screen.findByRole('button', { name: /Security Application security/ });
    await user.click(screen.getByRole('button', { name: /Security Application security/ }));

    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(screen.getByText('Maximum 1 categories selected. Remove some to add more.')).toBeInTheDocument();

    await user.click(screen.getByTitle('Clear all'));
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it('shows service failures when the selector is opened', async () => {
    categoryMocks.getCategories.mockRejectedValue(new Error('Cannot load categories.'));
    const { user } = renderWithProviders(
      <CategorySelector selectedCategories={[]} onSelectionChange={vi.fn()} />,
      { withAuthProvider: false },
    );

    await waitFor(() => expect(categoryMocks.getCategories).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: 'Select categories...' }));

    expect(await screen.findByText('Cannot load categories.')).toBeInTheDocument();
  });
});
