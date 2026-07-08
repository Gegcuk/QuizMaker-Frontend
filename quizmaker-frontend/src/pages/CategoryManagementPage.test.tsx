import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import CategoryManagementPage from './CategoryManagementPage';

const mocks = vi.hoisted(() => ({
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
  getAllCategories: vi.fn(),
  updateCategory: vi.fn(),
}));

vi.mock('../features/category', () => ({
  createCategory: mocks.createCategory,
  deleteCategory: mocks.deleteCategory,
  getAllCategories: mocks.getAllCategories,
  updateCategory: mocks.updateCategory,
}));

describe('CategoryManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAllCategories.mockResolvedValue({
      content: [{ id: 'category-1', name: 'Architecture', description: 'Design' }],
    });
    mocks.deleteCategory.mockResolvedValue(undefined);
  });

  it('deletes a category after confirmation', async () => {
    const { user } = renderWithProviders(<CategoryManagementPage />, {
      withAuthProvider: false,
    });

    await user.click(await screen.findByRole('button', { name: 'Delete category' }));
    expect(screen.getByRole('dialog', { name: 'Delete Category' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete Category' }));

    await waitFor(() =>
      expect(mocks.deleteCategory).toHaveBeenCalledWith('category-1'),
    );
    expect(mocks.getAllCategories).toHaveBeenCalledTimes(2);
  });
});
