// src/components/MyQuizzesPage.tsx
// ---------------------------------------------------------------------------
// Shows all quizzes created by the logged-in user with CRUD actions
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { QuizDto } from '@/types';
import { getMyQuizzes, deleteQuiz } from '@/services';
import { QuizGrid, QuizList, QuizPagination, QuizSortDropdown, QuizFilterDropdown } from './';
import { UserAttempts } from '@/features/attempt';
import { PageHeader } from '@/components';
import { ConfirmationModal } from '@/components';
import { useQuizFiltering, useQuizPagination } from '@/hooks';
import type { SortOption } from './QuizSortDropdown';
import type { FilterOptions } from './QuizFilterDropdown';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Filters and pagination
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Bulk selection
  const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Confirmation modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);

  // Use custom hooks for filtering, sorting, and pagination
  const filteredAndSortedQuizzes = useQuizFiltering(quizzes, filters, sortBy);
  const { paginatedQuizzes, pagination } = useQuizPagination(filteredAndSortedQuizzes, currentPage, pageSize);

  // Update pagination state when filters/sorting change
  React.useEffect(() => {
    // Reset to first page when filters/sorting change
    setCurrentPage(1);
  }, [filteredAndSortedQuizzes.length, pageSize]);

  // Load quizzes
  useEffect(() => {
    const loadQuizzes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getMyQuizzes();
        setQuizzes(response.content || []);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        setError(axiosError.response?.data?.message || 'Failed to load your quizzes');
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
    setQuizToDelete(quizId);
    setShowDeleteModal(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;

    try {
      await deleteQuiz(quizToDelete);
      // Remove from local state
      setQuizzes(prev => prev.filter(quiz => quiz.id !== quizToDelete));
      // Remove from selected if present
      setSelectedQuizzes(prev => prev.filter(id => id !== quizToDelete));
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      alert('Failed to delete quiz. Please try again.');
    } finally {
      setShowDeleteModal(false);
      setQuizToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuizzes.length === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      // Delete all selected quizzes
      await Promise.all(selectedQuizzes.map(quizId => deleteQuiz(quizId)));
      
      // Remove from local state
      setQuizzes(prev => prev.filter(quiz => !selectedQuizzes.includes(quiz.id)));
      setSelectedQuizzes([]);
    } catch (error) {
      console.error('Failed to delete quizzes:', error);
      alert('Failed to delete some quizzes. Please try again.');
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteModal(false);
    }
  };

  const handleSelectQuiz = (quizId: string, selected: boolean) => {
    if (selected) {
      setSelectedQuizzes(prev => [...prev, quizId]);
    } else {
      setSelectedQuizzes(prev => prev.filter(id => id !== quizId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedQuizzes(prev => [...new Set([...prev, ...paginatedQuizzes.map(quiz => quiz.id)])]);
    } else {
      setSelectedQuizzes(prev => prev.filter(id => !paginatedQuizzes.some(quiz => quiz.id === id)));
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
          title="My Quizzes & Attempts"
          subtitle="Continue your quiz attempts and manage your created quizzes"
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
          {/* User Attempts Section */}
          <div className="mb-8">
            <UserAttempts />
          </div>

          {/* Section Divider */}
          <div className="border-t border-theme-border-primary my-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-theme-border-secondary" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-theme-text-secondary">Your Created Quizzes</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-theme-bg-danger border border-theme-border-danger rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-theme-interactive-danger" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-theme-interactive-danger">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && quizzes.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No quizzes yet</h3>
              <p className="mt-1 text-sm text-theme-text-secondary">
                Get started by creating your first quiz.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/quizzes/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-theme-text-inverse bg-theme-interactive-primary hover:bg-theme-interactive-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary"
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
            <div>
              {/* Controls Bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-theme-text-secondary">
                    {filteredAndSortedQuizzes.length} quizzes found
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-theme-bg-primary border border-theme-border-primary rounded-md shadow-sm bg-theme-bg-primary text-theme-text-primary">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 text-sm font-medium rounded-l-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-theme-interactive-primary text-theme-text-inverse'
                          : 'bg-theme-bg-primary text-theme-text-secondary hover:bg-theme-bg-tertiary'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 text-sm font-medium rounded-r-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-theme-interactive-primary text-theme-text-inverse'
                          : 'bg-theme-bg-primary text-theme-text-secondary hover:bg-theme-bg-tertiary'
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

              {/* Bulk Actions */}
              {selectedQuizzes.length > 0 && (
                <div className="mb-4 bg-theme-bg-info border border-theme-border-info rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-theme-text-primary">
                        {selectedQuizzes.length} quiz(zes) selected
                      </span>
                      <button
                        onClick={() => setSelectedQuizzes([])}
                        className="text-sm text-theme-interactive-primary hover:text-theme-interactive-info"
                      >
                        Clear selection
                      </button>
                    </div>
                    <button
                      onClick={handleBulkDelete}
                      disabled={isBulkDeleting}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-theme-text-inverse bg-theme-interactive-danger hover:bg-theme-bg-overlay focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-danger disabled:opacity-50"
                    >
                      {isBulkDeleting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-theme-text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Selected
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Quiz Display */}
              {viewMode === 'grid' ? (
                <QuizGrid
                  quizzes={paginatedQuizzes}
                  isLoading={isLoading}
                  selectedQuizzes={selectedQuizzes}
                  onEdit={handleEditQuiz}
                  onDelete={handleDeleteQuiz}
                  onStart={handleStartQuiz}
                  onSelect={handleSelectQuiz}
                  onSelectAll={handleSelectAll}
                />
              ) : (
                <QuizList
                  quizzes={paginatedQuizzes}
                  isLoading={isLoading}
                  selectedQuizzes={selectedQuizzes}
                  onEdit={handleEditQuiz}
                  onDelete={handleDeleteQuiz}
                  onStart={handleStartQuiz}
                  onSelect={handleSelectQuiz}
                  onSelectAll={handleSelectAll}
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
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setQuizToDelete(null);
        }}
        onConfirm={confirmDeleteQuiz}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz? This action cannot be undone."
        confirmText="Delete Quiz"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Quizzes"
        message={`Are you sure you want to delete ${selectedQuizzes.length} quiz(zes)? This action cannot be undone.`}
        confirmText="Delete Selected"
        variant="danger"
        isLoading={isBulkDeleting}
      />
    </>
  );
};

export default MyQuizzesPage; 