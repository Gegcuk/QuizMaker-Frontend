import { beforeEach, describe, expect, it } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type { CategoryDto, CategoryPage } from '../types/category.types';
import { CategoryService } from './category.service';

const category: CategoryDto = {
  id: 'category-1',
  name: 'Architecture',
  description: 'Software architecture topics',
};

const categoryPage: CategoryPage = {
  content: [category],
  pageable: {
    pageNumber: 0,
    pageSize: 20,
    sort: { sorted: true, unsorted: false, empty: false },
  },
  totalElements: 1,
  totalPages: 1,
  last: true,
  first: true,
  numberOfElements: 1,
  size: 20,
  number: 0,
  empty: false,
};

const problemError = (status: number, detail: string) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: {
    status,
    data: {
      type: 'https://quizzence.com/docs/errors/validation-failed',
      title: 'Request Failed',
      status,
      detail,
    },
  },
});

describe('CategoryService', () => {
  let axios: AxiosMock;
  let service: CategoryService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new CategoryService(axios.instance);
  });

  it('lists categories with deployed defaults and custom sort criteria', async () => {
    axios.get.mockResolvedValue({ data: categoryPage });

    await expect(service.getCategories()).resolves.toBe(categoryPage);
    await expect(
      service.getCategories({ page: 2, size: 50, sort: ['name,DESC', 'id,ASC'] }),
    ).resolves.toBe(categoryPage);

    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/categories', {
      params: { page: 0, size: 20, sort: 'name,ASC' },
    });
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/categories', {
      params: { page: 2, size: 50, sort: ['name,DESC', 'id,ASC'] },
    });
  });

  it('gets, creates, updates, and deletes categories', async () => {
    axios.get.mockResolvedValue({ data: category });
    axios.post.mockResolvedValue({ data: { categoryId: 'category-1' } });
    axios.patch.mockResolvedValue({ data: category });
    axios.delete.mockResolvedValue({ data: undefined });

    await expect(service.getCategoryById('category-1')).resolves.toBe(category);
    await expect(
      service.createCategory({ name: 'Architecture', description: category.description }),
    ).resolves.toEqual({ categoryId: 'category-1' });
    await expect(
      service.updateCategory('category-1', { description: 'Updated' }),
    ).resolves.toBe(category);
    await expect(service.deleteCategory('category-1')).resolves.toBeUndefined();

    expect(axios.get).toHaveBeenCalledWith('/v1/categories/category-1');
    expect(axios.post).toHaveBeenCalledWith('/v1/categories', {
      name: 'Architecture',
      description: category.description,
    });
    expect(axios.patch).toHaveBeenCalledWith('/v1/categories/category-1', {
      description: 'Updated',
    });
    expect(axios.delete).toHaveBeenCalledWith('/v1/categories/category-1');
  });

  it('preserves ProblemDetail detail for validation and conflict failures', async () => {
    axios.post
      .mockRejectedValueOnce(problemError(400, 'Name must be between 3 and 100 characters.'))
      .mockRejectedValueOnce(problemError(409, 'Category name already exists.'));

    await expect(service.createCategory({ name: 'A' })).rejects.toThrow(
      'Validation error: Name must be between 3 and 100 characters.',
    );
    await expect(service.createCategory({ name: 'Architecture' })).rejects.toThrow(
      'Conflict: Category name already exists.',
    );
  });

  it.each([
    [401, 'Authentication required'],
    [403, 'Insufficient permissions - Admin role required'],
    [404, 'Category not found'],
    [429, 'Too many requests. Please try again later.'],
    [500, 'Server error occurred'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.get.mockRejectedValue(problemError(status, 'Backend detail'));

    await expect(service.getCategoryById('category-1')).rejects.toThrow(expectedMessage);
  });

  it('preserves status metadata and network failure context', async () => {
    axios.delete
      .mockRejectedValueOnce(problemError(403, 'Forbidden'))
      .mockRejectedValueOnce(new Error('Network unavailable'));

    await expect(service.deleteCategory('category-1')).rejects.toMatchObject({ status: 403 });
    await expect(service.deleteCategory('category-1')).rejects.toThrow('Network unavailable');
  });
});
