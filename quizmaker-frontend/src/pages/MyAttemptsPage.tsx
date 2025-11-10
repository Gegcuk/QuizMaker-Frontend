// src/pages/MyAttemptsPage.tsx
// ---------------------------------------------------------------------------
// User attempts management page
// Displays all quiz attempts (completed, in-progress, paused, abandoned)
// with filtering, sorting, and actions
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { AttemptService, QuizService, api } from '@/services';
import { 
  PageHeader, 
  Badge, 
  Spinner, 
  Button, 
  ConfirmationModal,
  useToast,
  GroupedList,
  SortDropdown
} from '@/components';
import type { GroupedListGroup, SortOption as SortOptionType } from '@/components';
import { Alert } from '@/components';
import { 
  AttemptSummaryDto
} from '@/types';
import { 
  ClockIcon, 
  PlayIcon, 
  EyeIcon, 
  TrashIcon,
  CheckCircleIcon,
  PauseIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const MyAttemptsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const attemptService = new AttemptService(api);

  // View mode type
  type ViewMode = 'list' | 'grouped';

  // State
  const [attempts, setAttempts] = useState<AttemptSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  
  // Filter dropdown state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attemptToDelete, setAttemptToDelete] = useState<AttemptSummaryDto | null>(null);
  const [isDeletingAttempt, setIsDeletingAttempt] = useState(false);

  // Load attempts
  useEffect(() => {
    const loadAttempts = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Load attempts with embedded quiz and stats (single API call!)
        const response = await attemptService.getAttemptsSummary({
          userId: user.id,
          page: 0,
          size: 1000
        });

        setAttempts(response.content);
      } catch (err: any) {
        console.error('Failed to load attempts:', err);
        setError(err.message || 'Failed to load your attempts. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAttempts();
  }, [user?.id]);

  // Update URL when filter changes
  useEffect(() => {
    if (statusFilter === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', statusFilter);
    }
    setSearchParams(searchParams, { replace: true });
  }, [statusFilter]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sort options
  const sortOptions: SortOptionType[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'quiz_asc', label: 'Quiz A-Z' },
    { value: 'quiz_desc', label: 'Quiz Z-A' },
    { value: 'completion_asc', label: 'Progress Low-High' },
    { value: 'completion_desc', label: 'Progress High-Low' }
  ];

  // Filter attempts
  const filteredAttempts = statusFilter === 'all' 
    ? attempts 
    : attempts.filter(attempt => attempt.status === statusFilter);

  // Sort attempts
  const sortedAttempts = [...filteredAttempts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      case 'oldest':
        return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
      case 'quiz_asc':
        return (a.quiz?.title || '').localeCompare(b.quiz?.title || '');
      case 'quiz_desc':
        return (b.quiz?.title || '').localeCompare(a.quiz?.title || '');
      case 'completion_asc':
        return (a.stats?.completionPercentage || 0) - (b.stats?.completionPercentage || 0);
      case 'completion_desc':
        return (b.stats?.completionPercentage || 0) - (a.stats?.completionPercentage || 0);
      default:
        return 0;
    }
  });

  // Group attempts by quiz (for grouped view)
  const groupedAttempts: GroupedListGroup<AttemptSummaryDto>[] = React.useMemo(() => {
    const groups = new Map<string, AttemptSummaryDto[]>();
    
    sortedAttempts.forEach(attempt => {
      const quizTitle = attempt.quiz?.title || 'Unknown Quiz';
      const quizId = attempt.quizId;
      const key = `${quizId}-${quizTitle}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(attempt);
    });

    return Array.from(groups.entries()).map(([key, items]) => {
      const activeCount = items.filter(a => a.status === 'IN_PROGRESS' || a.status === 'PAUSED').length;
      
      return {
        key,
        label: items[0]?.quiz?.title || 'Unknown Quiz',
        items,
        count: items.length,
        activeCount,
        metadata: { quizId: items[0]?.quizId }
      };
    });
  }, [sortedAttempts]);

  // Paginate sorted attempts (for list view)
  const totalPages = Math.ceil(sortedAttempts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAttempts = sortedAttempts.slice(startIndex, startIndex + pageSize);

  // Pagination info for display
  const startItem = sortedAttempts.length > 0 ? startIndex + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, sortedAttempts.length);

  // Reset to page 1 when filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortBy]);

  // Get page range for pagination
  const getPageRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  // Format date (date only, no time)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format duration
  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
    if (!match) return duration;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = Math.floor(parseFloat(match[3] || '0'));

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'primary';
      case 'PAUSED': return 'warning';
      case 'COMPLETED': return 'success';
      case 'ABANDONED': return 'neutral';
      default: return 'neutral';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'In Progress';
      case 'PAUSED': return 'Paused';
      case 'COMPLETED': return 'Completed';
      case 'ABANDONED': return 'Abandoned';
      default: return status;
    }
  };

  // Get mode text
  const getModeText = (mode: string) => {
    switch (mode) {
      case 'ONE_BY_ONE': return 'One by One';
      case 'ALL_AT_ONCE': return 'All at Once';
      case 'TIMED': return 'Timed';
      default: return mode;
    }
  };

  // Render attempt card (reusable for both list and grouped views)
  const renderAttemptCard = (attempt: AttemptSummaryDto) => (
    <div className="p-4 hover:bg-theme-bg-secondary transition-colors">
      {/* Desktop Layout - Side by side */}
      <div className="hidden md:flex items-start justify-between">
        <div className="flex-1">
          {/* Quiz Title (only in list view, not in grouped) */}
          {viewMode === 'list' && (
            <h4 className="font-medium text-theme-text-primary mb-2">
              {attempt.quiz?.title || 'Unknown Quiz'}
            </h4>
          )}

          {/* Metadata Row */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-theme-text-secondary">
            <span className="font-semibold text-theme-text-primary">{formatDate(attempt.startedAt)}</span>
            
            <span>•</span>
            <span>
              {attempt.quiz.questionCount} question{attempt.quiz.questionCount !== 1 ? 's' : ''}
            </span>
            
            {attempt.stats && attempt.status === 'COMPLETED' && (
              <>
                <span>•</span>
                <span className="font-medium text-theme-text-primary">
                  {Math.round(attempt.stats.accuracyPercentage)}% accuracy
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions - Right side on desktop */}
        <div className="ml-4 flex-shrink-0">
          <div className="flex space-x-2">
            {(attempt.status === 'IN_PROGRESS' || attempt.status === 'PAUSED') && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleResumeAttempt(attempt)}
                leftIcon={<PlayIcon className="w-4 h-4" />}
              >
                {attempt.status === 'PAUSED' ? 'Resume' : 'Continue'}
              </Button>
            )}
            {attempt.status === 'COMPLETED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleViewResults(attempt)}
                leftIcon={<EyeIcon className="w-4 h-4" />}
              >
                View Results
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteAttempt(attempt)}
              leftIcon={<TrashIcon className="w-4 h-4" />}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Compact with icons */}
      <div className="md:hidden">
        {/* Quiz Title (only in list view, not in grouped) */}
        {viewMode === 'list' && (
          <h4 className="font-medium text-theme-text-primary mb-2">
            {attempt.quiz?.title || 'Unknown Quiz'}
          </h4>
        )}

        {/* Metadata Row with Icon Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-theme-text-secondary flex-1 min-w-0">
            <span className="font-semibold text-theme-text-primary whitespace-nowrap">{formatDate(attempt.startedAt)}</span>
            <span>•</span>
            <span className="whitespace-nowrap">
              {attempt.quiz.questionCount} question{attempt.quiz.questionCount !== 1 ? 's' : ''}
              {attempt.stats && attempt.status === 'COMPLETED' && (
                <span className="font-medium text-theme-text-primary"> ({Math.round(attempt.stats.accuracyPercentage)}%)</span>
              )}
            </span>
          </div>

          {/* Icon Actions */}
          <div className="flex gap-1 flex-shrink-0">
            {(attempt.status === 'IN_PROGRESS' || attempt.status === 'PAUSED') && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleResumeAttempt(attempt)}
                title={attempt.status === 'PAUSED' ? 'Resume' : 'Continue'}
              >
                <PlayIcon className="w-4 h-4" />
              </Button>
            )}
            {attempt.status === 'COMPLETED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleViewResults(attempt)}
                title="View Results"
              >
                <EyeIcon className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteAttempt(attempt)}
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Handle resume attempt
  const handleResumeAttempt = async (attempt: AttemptSummaryDto) => {
    try {
      if (attempt.status === 'PAUSED') {
        await attemptService.resumeAttempt(attempt.attemptId);
      }
      navigate(`/quizzes/${attempt.quizId}/attempt?attemptId=${attempt.attemptId}`);
    } catch (error) {
      console.error('Failed to resume attempt:', error);
      addToast({
        type: 'error',
        title: 'Resume Failed',
        message: 'Failed to resume attempt. Please try again.',
        duration: 5000
      });
    }
  };

  // Handle view results
  const handleViewResults = (attempt: AttemptSummaryDto) => {
    navigate(`/quizzes/${attempt.quizId}/results?attemptId=${attempt.attemptId}`);
  };

  // Handle delete attempt
  const handleDeleteAttempt = (attempt: AttemptSummaryDto) => {
    setAttemptToDelete(attempt);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDeleteAttempt = async () => {
    if (!attemptToDelete) return;

    setIsDeletingAttempt(true);
    try {
      await attemptService.deleteAttempt(attemptToDelete.attemptId);
      setAttempts(attempts.filter(a => a.attemptId !== attemptToDelete.attemptId));
      setShowDeleteModal(false);
      setAttemptToDelete(null);
      
      addToast({
        type: 'success',
        title: 'Attempt Deleted',
        message: 'Your attempt has been successfully deleted.',
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to delete attempt:', error);
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete attempt. Please try again.',
        duration: 5000
      });
    } finally {
      setIsDeletingAttempt(false);
    }
  };

  return (
    <>
      <PageHeader
        title="My Attempts"
        subtitle="View and manage all your quiz attempts"
        showBreadcrumb={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
        {!isLoading && !error && attempts.length === 0 && (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-theme-text-tertiary" />
            <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No attempts yet</h3>
            <p className="mt-1 text-sm text-theme-text-secondary">
              Get started by taking a quiz.
            </p>
            <div className="mt-6">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => navigate('/my-quizzes')}
              >
                Browse Quizzes
              </Button>
            </div>
          </div>
        )}

        {/* Attempts Content */}
        {!isLoading && !error && attempts.length > 0 && (
          <div>
            {/* Controls Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-theme-text-secondary">
                  {sortedAttempts.length} attempt{sortedAttempts.length !== 1 ? 's' : ''} found
                </span>
              </div>

              <div className="flex items-center space-x-3">
                {/* View Mode Toggle - Hidden on mobile */}
                <div className="hidden md:inline-flex rounded-md shadow-sm" role="group">
                  <Button
                    type="button"
                    variant={viewMode === 'list' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-r-none"
                    title="List view"
                    aria-label="Switch to list view"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === 'grouped' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grouped')}
                    className="rounded-l-none -ml-px"
                    title="Grouped view"
                    aria-label="Switch to grouped view"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  </Button>
                </div>
                
                {/* Status Filter Dropdown */}
                <div className="relative" ref={filterDropdownRef}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    rounded
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                      </svg>
                    }
                    rightIcon={
                      <div className="flex items-center space-x-2">
                        {statusFilter !== 'all' && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-theme-text-inverse bg-theme-interactive-primary rounded-full">
                            1
                          </span>
                        )}
                        <svg 
                          className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    }
                  >
                    Filters
                  </Button>

                  {/* Dropdown Panel */}
                  {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-theme-bg-primary rounded-lg shadow-lg border border-theme-border-primary z-50">
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-theme-text-primary">Status Filter</h3>
                          {statusFilter !== 'all' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setStatusFilter('all');
                                setIsFilterOpen(false);
                              }}
                            >
                              Clear
                            </Button>
                          )}
                        </div>

                        {/* Status Options */}
                        <div className="space-y-2">
                          {[
                            { value: 'all', label: 'All Attempts' },
                            { value: 'IN_PROGRESS', label: 'In Progress' },
                            { value: 'PAUSED', label: 'Paused' },
                            { value: 'COMPLETED', label: 'Completed' },
                            { value: 'ABANDONED', label: 'Abandoned' }
                          ].map((option) => (
                            <label key={option.value} className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="status"
                                checked={statusFilter === option.value}
                                onChange={() => {
                                  setStatusFilter(option.value);
                                  setIsFilterOpen(false);
                                }}
                                className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary"
                              />
                              <span className="ml-2 text-sm text-theme-text-secondary">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sort Dropdown */}
                <SortDropdown
                  options={sortOptions}
                  value={sortBy}
                  onChange={setSortBy}
                />
              </div>
            </div>

            {/* Attempts Display - List or Grouped */}
            {viewMode === 'list' ? (
              <div className="grid gap-4">
                {paginatedAttempts.map((attempt) => (
                  <div
                    key={attempt.attemptId}
                    className="bg-theme-bg-primary border border-theme-border-primary rounded-lg hover:shadow-md transition-shadow"
                  >
                    {renderAttemptCard(attempt)}
                  </div>
                ))}
              </div>
            ) : (
              <GroupedList<AttemptSummaryDto>
                groups={groupedAttempts}
                renderItem={(attempt: AttemptSummaryDto) => renderAttemptCard(attempt)}
                showCount={true}
                itemLabel="attempt"
                itemLabelPlural="attempts"
                emptyMessage="No attempts found"
                defaultExpandedGroups={[]}
              />
            )}

            {/* Pagination - Only show in list view */}
            {viewMode === 'list' && totalPages > 1 && sortedAttempts.length > 0 && (
              <div className="mt-6 bg-theme-bg-primary px-4 py-3 flex items-center justify-between border border-theme-border-primary rounded-lg shadow-sm">
                {/* Results Info */}
                <div className="flex-1 flex justify-center sm:justify-start">
                  <p className="text-sm text-theme-text-secondary">
                    Showing <span className="font-medium">{startItem}</span> to{' '}
                    <span className="font-medium">{endItem}</span> of{' '}
                    <span className="font-medium">{sortedAttempts.length}</span> results
                  </p>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous page"
                    aria-label="Go to previous page"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="sr-only">Previous</span>
                  </Button>

                  {/* Page Numbers */}
                  <div className="hidden sm:flex items-center space-x-1">
                    {getPageRange().map((page, index) => (
                      <React.Fragment key={index}>
                        {page === '...' ? (
                          <span className="px-3 py-2 text-sm text-theme-text-tertiary">...</span>
                        ) : (
                          <Button
                            type="button"
                            variant={page === currentPage ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setCurrentPage(page as number)}
                            title={`Go to page ${page}`}
                            aria-label={`Go to page ${page}`}
                            aria-current={page === currentPage ? 'page' : undefined}
                          >
                            {page}
                          </Button>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Mobile Page Info */}
                  <div className="sm:hidden">
                    <span className="text-sm text-theme-text-secondary">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>

                  {/* Next Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Next page"
                    aria-label="Go to next page"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="sr-only">Next</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAttemptToDelete(null);
        }}
        onConfirm={confirmDeleteAttempt}
        title="Delete Attempt"
        message={`Are you sure you want to delete your attempt for "${attemptToDelete?.quiz?.title || 'this quiz'}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeletingAttempt}
      />
    </>
  );
};

export default MyAttemptsPage;
