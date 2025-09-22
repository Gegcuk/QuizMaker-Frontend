import { useQuery } from '@tanstack/react-query';
import { getAllTags, getAllCategories } from '@/services';
import { TagDto, CategoryDto } from '@/types';
import { logger } from '@/utils';

// Query keys for metadata
export const metadataKeys = {
  all: ['metadata'] as const,
  tags: () => [...metadataKeys.all, 'tags'] as const,
  categories: () => [...metadataKeys.all, 'categories'] as const,
};

// Tags query
export const useTags = () => {
  return useQuery({
    queryKey: metadataKeys.tags(),
    queryFn: async () => {
      logger.debug('Fetching tags', 'useTags');
      const response = await getAllTags({ page: 0, size: 1000 });
      return response.content;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - tags don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Categories query
export const useCategories = () => {
  return useQuery({
    queryKey: metadataKeys.categories(),
    queryFn: async () => {
      logger.debug('Fetching categories', 'useCategories');
      const response = await getAllCategories({ page: 0, size: 1000 });
      return response.content;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - categories don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Combined metadata hook with memoized selectors
export const useQuizMetadata = () => {
  const { data: tags = [], isLoading: tagsLoading, error: tagsError } = useTags();
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();

  const isLoading = tagsLoading || categoriesLoading;
  const error = tagsError || categoriesError;

  // Memoized selectors to prevent unnecessary re-renders
  const getTagName = (tagId: string): string => {
    const tag = tags.find(t => t.id === tagId);
    return tag ? tag.name : `#${tagId}`;
  };

  const getCategoryName = (categoryId?: string): string => {
    if (!categoryId) return 'No Category';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const getTagById = (tagId: string): TagDto | undefined => {
    return tags.find(t => t.id === tagId);
  };

  const getCategoryById = (categoryId: string): CategoryDto | undefined => {
    return categories.find(c => c.id === categoryId);
  };

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
