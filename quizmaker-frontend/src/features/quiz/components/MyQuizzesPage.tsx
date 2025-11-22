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
import { PageHeader, useToast, Button, Alert, Modal } from '@/components';
import type { GroupedListGroup } from '@/components';
import { ConfirmationModal } from '@/components';
import { useQuizFiltering, useQuizPagination, useResponsiveViewMode } from '@/hooks';
import QuizExportModal, { ExportOptions } from './QuizExportModal';
import { QuizService, quizGroupService } from '../services';
import { useCreateGroup } from '../hooks';
import CreateGroupModal from './CreateGroupModal';
import { QuizGroupSummaryDto, QuizSummaryDto } from '../types/quiz.types';
import type { SortOption } from './QuizSortDropdown';
import type { FilterOptions } from './QuizFilterDropdown';
import type { AxiosError } from 'axios';
import api from '@/api/axiosInstance';

interface MyQuizzesPageProps {
  className?: string;
}

// Groups View Component
interface GroupsViewProps {
  groups: GroupedListGroup<QuizDto>[];
  selectedQuizzes: string[];
  onEdit?: (quizId: string) => void;
  onDelete?: (quizId: string) => void;
  onExport?: (quizId: string) => void;
  onStart?: (quizId: string) => void;
  onSelect?: (quizId: string, selected: boolean) => void;
  onDeleteGroup?: (groupId: string) => void;
}

