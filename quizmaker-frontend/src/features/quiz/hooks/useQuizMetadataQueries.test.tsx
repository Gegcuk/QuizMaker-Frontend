import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper, createTestQueryClient } from '@/test/render';
import { metadataKeys, useCategories, useQuizMetadata, useTags } from './useQuizMetadataQueries';

const serviceMocks = vi.hoisted(() => ({
  getAllCategories: vi.fn(),
  getAllTags: vi.fn(),
}));

vi.mock('@/services', () => serviceMocks);

const tag = {
  id: 'tag-1',
  name: 'Architecture',
  createdAt: '2026-07-07T12:00:00Z',
  updatedAt: '2026-07-07T12:00:00Z',
};

const category = {
  id: 'category-1',
  name: 'Software Design',
};

describe('quiz metadata hooks', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('defines stable metadata query keys', () => {
    expect(metadataKeys.all).toEqual(['metadata']);
    expect(metadataKeys.tags()).toEqual(['metadata', 'tags']);
    expect(metadataKeys.categories()).toEqual(['metadata', 'categories']);
  });

  it('loads tag and category collections with deployed page parameters', async () => {
    serviceMocks.getAllTags.mockResolvedValue({ content: [tag] });
    serviceMocks.getAllCategories.mockResolvedValue({ content: [category] });
    const queryClient = createTestQueryClient();
    const wrapper = createQueryWrapper(queryClient);

    const tagsHook = renderHook(() => useTags(), { wrapper });
    const categoriesHook = renderHook(() => useCategories(), { wrapper });

    expect(tagsHook.result.current.isLoading).toBe(true);
    expect(categoriesHook.result.current.isLoading).toBe(true);
    await waitFor(() => expect(tagsHook.result.current.data).toEqual([tag]));
    await waitFor(() => expect(categoriesHook.result.current.data).toEqual([category]));

    expect(serviceMocks.getAllTags).toHaveBeenCalledWith({ page: 0, size: 1000 });
    expect(serviceMocks.getAllCategories).toHaveBeenCalledWith({ page: 0, size: 1000 });
  });

  it('combines metadata and exposes memoized lookup helpers', async () => {
    serviceMocks.getAllTags.mockResolvedValue({ content: [tag] });
    serviceMocks.getAllCategories.mockResolvedValue({ content: [category] });
    const queryClient = createTestQueryClient();
    const wrapper = createQueryWrapper(queryClient);
    const { result, rerender } = renderHook(() => useQuizMetadata(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tags).toEqual([tag]);
    expect(result.current.categories).toEqual([category]);
    expect(result.current.getTagName('tag-1')).toBe('Architecture');
    expect(result.current.getTagName('missing')).toBe('#missing');
    expect(result.current.getCategoryName('category-1')).toBe('Software Design');
    expect(result.current.getCategoryName('missing')).toBe('Unknown Category');
    expect(result.current.getCategoryName()).toBe('No Category');
    expect(result.current.getTagById('tag-1')).toEqual(tag);
    expect(result.current.getCategoryById('category-1')).toEqual(category);

    const helpers = {
      getTagName: result.current.getTagName,
      getCategoryName: result.current.getCategoryName,
      getTagById: result.current.getTagById,
      getCategoryById: result.current.getCategoryById,
    };
    await act(async () => rerender());
    expect(result.current.getTagName).toBe(helpers.getTagName);
    expect(result.current.getCategoryName).toBe(helpers.getCategoryName);
    expect(result.current.getTagById).toBe(helpers.getTagById);
    expect(result.current.getCategoryById).toBe(helpers.getCategoryById);
  });

  it('surfaces a metadata query error after the combined loading state settles', async () => {
    serviceMocks.getAllTags.mockRejectedValue(new Error('Tags unavailable'));
    serviceMocks.getAllCategories.mockResolvedValue({ content: [category] });
    const queryClient = createTestQueryClient();
    const wrapper = createQueryWrapper(queryClient);
    const { result } = renderHook(() => useQuizMetadata(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Tags unavailable');
    expect(result.current.tags).toEqual([]);
    expect(result.current.categories).toEqual([category]);
  });
});
