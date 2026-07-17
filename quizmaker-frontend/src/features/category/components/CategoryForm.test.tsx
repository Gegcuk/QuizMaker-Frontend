import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { CategoryDto } from '@/types';
import { CategoryForm } from './CategoryForm';

const categoryMocks = vi.hoisted(() => ({
  createCategory: vi.fn(),
  getCategoryById: vi.fn(),
  updateCategory: vi.fn(),
}));

vi.mock('@/services', () => ({
  categoryService: categoryMocks,
}));

const category = (overrides: Partial<CategoryDto> = {}): CategoryDto => ({
  id: 'category-1',
  name: 'Architecture',
  description: 'Software architecture topics',
  ...overrides,
});

describe('CategoryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates the category name before submitting', async () => {
    const { user } = renderWithProviders(
      <CategoryForm onSave={vi.fn()} onCancel={vi.fn()} />,
      { withAuthProvider: false },
    );

    await user.type(screen.getByLabelText(/Category Name/), 'AI');
    await user.click(screen.getByRole('button', { name: 'Create Category' }));

    expect(screen.getByText('Category name must be at least 3 characters')).toBeInTheDocument();
    expect(categoryMocks.createCategory).not.toHaveBeenCalled();
  });

  it('creates a category and returns the fully loaded category to the caller', async () => {
    categoryMocks.createCategory.mockResolvedValue({ categoryId: 'category-1' });
    categoryMocks.getCategoryById.mockResolvedValue(category());
    const onSave = vi.fn();
    const { user } = renderWithProviders(
      <CategoryForm onSave={onSave} onCancel={vi.fn()} />,
      { withAuthProvider: false },
    );

    await user.type(screen.getByLabelText(/Category Name/), 'Architecture');
    await user.type(screen.getByLabelText('Description'), 'Software architecture topics');
    await user.click(screen.getByRole('button', { name: 'Create Category' }));

    await waitFor(() => {
      expect(categoryMocks.createCategory).toHaveBeenCalledWith({
        name: 'Architecture',
        description: 'Software architecture topics',
      });
    });
    expect(categoryMocks.getCategoryById).toHaveBeenCalledWith('category-1');
    expect(onSave).toHaveBeenCalledWith(category());
  });

  it('updates an existing category instead of creating a second one', async () => {
    const updatedCategory = category({ name: 'Cloud Architecture' });
    categoryMocks.updateCategory.mockResolvedValue(updatedCategory);
    const onSave = vi.fn();
    const { user } = renderWithProviders(
      <CategoryForm category={category()} onSave={onSave} onCancel={vi.fn()} />,
      { withAuthProvider: false },
    );

    const nameInput = screen.getByLabelText(/Category Name/);
    await user.clear(nameInput);
    await user.type(nameInput, 'Cloud Architecture');
    await user.click(screen.getByRole('button', { name: 'Update Category' }));

    await waitFor(() => {
      expect(categoryMocks.updateCategory).toHaveBeenCalledWith('category-1', {
        name: 'Cloud Architecture',
        description: 'Software architecture topics',
      });
    });
    expect(onSave).toHaveBeenCalledWith(updatedCategory);
  });
});