const GroupsView: React.FC<GroupsViewProps> = ({
  groups,
  selectedQuizzes,
  onEdit,
  onDelete,
  onExport,
  onStart,
  onSelect,
  onDeleteGroup
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isExpanded = expandedGroups.has(group.key);
        const groupColor = group.metadata?.color;
        const groupIcon = group.metadata?.icon;

        const isUngrouped = group.key === 'ungrouped';
        const groupId = group.metadata?.groupId;

        return (
          <div key={group.key} className="border border-theme-border-primary rounded-lg overflow-hidden">
            {/* Group Header */}
            <div className="flex items-center justify-between p-4 bg-theme-bg-secondary hover:bg-theme-bg-tertiary transition-colors">
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <svg
                  className={`h-5 w-5 text-theme-text-secondary flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {groupColor && (
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: groupColor }}
                    />
                  )}
                  {groupIcon && (
                    <span className="text-lg flex-shrink-0">{groupIcon}</span>
                  )}
                  <h3 
                    className="font-medium text-theme-text-primary truncate"
                    title={group.label}
                  >
                    {group.label}
                  </h3>
                </div>
              </button>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-sm text-theme-text-tertiary">
                  {group.count} {group.count === 1 ? 'quiz' : 'quizzes'}
                </span>
                {/* Delete Group Button - Only show for real groups (not ungrouped) */}
                {!isUngrouped && onDeleteGroup && groupId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGroup(groupId);
                    }}
                    className="p-1 text-theme-text-tertiary hover:text-theme-text-danger transition-colors"
                    title="Delete group"
                    aria-label="Delete group"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Group Items - Grid Layout or Empty State */}
            {isExpanded && (
              <div className="p-4 bg-theme-bg-primary">
                {group.items.length > 0 ? (
                  <QuizGrid
                    quizzes={group.items}
                    isLoading={false}
                    selectedQuizzes={selectedQuizzes}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onExport={onExport}
                    onStart={onStart}
                    onSelect={onSelect}
                    onSelectAll={undefined}
                  />
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No quizzes in this group</h3>
                    <p className="mt-1 text-sm text-theme-text-secondary">
                      Add quizzes to this group from the quiz menu.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const MyQuizzesPage: React.FC<MyQuizzesPageProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // State management
  const [quizzes, setQuizzes] = useState<QuizDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveAttempts, setHasActiveAttempts] = useState(false);
  
  // View mode - supports 'grid', 'list', and 'groups'
  // Mobile: only 'grid' and 'groups' allowed
  // Desktop: 'grid', 'list', and 'groups' allowed
  type ViewModeType = 'grid' | 'list' | 'groups';
  const { viewMode: responsiveViewMode, setViewMode: setResponsiveViewMode, isMobile } = useResponsiveViewMode({ defaultDesktopView: 'list' });
  
  // On mobile: default to grid (tiles only), can switch to groups
  // On desktop: default to list, can switch to grid, list, or groups
  const [displayViewMode, setDisplayViewMode] = useState<ViewModeType>(isMobile ? 'grid' : 'list');
  
  // On mobile: always enforce grid or groups (never list)
  useEffect(() => {
    if (isMobile && displayViewMode === 'list') {
      setDisplayViewMode('grid');
    }
  }, [isMobile, displayViewMode]);
  
  // Ensure mobile always starts with grid view
  useEffect(() => {
    if (isMobile && displayViewMode !== 'grid' && displayViewMode !== 'groups') {
      setDisplayViewMode('grid');
    }
  }, [isMobile, displayViewMode]);
  
  // Sync desktop view mode with responsive view mode (one-way: displayViewMode -> responsiveViewMode)
  // Only sync when displayViewMode changes (not when responsiveViewMode changes)
  // We track the last synced value to avoid unnecessary updates
  const lastSyncedModeRef = React.useRef<ViewModeType | null>(null);
  
  useEffect(() => {
    // Only sync if displayViewMode changed and it's not 'groups'
    if (!isMobile && displayViewMode !== 'groups' && displayViewMode !== lastSyncedModeRef.current) {
      lastSyncedModeRef.current = displayViewMode;
      setResponsiveViewMode(displayViewMode);
    }
  }, [displayViewMode, isMobile, setResponsiveViewMode]);

  // Filters and pagination
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Mobile: Track how many quizzes to display (start with 10, increment by 10)
  const [mobileDisplayedCount, setMobileDisplayedCount] = useState(10);

  // Bulk selection
  const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Confirmation modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [isAddingToGroup, setIsAddingToGroup] = useState(false);
  
  // Create group modal
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  
  // Export modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [quizToExport, setQuizToExport] = useState<QuizDto | null>(null);
  const { addToast } = useToast();

  // Quiz Groups state
  const [quizGroups, setQuizGroups] = useState<QuizGroupSummaryDto[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Cleanup: Reset modal states on route change
  useEffect(() => {
    return () => {
      setShowDeleteModal(false);
      setShowBulkDeleteModal(false);
      setShowDeleteGroupModal(false);
      setShowExportModal(false);
      setShowAddToGroupModal(false);
      setShowCreateGroupModal(false);
      setQuizToDelete(null);
      setGroupToDelete(null);
      setQuizToExport(null);
      setError(null);
    };
  }, [location.pathname]);

  // Use custom hooks for filtering, sorting, and pagination
  const filteredAndSortedQuizzes = useQuizFiltering(quizzes, filters, sortBy);
  const { paginatedQuizzes, pagination } = useQuizPagination(filteredAndSortedQuizzes, currentPage, pageSize);

  // For mobile: Get quizzes up to displayedCount
  const mobileQuizzes = React.useMemo(() => {
    return filteredAndSortedQuizzes.slice(0, mobileDisplayedCount);
  }, [filteredAndSortedQuizzes, mobileDisplayedCount]);

  // Determine which quizzes to display based on screen size
  const displayedQuizzes = isMobile ? mobileQuizzes : paginatedQuizzes;
  const hasMoreQuizzes = isMobile ? mobileDisplayedCount < filteredAndSortedQuizzes.length : false;

  // Group quizzes by their groups (for groups view)
  const groupedQuizzes: GroupedListGroup<QuizDto>[] = React.useMemo(() => {
    if (displayViewMode !== 'groups') {
      return [];
    }

    // If no groups loaded yet, return empty
    if (quizGroups.length === 0 && !isLoadingGroups) {
      return [];
    }

    const groupsMap = new Map<string, QuizDto[]>();
    const quizzesInGroups = new Set<string>();
    
    // Map quiz IDs to QuizDto objects from filtered/sorted quizzes
    const quizMap = new Map<string, QuizDto>();
    filteredAndSortedQuizzes.forEach(quiz => {
      quizMap.set(quiz.id, quiz);
    });

    // Populate groups with quizzes from previews
    quizGroups.forEach(group => {
      if (group.quizPreviews && group.quizPreviews.length > 0) {
        const groupQuizzes: QuizDto[] = [];
        group.quizPreviews.forEach(quizSummary => {
          const quiz = quizMap.get(quizSummary.id);
          if (quiz) {
            groupQuizzes.push(quiz);
            quizzesInGroups.add(quiz.id);
          }
        });
        
        if (groupQuizzes.length > 0) {
          groupsMap.set(group.id, groupQuizzes);
        } else {
          // Track empty groups (groups with 0 quizzes in the filtered list)
          groupsMap.set(group.id, []);
        }
      } else {
        // Track empty groups (no previews at all)
        groupsMap.set(group.id, []);
      }
    });

    // Separate groups into those with quizzes and those without
    const groupsWithQuizzes: GroupedListGroup<QuizDto>[] = [];
    const emptyGroups: GroupedListGroup<QuizDto>[] = [];

    quizGroups.forEach(group => {
      const groupQuizzes = groupsMap.get(group.id) || [];
      const groupData: GroupedListGroup<QuizDto> = {
        key: group.id,
        label: group.name,
        items: groupQuizzes,
        count: groupQuizzes.length,
        metadata: {
          groupId: group.id,
          description: group.description,
          color: group.color,
          icon: group.icon
        }
      };

      if (groupQuizzes.length > 0) {
        groupsWithQuizzes.push(groupData);
      } else {
        emptyGroups.push(groupData);
      }
    });

    // Sort groups with quizzes alphabetically
    groupsWithQuizzes.sort((a, b) => a.label.localeCompare(b.label));
    
    // Sort empty groups alphabetically
    emptyGroups.sort((a, b) => a.label.localeCompare(b.label));

    // Add ungrouped section if there are quizzes not in any group
    const ungroupedQuizzes = filteredAndSortedQuizzes.filter(quiz => !quizzesInGroups.has(quiz.id));
    if (ungroupedQuizzes.length > 0) {
      groupsWithQuizzes.push({
        key: 'ungrouped',
        label: 'Ungrouped',
        items: ungroupedQuizzes,
        count: ungroupedQuizzes.length,
        metadata: {}
      });
    }

    // Combine: groups with quizzes first, then empty groups at the bottom
    return [...groupsWithQuizzes, ...emptyGroups];
  }, [displayViewMode, quizGroups, filteredAndSortedQuizzes, isLoadingGroups]);

  // Update pagination state when filters/sorting change
  React.useEffect(() => {
    // Reset to first page when filters/sorting change
    setCurrentPage(1);
    // Reset mobile displayed count when filters/sorting change
    setMobileDisplayedCount(10);
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

  // Load quiz groups function
  const loadGroups = React.useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingGroups(true);
    try {
      const response = await quizGroupService.getQuizGroups({
        includeQuizzes: true,
        previewSize: 1000,
        size: 1000
      });
      setQuizGroups(response.content || []);
    } catch (error) {
      console.error('Failed to load quiz groups:', error);
      // Don't show error to user, just log it
    } finally {
      setIsLoadingGroups(false);
    }
  }, [user?.id]);

  // Create group hook - reload groups after creation
  const { handleCreateGroup } = useCreateGroup({
    onSuccess: () => {
      // Reload groups after successful creation
      loadGroups();
      setShowCreateGroupModal(false);
    }
  });

  // Load quiz groups when groups view is selected or on mount
  useEffect(() => {
    if (displayViewMode === 'groups') {
      loadGroups();
    }
  }, [displayViewMode, loadGroups]);

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

  const handleBulkAddToGroup = async () => {
    if (selectedQuizzes.length === 0) return;
    // Load groups if not already loaded
    if (quizGroups.length === 0) {
      await loadGroups();
    }
    setShowAddToGroupModal(true);
  };

  const confirmBulkAddToGroup = async (groupId: string) => {
    if (selectedQuizzes.length === 0 || !groupId) return;

    setIsAddingToGroup(true);
    try {
      // Add all selected quizzes to the group in one API call
      await quizGroupService.addQuizzesToGroup(groupId, {
        quizIds: selectedQuizzes
      });
      
      addToast({
        type: 'success',
        message: `${selectedQuizzes.length} quiz(zes) added to group successfully`
      });
      
      // Refresh groups if in groups view
      if (displayViewMode === 'groups') {
        await loadGroups();
      }
      
      // Clear selection
      setSelectedQuizzes([]);
      setShowAddToGroupModal(false);
    } catch (error: any) {
      console.error('Failed to add quizzes to group:', error);
      addToast({
        type: 'error',
        message: error.message || 'Failed to add quizzes to group. Please try again.'
      });
    } finally {
      setIsAddingToGroup(false);
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
    const quizzesToSelect = isMobile ? mobileQuizzes : paginatedQuizzes;
    if (selected) {
      setSelectedQuizzes(prev => [...new Set([...prev, ...quizzesToSelect.map(quiz => quiz.id)])]);
    } else {
      setSelectedQuizzes(prev => prev.filter(id => !quizzesToSelect.some(quiz => quiz.id === id)));
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

  const handleLoadMore = () => {
    setMobileDisplayedCount(prev => prev + 10);
  };

  const handleAttemptsLoaded = (hasAttempts: boolean) => {
    setHasActiveAttempts(hasAttempts);
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroupToDelete(groupId);
    setShowDeleteGroupModal(true);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;

    setIsDeletingGroup(true);
    try {
      await quizGroupService.deleteQuizGroup(groupToDelete);
      addToast({
        type: 'success',
        message: 'Group deleted successfully'
      });
      // Reload groups after deletion
      await loadGroups();
    } catch (error: any) {
      addToast({
        type: 'error',
        message: error.message || 'Failed to delete group. Please try again.'
      });
    } finally {
      setIsDeletingGroup(false);
      setShowDeleteGroupModal(false);
      setGroupToDelete(null);
    }
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
                  {/* Desktop: Full View Mode Toggle (Grid/List/Groups) */}
                  {!isMobile && (
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                      <Button
                        type="button"
                        variant={displayViewMode === 'grid' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setDisplayViewMode('grid')}
                        className="rounded-r-none"
                        title="Switch to tiles view"
                        aria-label="Switch to tiles view"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </Button>
                      <Button
                        type="button"
                        variant={displayViewMode === 'list' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setDisplayViewMode('list')}
                        className="rounded-none -ml-px"
                        title="List view"
                        aria-label="Switch to list view"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </Button>
                      <Button
                        type="button"
                        variant={displayViewMode === 'groups' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setDisplayViewMode('groups')}
                        className="rounded-l-none -ml-px"
                        title="Groups view"
                        aria-label="Switch to groups view"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                      </Button>
                    </div>
                  )}

                  {/* Mobile: Tiles/Groups Toggle Only */}
                  {isMobile && (
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                      <Button
                        type="button"
                        variant={displayViewMode === 'grid' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setDisplayViewMode('grid')}
                        className="rounded-r-none"
                        title="Tiles view"
                        aria-label="Switch to tiles view"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </Button>
                      <Button
                        type="button"
                        variant={displayViewMode === 'groups' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setDisplayViewMode('groups')}
                        className="rounded-l-none -ml-px"
                        title="Groups view"
                        aria-label="Switch to groups view"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
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
                      variant="secondary"
                      size="sm"
                      onClick={handleBulkAddToGroup}
                      disabled={isAddingToGroup}
                      leftIcon={
                        !isAddingToGroup ? (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        ) : undefined
                      }
                    >
                      Add to Group
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
              {displayViewMode === 'groups' ? (
                /* Groups View */
                isLoadingGroups ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-interactive-primary mx-auto"></div>
                    <p className="mt-4 text-sm text-theme-text-secondary">Loading groups...</p>
                  </div>
                ) : groupedQuizzes.length > 0 ? (
                  <GroupsView
                    groups={groupedQuizzes}
                    selectedQuizzes={selectedQuizzes}
                    onEdit={handleEditQuiz}
                    onDelete={handleDeleteQuiz}
                    onExport={handleExportQuiz}
                    onStart={handleStartQuiz}
                    onSelect={handleSelectQuiz}
                    onDeleteGroup={handleDeleteGroup}
                  />
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No groups yet</h3>
                    <p className="mt-1 text-sm text-theme-text-secondary">
                      Create a group to organize your quizzes.
                    </p>
                    <div className="mt-6">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => setShowCreateGroupModal(true)}
                        leftIcon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        }
                      >
                        Create Group
                      </Button>
                    </div>
                  </div>
                )
              ) : displayViewMode === 'grid' ? (
                <QuizGrid
                  quizzes={displayedQuizzes}
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
                  quizzes={displayedQuizzes}
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

              {/* Mobile: Load More Button - Only show for grid/list views */}
              {displayViewMode !== 'groups' && isMobile && hasMoreQuizzes && (
                <div className="mt-6 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handleLoadMore}
                  >
                    Load 10 more
                  </Button>
                </div>
              )}

              {/* Desktop: Pagination - Only show for grid/list views */}
              {displayViewMode !== 'groups' && !isMobile && (
                <QuizPagination
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  className="mt-6"
                />
              )}
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

      {/* Delete Group Modal */}
      <ConfirmationModal
        isOpen={showDeleteGroupModal}
        onClose={() => {
          setShowDeleteGroupModal(false);
          setGroupToDelete(null);
        }}
        onConfirm={confirmDeleteGroup}
        title="Delete Group"
        message="Are you sure you want to delete this group? This will not delete the quizzes in the group, only the group itself. This action cannot be undone."
        confirmText="Delete Group"
        variant="danger"
        isLoading={isDeletingGroup}
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

      {/* Add to Group Modal */}
      <Modal
        isOpen={showAddToGroupModal}
        onClose={() => setShowAddToGroupModal(false)}
        title="Add Quizzes to Group"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-theme-text-secondary">
            Select a group to add {selectedQuizzes.length} selected quiz(zes) to:
          </p>

          {isLoadingGroups ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-interactive-primary mx-auto"></div>
              <p className="mt-4 text-sm text-theme-text-secondary">Loading groups...</p>
            </div>
          ) : quizGroups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-theme-text-secondary">No groups available. Create a group first.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {quizGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => confirmBulkAddToGroup(group.id)}
                  disabled={isAddingToGroup}
                  className="w-full text-left px-4 py-3 rounded-lg border border-theme-border-primary hover:bg-theme-bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {group.color && (
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                    )}
                    {group.icon && (
                      <span className="text-lg flex-shrink-0">{group.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div 
                        className="font-medium text-theme-text-primary truncate"
                        title={group.name}
                      >
                        {group.name}
                      </div>
                      {group.description && (
                        <div 
                          className="text-sm text-theme-text-secondary truncate"
                          title={group.description}
                        >
                          {group.description}
                        </div>
                      )}
                    </div>
                    {group.quizCount > 0 && (
                      <span className="text-xs text-theme-text-tertiary flex-shrink-0">
                        {group.quizCount} quiz{group.quizCount !== 1 ? 'zes' : ''}
                      </span>
                    )}
                  </div>
                  {isAddingToGroup && (
                    <div className="flex-shrink-0">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-theme-interactive-primary"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-theme-border-primary">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddToGroupModal(false)}
              disabled={isAddingToGroup}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onCreate={handleCreateGroup}
      />
    </>
  );
};

export default MyQuizzesPage; 