// src/components/MyQuizzesPage.tsx
// ---------------------------------------------------------------------------
// Shows all quizzes created by the logged-in user with CRUD actions
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { QuizDto } from '@/types';
import { getMyQuizzes, deleteQuiz } from '@/services';
import { QuizGrid, QuizList, QuizPagination, QuizSortDropdown, QuizFilterDropdown } from './';
import { UserAttempts } from '@/features/attempt';
import { PageHeader, useToast, Button, Alert } from '@/components';
import { ConfirmationModal } from '@/components';
import { useQuizFiltering, useQuizPagination, useResponsiveViewMode } from '@/hooks';
import QuizExportModal, { ExportOptions } from './QuizExportModal';
import { QuizService } from '../services/quiz.service';
import { api } from '@/services';
import type { SortOption } from './QuizSortDropdown';
import type { FilterOptions } from './QuizFilterDropdown';
import type { AxiosError } from 'axios';

interface MyQuizzesPageProps {
  className?: string;
}

const MyQuizzesPage: React.FC<MyQuizzesPageProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // State management
  const [quizzes, setQuizzes] = useState<QuizDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveAttempts, setHasActiveAttempts] = useState(false);
  
  // Responsive view mode - automatically switches to grid on mobile
  const { viewMode, setViewMode, isMobile } = useResponsiveViewMode({ defaultDesktopView: 'list' });

  // Filters and pagination
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Bulk selection
  const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Confirmation modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  
  // Export modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [quizToExport, setQuizToExport] = useState<QuizDto | null>(null);
  const { addToast } = useToast();

  // Cleanup: Reset modal states on route change
  useEffect(() => {
    return () => {
      setShowDeleteModal(false);
      setShowBulkDeleteModal(false);
      setShowExportModal(false);
      setQuizToDelete(null);
      setQuizToExport(null);
      setError(null);
    };
  }, [location.pathname]);

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
        // Load all quizzes at once for client-side pagination
        // Set a large size to get all user's quizzes (backend default is only 20)
        const response = await getMyQuizzes({ size: 1000 });
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
    navigate(`/quizzes/${quizId}?tab=management`);
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

  const handleExportQuiz = (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (quiz) {
      setQuizToExport(quiz);
      setShowExportModal(true);
    }
  };

  const handleExport = async (format: string, options: ExportOptions) => {
    if (!quizToExport) return;

    try {
      const quizService = new QuizService(api);
      
      // Call the export API with proper types
      const blob = await quizService.exportQuizzes({
        format: format as import('@/types').QuizExportFormat,
        scope: 'me',
        quizIds: [quizToExport.id],
        includeCover: options.includeCover,
        includeMetadata: options.includeMetadata,
        answersOnSeparatePages: options.answersOnSeparatePages,
        includeHints: options.includeHints,
        includeExplanations: options.includeExplanations,
        groupQuestionsByType: options.groupQuestionsByType
      });
      
      // Determine file extension
      const extensionMap: Record<string, string> = {
        'JSON_EDITABLE': 'json',
        'XLSX_EDITABLE': 'xlsx',
        'HTML_PRINT': 'html',
        'PDF_PRINT': 'pdf'
      };
      const extension = extensionMap[format] || 'file';
      
      // Create download link
      const fileName = `${quizToExport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.${extension}`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addToast({
        type: 'success',
        message: `Quiz "${quizToExport.title}" exported successfully`
      });
      
      setShowExportModal(false);
      setQuizToExport(null);
    } catch (error) {
      console.error('Export failed:', error);
      addToast({
        type: 'error',
        message: 'Failed to export quiz. Please try again.'
      });
    }
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

  const handleAttemptsLoaded = (hasAttempts: boolean) => {
    setHasActiveAttempts(hasAttempts);
  };

  return (
    <>
      <div className={className}>
        {/* Page Header */}
        <PageHeader
          title={hasActiveAttempts ? "My Quizzes & Attempts" : "My Quizzes"}
          subtitle={hasActiveAttempts ? "Continue your quiz attempts and manage your created quizzes" : "Manage your created quizzes"}
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
          {/* User Attempts Section - Always render to allow callback to fire */}
          <UserAttempts onAttemptsLoaded={handleAttemptsLoaded} />

          {/* Section Divider - Only show if there are active attempts */}
          {hasActiveAttempts && (
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
          )}

          {/* Error Message */}
          {error && (
            <Alert 
              type="error" 
              dismissible 
              onDismiss={() => setError(null)}
              className="mb-6"
            >
              {error}
            </Alert>
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
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/quizzes/create')}
                  leftIcon={
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  }
                >
                  Create Quiz
                </Button>
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
                  {/* View Mode Toggle - Hidden on mobile since grid is enforced */}
                  {!isMobile && (
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                      <Button
                        type="button"
                        variant={viewMode === 'grid' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="rounded-r-none"
                        title="Grid view"
                        aria-label="Switch to grid view"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </Button>
                      <Button
                        type="button"
                        variant={viewMode === 'list' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="rounded-l-none -ml-px"
                        title="List view"
                        aria-label="Switch to list view"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </Button>
                    </div>
                  )}

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
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-theme-text-primary">
                      {selectedQuizzes.length} quiz(zes) selected
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedQuizzes([])}
                    >
                      Clear selection
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={isBulkDeleting}
                      loading={isBulkDeleting}
                      leftIcon={
                        !isBulkDeleting ? (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        ) : undefined
                      }
                    >
                      {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
                    </Button>
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
                  onExport={handleExportQuiz}
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
                  onExport={handleExportQuiz}
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

      {/* Export Modal */}
      {quizToExport && (
        <QuizExportModal
          isOpen={showExportModal}
          onClose={() => {
            setShowExportModal(false);
            setQuizToExport(null);
          }}
          quiz={quizToExport}
          onExport={handleExport}
        />
      )}
    </>
  );
};

export default MyQuizzesPage; 