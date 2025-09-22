import { useMemo } from 'react';
import { QuizDto } from '@/types';
import type { SortOption } from '../components/QuizSortDropdown';
import type { FilterOptions } from '../components/QuizFilterDropdown';

/**
 * Custom hook for filtering and sorting quizzes
 * Follows React best practices by extracting business logic from components
 */
export const useQuizFiltering = (
  quizzes: QuizDto[],
  filters: FilterOptions,
  sortBy: SortOption
) => {
  const filteredAndSortedQuizzes = useMemo(() => {
    let result = [...quizzes];

    // Apply filters
    if (filters.difficulty?.length) {
      result = result.filter(quiz => 
        filters.difficulty!.includes(quiz.difficulty || 'MEDIUM')
      );
    }

    if (filters.category?.length) {
      result = result.filter(quiz => 
        quiz.categoryId && filters.category!.includes(quiz.categoryId)
      );
    }

    if (filters.tags?.length) {
      result = result.filter(quiz => 
        quiz.tagIds && quiz.tagIds.some(tagId => filters.tags!.includes(tagId))
      );
    }

    if (filters.status?.length) {
      result = result.filter(quiz => 
        filters.status!.includes(quiz.status || 'DRAFT')
      );
    }

    if (filters.estimatedTime?.min !== undefined || filters.estimatedTime?.max !== undefined) {
      result = result.filter(quiz => {
        const time = quiz.estimatedTime || 0;
        const min = filters.estimatedTime?.min || 0;
        const max = filters.estimatedTime?.max || Infinity;
        return time >= min && time <= max;
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case 'title_asc':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'title_desc':
        result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      case 'createdAt_asc':
        result.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        break;
      case 'createdAt_desc':
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case 'updatedAt_asc':
        result.sort((a, b) => new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime());
        break;
      case 'updatedAt_desc':
        result.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        break;
      case 'difficulty_asc':
        result.sort((a, b) => {
          const difficultyOrder = { 'EASY': 1, 'MEDIUM': 2, 'HARD': 3 };
          return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 2) - 
                 (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 2);
        });
        break;
      case 'difficulty_desc':
        result.sort((a, b) => {
          const difficultyOrder = { 'EASY': 1, 'MEDIUM': 2, 'HARD': 3 };
          return (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 2) - 
                 (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 2);
        });
        break;
      case 'estimatedTime_asc':
        result.sort((a, b) => (a.estimatedTime || 0) - (b.estimatedTime || 0));
        break;
      case 'estimatedTime_desc':
        result.sort((a, b) => (b.estimatedTime || 0) - (a.estimatedTime || 0));
        break;
      case 'recommended':
      default:
        // Default sorting: newest first
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
    }

    return result;
  }, [quizzes, filters, sortBy]);

  return filteredAndSortedQuizzes;
};

/**
 * Custom hook for paginating filtered and sorted quizzes
 */
export const useQuizPagination = (
  filteredQuizzes: QuizDto[],
  currentPage: number,
  pageSize: number
) => {
  const paginatedQuizzes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredQuizzes.slice(startIndex, endIndex);
  }, [filteredQuizzes, currentPage, pageSize]);

  const pagination = useMemo(() => ({
    pageNumber: currentPage,
    pageSize,
    totalElements: filteredQuizzes.length,
    totalPages: Math.ceil(filteredQuizzes.length / pageSize)
  }), [filteredQuizzes.length, currentPage, pageSize]);

  return { paginatedQuizzes, pagination };
}; 