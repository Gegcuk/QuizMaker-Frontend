// src/components/MyQuizzesPage.tsx
// ---------------------------------------------------------------------------
// Shows all quizzes created by the logged-in user with CRUD actions
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { QuizDto } from '../../types/quiz.types';
import { getAllQuizzes, deleteQuiz } from '../../api/quiz.service';
import { QuizGrid, QuizList, QuizFilters, QuizSort, QuizPagination } from './';
import { UserAttempts } from '../attempt';
import { PageHeader } from '../layout';
import type { SortOption } from './QuizSort';
import type { AxiosError } from 'axios';

interface MyQuizzesPageProps {
  className?: string;
}

const MyQuizzesPage: React.FC<MyQuizzesPageProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [quizzes, setQuizzes] = useState<QuizDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filters and pagination
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState<SortOption>('createdAt_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 12,
    totalElements: 0,
    totalPages: 0
  });

  // Load quizzes
  useEffect(() => {
    const loadQuizzes = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await getAllQuizzes();
        
        // Filter quizzes created by current user
        const myQuizzes = response.content?.filter(quiz => quiz.creatorId === user.id) || [];
        setQuizzes(myQuizzes);
        
        setPagination({
          pageNumber: response.pageable?.pageNumber || 1,
          pageSize: response.pageable?.pageSize || 12,
          totalElements: myQuizzes.length,
          totalPages: Math.ceil(myQuizzes.length / (response.pageable?.pageSize || 12))
        });
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        setError(axiosError.response?.data?.message || 'Failed to load your quizzes');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizzes();
  }, [user?.id, filters, sortBy, currentPage, pageSize]);

  // Handle quiz actions
  const handleEditQuiz = (quizId: string) => {
    navigate(`/quizzes/${quizId}/edit`);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      try {
        await deleteQuiz(quizId);
        // Remove from local state
        setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
      } catch (error) {
        console.error('Failed to delete quiz:', error);
        alert('Failed to delete quiz. Please try again.');
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

  const handleFiltersChange = (newFilters: any) => {
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
    <div className={className}>
      {/* Page Header */}
      <PageHeader
        title="My Quizzes & Attempts"
        subtitle="Continue your quiz attempts and manage your created quizzes"
        showBreadcrumb={true}
        actions={[
          {
            label: 'Create Quiz',
            type: 'create',
            variant: 'primary',
            href: '/quizzes/create'
          },
          {
            label: showFilters ? 'Hide Filters' : 'Show Filters',
            variant: 'secondary',
            onClick: () => setShowFilters(!showFilters)
          }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* User Attempts Section */}
        <div className="mb-8">
          <UserAttempts />
        </div>

        {/* Section Divider */}
        <div className="border-t border-gray-200 my-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Your Created Quizzes</span>
            </div>
          </div>
        </div>

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

        {/* Empty State */}
        {!isLoading && !error && quizzes.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No quizzes yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first quiz.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/quizzes/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Quiz
              </button>
            </div>
          </div>
        )}

        {/* Quiz Content */}
        {!isLoading && !error && quizzes.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Filters and Sort */}
            <div className="lg:col-span-1 space-y-6">
              {/* Filters */}
              {showFilters && (
                <QuizFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                />
              )}

              {/* Sort Options */}
              <QuizSort
                sortBy={sortBy}
                onSortChange={handleSortChange}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* View Mode Toggle and Results Info */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
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
                  <span className="text-sm text-gray-600">
                    {pagination.totalElements} quizzes found
                  </span>
                </div>

                {/* Mobile Filters Toggle */}
                <div className="lg:hidden">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </button>
                </div>
              </div>

              {/* Quiz Display */}
              {viewMode === 'grid' ? (
                <QuizGrid
                  quizzes={quizzes}
                  isLoading={isLoading}
                  onEdit={handleEditQuiz}
                  onDelete={handleDeleteQuiz}
                  onStart={handleStartQuiz}
                />
              ) : (
                <QuizList
                  quizzes={quizzes}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQuizzesPage; 