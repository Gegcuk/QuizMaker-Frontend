// src/hooks/useQuizMetadata.ts
// ---------------------------------------------------------------------------
// Custom hook to fetch and manage tag and category data for quiz components
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { TagDto } from '@/types';
import { CategoryDto } from '../features/category';
import { getAllTags } from '@/services';
import { getAllCategories } from '../features/category';

interface UseQuizMetadataReturn {
  tags: TagDto[];
  categories: CategoryDto[];
  isLoading: boolean;
  error: string | null;
  getTagName: (tagId: string) => string;
  getCategoryName: (categoryId?: string) => string;
}

export const useQuizMetadata = (): UseQuizMetadataReturn => {
  const [tags, setTags] = useState<TagDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch tags and categories in parallel
        const [tagsResponse, categoriesResponse] = await Promise.all([
          getAllTags({ page: 0, size: 1000 }), // Get all tags
          getAllCategories({ page: 0, size: 1000 }) // Get all categories
        ]);

        setTags(tagsResponse.content);
        setCategories(categoriesResponse.content);
      } catch (err) {
        console.error('Failed to load quiz metadata:', err);
        setError('Failed to load tags and categories');
      } finally {
        setIsLoading(false);
      }
    };

    loadMetadata();
  }, []);

  const getTagName = (tagId: string): string => {
    const tag = tags.find(t => t.id === tagId);
    return tag ? tag.name : `#${tagId}`;
  };

  const getCategoryName = (categoryId?: string): string => {
    if (!categoryId) return 'No Category';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  return {
    tags,
    categories,
    isLoading,
    error,
    getTagName,
    getCategoryName
  };
}; 