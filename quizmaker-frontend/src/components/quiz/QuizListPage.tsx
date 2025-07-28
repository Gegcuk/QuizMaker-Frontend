// src/components/QuizListPage.tsx
// ---------------------------------------------------------------------------
// Comprehensive quiz list page demonstrating integration of all quiz display components
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizDto, QuizSearchCriteria } from '../../types/quiz.types';
import { getAllQuizzes } from '../../api/quiz.service';
import { QuizCard, QuizGrid, QuizList, QuizPagination, QuizSortDropdown, QuizFilterDropdown } from './';
import { PageHeader } from '../layout';
import type { SortOption } from './QuizSortDropdown';
import type { FilterOptions } from './QuizFilterDropdown';
import type { AxiosError } from 'axios';

interface QuizListPageProps {
  className?: string;
}

const QuizListPage: React.FC<QuizListPageProps> = ({ className = '' }) => {
  const navigate = useNavigate();

  // State management
  const [quizzes, setQuizzes] = useState<QuizDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  // Filters and pagination
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 12,
    totalElements: 0,
    totalPages: 0
  });

  // Apply filters and sorting to quizzes
  const filteredAndSortedQuizzes = React.useMemo(() => {
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

  // Apply pagination
  const paginatedQuizzes = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedQuizzes.slice(startIndex, endIndex);
  }, [filteredAndSortedQuizzes, currentPage, pageSize]);

  // Update pagination when filters/sorting change
  React.useEffect(() => {
    setPagination(prev => ({
      ...prev,
      totalElements: filteredAndSortedQuizzes.length,
      totalPages: Math.ceil(filteredAndSortedQuizzes.length / pageSize)
    }));
    // Reset to first page when filters/sorting change
    setCurrentPage(1);
  }, [filteredAndSortedQuizzes.length, pageSize]);

  // Load quizzes
  useEffect(() => {
    const loadQuizzes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Update this to use proper search API with filters, sorting, and pagination
        const response = await getAllQuizzes();
        setQuizzes(response.content || []);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        setError(axiosError.response?.data?.message || 'Failed to load quizzes');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizzes();
  }, []);

  // Handle quiz actions
  const handleEditQuiz = (quizId: string) => {
    navigate(`/quizzes/${quizId}/edit`);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        // TODO: Implement delete quiz API call
        console.log('Deleting quiz:', quizId);
        // Remove from local state
        setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
      } catch (error) {
        console.error('Failed to delete quiz:', error);
      }
    }
  };

  const handleStartQuiz = (quizId: string) => {
    navigate(`/quizzes/${quizId}/attempt`);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <>
      <div className={className}>
        {/* Page Header */}
        <PageHeader
          title="All Quizzes"
          subtitle="Browse and discover quizzes created by the community"
          showBreadcrumb={true}
          actions={[
            {
              label: 'Create Quiz',
              type: 'create',
              variant: 'primary',
              href: '/quizzes/create'
            }
          ]}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quiz Content */}
          {!isLoading && !error && filteredAndSortedQuizzes.length > 0 && (
            <div>
              {/* Controls Bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {filteredAndSortedQuizzes.length} quizzes found
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-white border border-gray-300 rounded-md shadow-sm">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                        viewMode === 'grid'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 text-sm font-medium rounded-r-md ${
                        viewMode === 'list'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  {/* Filter Dropdown */}
                  <QuizFilterDropdown
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onClearFilters={handleClearFilters}
                  />

                  {/* Sort Dropdown */}
                  <QuizSortDropdown
                    sortBy={sortBy}
                    onSortChange={handleSortChange}
                  />
                </div>
              </div>

              {/* Quiz Display */}
              {viewMode === 'grid' ? (
                <QuizGrid
                  quizzes={paginatedQuizzes}
                  isLoading={isLoading}
                  onEdit={handleEditQuiz}
                  onDelete={handleDeleteQuiz}
                  onStart={handleStartQuiz}
                />
              ) : (
                <QuizList
                  quizzes={paginatedQuizzes}
                  isLoading={isLoading}
                  onEdit={handleEditQuiz}
                  onDelete={handleDeleteQuiz}
                  onStart={handleStartQuiz}
                />
              )}

              {/* Pagination */}
              <QuizPagination
                pagination={pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                className="mt-6"
              />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredAndSortedQuizzes.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No quizzes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or check back later for new quizzes.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuizListPage; 