// src/features/bug-report/components/BugReportManagementPage.tsx
// ---------------------------------------------------------------------------
// Admin page for managing bug reports (super_admin only)
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Alert, Spinner, ConfirmationModal, Badge, Chip } from '@/components';
import { bugReportService } from '../services/bug-report.service';
import type { BugReportDto, BugReportStatus, BugSeverity, BugReportListParams } from '@/types';
import BugReportList from './BugReportList';
import BugReportEditModal from './BugReportEditModal';
import { useAuth } from '@/features/auth';
import { Seo } from '@/features/seo';
import type { AxiosError } from 'axios';

const BugReportManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');

  const [bugReports, setBugReports] = useState<BugReportDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBugReport, setSelectedBugReport] = useState<BugReportDto | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bugReportToDelete, setBugReportToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [statusFilters, setStatusFilters] = useState<BugReportStatus[]>([]);
  const [severityFilters, setSeverityFilters] = useState<BugSeverity[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Filter dropdown state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Redirect if not super admin
  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/my-quizzes');
    }
  }, [isSuperAdmin, navigate]);

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

  const loadBugReports = useCallback(async () => {
    if (!isSuperAdmin) return;

    setIsLoading(true);
    setError(null);

    try {
      const params: BugReportListParams = {
        page,
        size: 20,
        ...(statusFilters.length === 1 ? { status: statusFilters[0] } : {}),
        ...(severityFilters.length === 1 ? { severity: severityFilters[0] } : {}),
      };

      const response = await bugReportService.listBugReports(params);
      setBugReports(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'Failed to load bug reports');
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, page, statusFilters, severityFilters]);

  useEffect(() => {
    loadBugReports();
  }, [loadBugReports]);

  const handleEdit = (bugReport: BugReportDto) => {
    setSelectedBugReport(bugReport);
    setShowEditModal(true);
  };

  const handleDelete = (bugReportId: string) => {
    setBugReportToDelete(bugReportId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!bugReportToDelete) return;

    setIsDeleting(true);
    try {
      await bugReportService.deleteBugReport(bugReportToDelete);
      setShowDeleteModal(false);
      setBugReportToDelete(null);
      loadBugReports();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'Failed to delete bug report');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    loadBugReports();
  };

  const handleStatusToggle = (status: BugReportStatus) => {
    setStatusFilters(prev => {
      const newFilters = prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status];
      setPage(0);
      return newFilters;
    });
  };

  const handleSeverityToggle = (severity: BugSeverity) => {
    setSeverityFilters(prev => {
      const newFilters = prev.includes(severity)
        ? prev.filter(s => s !== severity)
        : [...prev, severity];
      setPage(0);
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setStatusFilters([]);
    setSeverityFilters([]);
    setPage(0);
    setIsFilterOpen(false);
  };

  if (!isSuperAdmin) {
    return null;
  }

  const activeFilterCount = statusFilters.length + severityFilters.length;

  return (
    <>
      <Seo
        title="Bug Reports Management"
        description="Manage and review bug reports submitted by users"
      />
      <PageHeader
        title="Bug Reports Management"
        subtitle="Review and manage bug reports submitted by users"
        showBreadcrumb={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        {/* Controls Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-theme-text-secondary">
              {totalElements} bug report{totalElements !== 1 ? 's' : ''} found
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Filter Button */}
            <div className="relative" ref={filterDropdownRef}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                rounded
                className="relative"
                rightIcon={
                  <svg 
                    className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                }
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="hidden sm:inline">Filter</span>
                {activeFilterCount > 0 && (
                  <Badge variant="primary" size="sm" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>

              {/* Filter Dropdown Panel */}
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-theme-bg-primary rounded-lg shadow-lg border border-theme-border-primary z-50 max-h-96 overflow-y-auto">
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-theme-text-primary">Filters</h3>
                      {activeFilterCount > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="!text-xs !p-0 hover:underline"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>

                    {/* Status Options */}
                    <div className="mb-4">
                      <label className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider mb-2 block">
                        Status
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'OPEN' as BugReportStatus, label: 'Open' },
                          { value: 'IN_PROGRESS' as BugReportStatus, label: 'In Progress' },
                          { value: 'RESOLVED' as BugReportStatus, label: 'Resolved' },
                          { value: 'DISMISSED' as BugReportStatus, label: 'Dismissed' },
                        ].map((option) => {
                          const isSelected = statusFilters.includes(option.value);
                          return (
                            <Chip
                              key={option.value}
                              label={option.label}
                              selected={isSelected}
                              onClick={() => handleStatusToggle(option.value)}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Severity Options */}
                    <div>
                      <label className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider mb-2 block">
                        Severity
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'UNSPECIFIED' as BugSeverity, label: 'Unspecified' },
                          { value: 'LOW' as BugSeverity, label: 'Low' },
                          { value: 'MEDIUM' as BugSeverity, label: 'Medium' },
                          { value: 'HIGH' as BugSeverity, label: 'High' },
                          { value: 'CRITICAL' as BugSeverity, label: 'Critical' },
                        ].map((option) => {
                          const isSelected = severityFilters.includes(option.value);
                          return (
                            <Chip
                              key={option.value}
                              label={option.label}
                              selected={isSelected}
                              onClick={() => handleSeverityToggle(option.value)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bug Reports List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <BugReportList
            bugReports={bugReports}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 bg-theme-bg-primary px-4 py-3 flex items-center justify-between border border-theme-border-primary rounded-lg shadow-sm">
            {/* Results Info */}
            <div className="flex-1 flex justify-center sm:justify-start">
              <p className="text-sm text-theme-text-secondary">
                Showing <span className="font-medium">{bugReports.length > 0 ? page * 20 + 1 : 0}</span> to{' '}
                <span className="font-medium">{Math.min((page + 1) * 20, totalElements)}</span> of{' '}
                <span className="font-medium">{totalElements}</span> results
              </p>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                title="Previous page"
                aria-label="Go to previous page"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="sr-only">Previous</span>
              </Button>

              <div className="hidden sm:flex items-center space-x-1">
                <span className="text-sm text-theme-text-secondary px-2">
                  Page {page + 1} of {totalPages}
                </span>
              </div>

              <div className="sm:hidden">
                <span className="text-sm text-theme-text-secondary">
                  {page + 1} / {totalPages}
                </span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
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

      {/* Edit Modal */}
      <BugReportEditModal
        isOpen={showEditModal}
        bugReport={selectedBugReport}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBugReport(null);
        }}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setBugReportToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Bug Report"
        message="Are you sure you want to delete this bug report? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};

export default BugReportManagementPage;
