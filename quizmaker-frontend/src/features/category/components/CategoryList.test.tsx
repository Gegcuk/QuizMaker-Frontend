import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { CategoryDto } from '@/types';
import { CategoryList } from './CategoryList';

const categoryMocks = vi.hoisted(() => ({
  deleteCategory: vi.fn(),
  getCategories: vi.fn(),
}));

vi.mock('@/services', () => ({
  categoryService: categoryMocks,
}));

const categories: CategoryDto[] = [
  { id: 'category-1', name: 'Architecture', description: 'System design' },
  { id: 'category-2', name: 'Security', description: 'Application security' },
];

const categoryPage = (content: CategoryDto[]) => ({
  content,
  totalElements: content.length,
  totalPages: 1,
});

describe('CategoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryMocks.getCategories.mockResolvedValue(categoryPage(categories));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters loaded categories and forwards the selected category', async () => {
    const onCategorySelect = vi.fn();
    const { user } = renderWithProviders(
      <CategoryList
        onEditCategory={vi.fn()}
        onDeleteCategory={vi.fn()}
        onCategorySelect={onCategorySelect}
      />,
      { withAuthProvider: false },
    );

    expect(await screen.findByText('Architecture')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Search categories...'), 'security');

    expect(screen.queryByText('Architecture')).not.toBeInTheDocument();
    await user.click(screen.getByText('Security'));
    expect(onCategorySelect).toHaveBeenCalledWith(categories[1]);
  });

  it('confirms deletion, notifies the caller, and reloads the list', async () => {
    categoryMocks.deleteCategory.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onDeleteCategory = vi.fn();
    const { user } = renderWithProviders(
      <CategoryList onEditCategory={vi.fn()} onDeleteCategory={onDeleteCategory} />,
      { withAuthProvider: false },
    );

    await screen.findByText('Architecture');
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    await waitFor(() => {
      expect(categoryMocks.deleteCategory).toHaveBeenCalledWith('category-1');
    });
    expect(onDeleteCategory).toHaveBeenCalledWith('category-1');
    expect(categoryMocks.getCategories).toHaveBeenCalledTimes(2);
  });

  it('shows a retryable error when loading categories fails', async () => {
    categoryMocks.getCategories.mockRejectedValue(new Error('Categories are unavailable.'));
    const { user } = renderWithProviders(
      <CategoryList onEditCategory={vi.fn()} onDeleteCategory={vi.fn()} />,
      { withAuthProvider: false },
    );

    expect(await screen.findByText('Categories are unavailable.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(categoryMocks.getCategories).toHaveBeenCalledTimes(2);
  });
});
