import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import QuizCategoryManager from './QuizCategoryManager';

const categoryService = vi.hoisted(() => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  getCategoryById: vi.fn(),
}));

vi.mock('@/services', () => ({ categoryService, api: {} }));

const categories = [
  { id: 'category-1', name: 'Architecture', description: 'System design' },
  { id: 'category-2', name: 'Security', description: 'Application security' },
];

describe('QuizCategoryManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    categoryService.getCategories.mockResolvedValue({ content: categories });
  });

  it('loads categories and changes selection once when the checkbox is clicked', async () => {
    const onCategoryChange = vi.fn();
    const { user } = renderWithProviders(
      <QuizCategoryManager quizId="quiz-1" onCategoryChange={onCategoryChange} />,
      { withAuthProvider: false },
    );

    await user.click(await screen.findByRole('checkbox', { name: /Architecture/ }));

    expect(onCategoryChange).toHaveBeenCalledTimes(1);
    expect(onCategoryChange).toHaveBeenCalledWith('category-1');
  });

  it('creates a category and selects the fully loaded result', async () => {
    const onCategoryChange = vi.fn();
    categoryService.createCategory.mockResolvedValue({ categoryId: 'category-3' });
    categoryService.getCategoryById.mockResolvedValue({
      id: 'category-3',
      name: 'Data',
      description: 'Data platform architecture',
    });
    const { user } = renderWithProviders(
      <QuizCategoryManager quizId="quiz-1" onCategoryChange={onCategoryChange} />,
      { withAuthProvider: false },
    );

    await screen.findByText('Architecture');
    await user.click(screen.getByRole('button', { name: '+ Add New Category' }));
    await user.type(screen.getByLabelText(/Category Name/), 'Data');
    await user.type(screen.getByLabelText('Description'), 'Data platform architecture');
    await user.click(screen.getByRole('button', { name: 'Create Category' }));

    await waitFor(() => {
      expect(categoryService.createCategory).toHaveBeenCalledWith({
        name: 'Data',
        description: 'Data platform architecture',
      });
    });
    expect(categoryService.getCategoryById).toHaveBeenCalledWith('category-3');
    expect(onCategoryChange).toHaveBeenCalledWith('category-3');
    expect(screen.getByText('Data')).toBeInTheDocument();
  });
});
