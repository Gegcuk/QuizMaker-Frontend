// src/features/bug-report/components/BugReportManagementPage.tsx
// ---------------------------------------------------------------------------
// Admin page for managing bug reports (super_admin only)
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Alert, Spinner, Dropdown, ConfirmationModal } from '@/components';
import { bugReportService } from '../services/bug-report.service';
import type { BugReportDto, BugReportStatus, BugSeverity, BugReportListParams } from '@/types';
import BugReportList from './BugReportList';
import BugReportEditModal from './BugReportEditModal';
import { useAuth } from '@/features/auth';
import { Seo } from '@/features/seo';
import type { AxiosError } from 'axios';
import {
  ExclamationTriangleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

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
  const [statusFilter, setStatusFilter] = useState<BugReportStatus | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<BugSeverity | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Redirect if not super admin
  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/my-quizzes');
    }
  }, [isSuperAdmin, navigate]);

  const loadBugReports = useCallback(async () => {
    if (!isSuperAdmin) return;

    setIsLoading(true);
    setError(null);

    try {
      const params: BugReportListParams = {
        page,
        size: 20,
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        ...(severityFilter !== 'ALL' ? { severity: severityFilter } : {}),
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
  }, [isSuperAdmin, page, statusFilter, severityFilter]);

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

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as BugReportStatus | 'ALL');
    setPage(0);
  };

  const handleSeverityFilterChange = (value: string) => {
    setSeverityFilter(value as BugSeverity | 'ALL');
    setPage(0);
  };

  if (!isSuperAdmin) {
    return null;
  }

  const filteredCount = bugReports.length;
  const hasFilters = statusFilter !== 'ALL' || severityFilter !== 'ALL';

  return (
    <>
      <Seo
        title="Bug Reports Management"
        description="Manage and review bug reports submitted by users"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Bug Reports Management"
          description="Review and manage bug reports submitted by users"
          actions={[]}
        />

        {error && (
          <Alert variant="error" className="mt-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-theme-text-secondary" />
            <span className="text-sm font-medium text-theme-text-secondary">Filters:</span>
          </div>

          <Dropdown
            label="Status"
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Open', value: 'OPEN' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'Resolved', value: 'RESOLVED' },
              { label: 'Dismissed', value: 'DISMISSED' },
            ]}
            value={statusFilter}
            onChange={handleStatusFilterChange}
            size="sm"
          />

          <Dropdown
            label="Severity"
            options={[
              { label: 'All Severities', value: 'ALL' },
              { label: 'Unspecified', value: 'UNSPECIFIED' },
              { label: 'Low', value: 'LOW' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'High', value: 'HIGH' },
              { label: 'Critical', value: 'CRITICAL' },
            ]}
            value={severityFilter}
            onChange={handleSeverityFilterChange}
            size="sm"
          />

          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter('ALL');
                setSeverityFilter('ALL');
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          )}

          <div className="ml-auto text-sm text-theme-text-secondary">
            Showing {filteredCount} of {totalElements} bug reports
          </div>
        </div>

        {/* Bug Reports List */}
        <div className="mt-6">
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
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-theme-text-secondary">
              Page {page + 1} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
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
