import { useCallback } from 'react';
import { queryOptions, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { TagService, api, categoryService } from '@/services';
import type { TagDto, CategoryDto } from '@/types';
import { assertCurrentSessionGeneration, getSessionGeneration, isCurrentSessionGeneration } from '@/features/auth/services/sessionLifecycle';
import { ApplicationError } from '@/utils/applicationError';

// Pin this feature's work to the client supplied by the existing session boundary.
// Observer notifications during client replacement must not start new work on the retired client.
const clientGenerations = new WeakMap<QueryClient, number>();
export const getMetadataSessionGeneration = (client: QueryClient): number => {
  const generation = clientGenerations.get(client) ?? getSessionGeneration();
  clientGenerations.set(client, generation);
  return generation;
};

export interface MetadataListParams {
  page?: number;
  size?: number;
  sort?: string | string[];
}

const normalizeParams = (params: MetadataListParams = {}) => ({
  page: params.page ?? 0,
  size: params.size ?? 20,
  sort: typeof params.sort === 'string' ? [params.sort] : params.sort ?? ['name,ASC'],
});

// Prefixes remain compatible; every response-changing list parameter is in the key.
export const metadataKeys = {
  all: ['metadata'] as const,
  tags: () => [...metadataKeys.all, 'tags'] as const,
  categories: () => [...metadataKeys.all, 'categories'] as const,
  tagList: (params?: MetadataListParams) => [...metadataKeys.tags(), 'list', normalizeParams(params)] as const,
  categoryList: (params?: MetadataListParams) => [...metadataKeys.categories(), 'list', normalizeParams(params)] as const,
  tag: (id: string) => [...metadataKeys.tags(), 'detail', id] as const,
  category: (id: string) => [...metadataKeys.categories(), 'detail', id] as const,
  deletedTags: () => [...metadataKeys.tags(), 'deleted'] as const,
  deletedCategories: () => [...metadataKeys.categories(), 'deleted'] as const,
};

export type DeletedTaxonomy<T> = Record<string, T>;

// Confirmed deletions are session-local evidence, never inferred from a partial page.
const useDeleted = <T,>(queryKey: readonly string[]) => useQuery({
  queryKey,
  queryFn: async (): Promise<DeletedTaxonomy<T>> => ({}),
  initialData: {} as DeletedTaxonomy<T>,
  enabled: false,
  staleTime: Infinity,
  gcTime: Infinity,
}).data;

export const useDeletedTags = () => useDeleted<TagDto>(metadataKeys.deletedTags());
export const useDeletedCategories = () => useDeleted<CategoryDto>(metadataKeys.deletedCategories());

const metadataTimes = { staleTime: 15 * 60 * 1000, gcTime: 30 * 60 * 1000 };

export const useTagPage = (params?: MetadataListParams, enabled = true, metadataDefaults = false) => {
  const client = useQueryClient();
  const generation = getMetadataSessionGeneration(client);
  return useQuery({
    queryKey: metadataKeys.tagList(params),
    queryFn: async ({ signal }) => {
      assertCurrentSessionGeneration(generation);
      const page = await new TagService(api).getTags(params, signal);
      signal.throwIfAborted();
      assertCurrentSessionGeneration(generation);
      const deleted = client.getQueryData<DeletedTaxonomy<TagDto>>(metadataKeys.deletedTags()) ?? {};
      return { ...page, content: page.content.filter(tag => !deleted[tag.id]) };
    },
    enabled: enabled && isCurrentSessionGeneration(generation),
    // Legacy screens fetched on mount and offered manual recovery without automatic retries.
    retry: metadataDefaults ? client.getDefaultOptions().queries?.retry : false,
    refetchOnMount: metadataDefaults ? true : 'always',
    ...metadataTimes,
    // Parameter changes can revisit a cached page without remounting the screen.
    // Legacy readers refresh on navigation; cards/filters keep metadata freshness.
    staleTime: metadataDefaults ? metadataTimes.staleTime : 0,
  });
};

export const useCategoryPage = (params?: MetadataListParams, enabled = true, metadataDefaults = false) => {
  const client = useQueryClient();
  const generation = getMetadataSessionGeneration(client);
  return useQuery({
    queryKey: metadataKeys.categoryList(params),
    queryFn: async ({ signal }) => {
      assertCurrentSessionGeneration(generation);
      const page = await categoryService.getCategories(params, signal);
      signal.throwIfAborted();
      assertCurrentSessionGeneration(generation);
      const deleted = client.getQueryData<DeletedTaxonomy<CategoryDto>>(metadataKeys.deletedCategories()) ?? {};
      return { ...page, content: page.content.filter(category => !deleted[category.id]) };
    },
    enabled: enabled && isCurrentSessionGeneration(generation),
    retry: metadataDefaults ? client.getDefaultOptions().queries?.retry : false,
    refetchOnMount: metadataDefaults ? true : 'always',
    ...metadataTimes,
    staleTime: metadataDefaults ? metadataTimes.staleTime : 0,
  });
};

export const tagDetailOptions = (id: string) => queryOptions({
  queryKey: metadataKeys.tag(id),
  queryFn: async ({ signal, client }) => {
    const generation = getMetadataSessionGeneration(client);
    assertCurrentSessionGeneration(generation);
    if (client.getQueryData<DeletedTaxonomy<TagDto>>(metadataKeys.deletedTags())?.[id]) {
      throw new ApplicationError({ category: 'gone', status: 410 });
    }
    const tag = await new TagService(api).getTagById(id, signal);
    signal.throwIfAborted();
    assertCurrentSessionGeneration(generation);
    if (client.getQueryData<DeletedTaxonomy<TagDto>>(metadataKeys.deletedTags())?.[id]) {
      throw new ApplicationError({ category: 'gone', status: 410 });
    }
    return tag;
  },
  ...metadataTimes,
  retry: false,
});

export const categoryDetailOptions = (id: string) => queryOptions({
  queryKey: metadataKeys.category(id),
  queryFn: async ({ signal, client }) => {
    const generation = getMetadataSessionGeneration(client);
    assertCurrentSessionGeneration(generation);
    if (client.getQueryData<DeletedTaxonomy<CategoryDto>>(metadataKeys.deletedCategories())?.[id]) {
      throw new ApplicationError({ category: 'gone', status: 410 });
    }
    const category = await categoryService.getCategoryById(id, signal);
    signal.throwIfAborted();
    assertCurrentSessionGeneration(generation);
    if (client.getQueryData<DeletedTaxonomy<CategoryDto>>(metadataKeys.deletedCategories())?.[id]) {
      throw new ApplicationError({ category: 'gone', status: 410 });
    }
    return category;
  },
  ...metadataTimes,
  retry: false,
});

// Preserve the existing array-based convenience API for cards and filters.
export const useTags = () => {
  const query = useTagPage({ page: 0, size: 1000 }, true, true);
  return { ...query, data: query.data?.content };
};
export const useCategories = () => {
  const query = useCategoryPage({ page: 0, size: 1000 }, true, true);
  return { ...query, data: query.data?.content };
};

// Combined metadata hook with memoized selectors
export const useQuizMetadata = () => {
  const { data: tags = [], isLoading: tagsLoading, error: tagsError } = useTags();
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();

  const isLoading = tagsLoading || categoriesLoading;
  const error = tagsError || categoriesError;

  // Memoized selectors to prevent unnecessary re-renders
  const getTagName = useCallback((tagId: string): string => {
    const tag = tags.find(t => t.id === tagId);
    return tag ? tag.name : `#${tagId}`;
  }, [tags]);

  const getCategoryName = useCallback((categoryId?: string): string => {
    if (!categoryId) return 'No Category';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }, [categories]);

  const getTagById = useCallback((tagId: string): TagDto | undefined => {
    return tags.find(t => t.id === tagId);
  }, [tags]);

  const getCategoryById = useCallback((categoryId: string): CategoryDto | undefined => {
    return categories.find(c => c.id === categoryId);
  }, [categories]);

  return {
    tags,
    categories,
    isLoading,
    error: error?.message || null,
    getTagName,
    getCategoryName,
    getTagById,
    getCategoryById,
  };
};
