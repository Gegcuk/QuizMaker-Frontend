import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { QuizDto } from '@/types';
import type { FilterOptions } from '../components/QuizFilterDropdown';
import type { SortOption } from '../components/QuizSortDropdown';
import { useQuizFiltering, useQuizPagination } from './useQuizFiltering';

const quizzes: QuizDto[] = [
  {
    id: 'quiz-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
    creatorId: 'user-1',
    categoryId: 'category-1',
    title: 'Beta',
    visibility: 'PRIVATE',
    difficulty: 'HARD',
    status: 'DRAFT',
    estimatedTime: 30,
    isRepetitionEnabled: false,
    timerEnabled: false,
    timerDuration: 30,
    tagIds: ['tag-1'],
  },
  {
    id: 'quiz-2',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    creatorId: 'user-1',
    categoryId: 'category-1',
    title: 'Alpha',
    visibility: 'PRIVATE',
    difficulty: 'EASY',
    status: 'PUBLISHED',
    estimatedTime: 0,
    isRepetitionEnabled: false,
    timerEnabled: false,
    timerDuration: 10,
    tagIds: ['tag-1', 'tag-2'],
  },
  {
    id: 'quiz-3',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    creatorId: 'user-1',
    categoryId: 'category-2',
    title: 'Gamma',
    visibility: 'PUBLIC',
    difficulty: 'MEDIUM',
    status: 'PUBLISHED',
    estimatedTime: 15,
    isRepetitionEnabled: false,
    timerEnabled: false,
    timerDuration: 15,
    tagIds: ['tag-2'],
  },
];

describe('useQuizFiltering', () => {
  it('combines difficulty, category, tag, status, and time filters', () => {
    const filters: FilterOptions = {
      difficulty: ['MEDIUM'],
      category: ['category-2'],
      tags: ['tag-2'],
      status: ['PUBLISHED'],
      estimatedTime: [{ min: 10, max: 20 }],
    };

    const { result } = renderHook(() =>
      useQuizFiltering(quizzes, filters, 'recommended'),
    );

    expect(result.current.map(quiz => quiz.id)).toEqual(['quiz-3']);
  });

  it('treats zero as an explicit estimated-time boundary', () => {
    const { result } = renderHook(() =>
      useQuizFiltering(quizzes, { estimatedTime: [{ max: 0 }] }, 'recommended'),
    );

    expect(result.current.map(quiz => quiz.id)).toEqual(['quiz-2']);
  });

  it.each<[SortOption, string[]]>([
    ['recommended', ['quiz-3', 'quiz-2', 'quiz-1']],
    ['newest', ['quiz-3', 'quiz-2', 'quiz-1']],
    ['title_asc', ['quiz-2', 'quiz-1', 'quiz-3']],
    ['title_desc', ['quiz-3', 'quiz-1', 'quiz-2']],
    ['createdAt_asc', ['quiz-1', 'quiz-2', 'quiz-3']],
    ['createdAt_desc', ['quiz-3', 'quiz-2', 'quiz-1']],
    ['updatedAt_asc', ['quiz-2', 'quiz-3', 'quiz-1']],
    ['updatedAt_desc', ['quiz-1', 'quiz-3', 'quiz-2']],
    ['difficulty_asc', ['quiz-2', 'quiz-3', 'quiz-1']],
    ['difficulty_desc', ['quiz-1', 'quiz-3', 'quiz-2']],
    ['estimatedTime_asc', ['quiz-2', 'quiz-3', 'quiz-1']],
    ['estimatedTime_desc', ['quiz-1', 'quiz-3', 'quiz-2']],
  ])('sorts quizzes using %s without mutating input', (sortBy, expectedIds) => {
    const originalOrder = quizzes.map(quiz => quiz.id);
    const { result } = renderHook(() => useQuizFiltering(quizzes, {}, sortBy));

    expect(result.current.map(quiz => quiz.id)).toEqual(expectedIds);
    expect(quizzes.map(quiz => quiz.id)).toEqual(originalOrder);
  });
});

describe('useQuizPagination', () => {
  it('returns the selected one-based page and stable pagination metadata', () => {
    const { result } = renderHook(() => useQuizPagination(quizzes, 2, 2));

    expect(result.current.paginatedQuizzes.map(quiz => quiz.id)).toEqual(['quiz-3']);
    expect(result.current.pagination).toEqual({
      pageNumber: 2,
      pageSize: 2,
      totalElements: 3,
      totalPages: 2,
    });
  });
});
