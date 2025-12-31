// src/features/bug-report/components/BugReportList.tsx
// ---------------------------------------------------------------------------
// List component for displaying bug reports in a table format
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { Badge, Button } from '@/components';
import type { BugReportDto, BugReportStatus, BugSeverity } from '@/types';
import {
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface BugReportListProps {
  bugReports: BugReportDto[];
  isLoading?: boolean;
  onEdit?: (bugReport: BugReportDto) => void;
  onDelete?: (bugReportId: string) => void;
  className?: string;
}

const getStatusVariant = (status: BugReportStatus): 'success' | 'warning' | 'danger' | 'info' => {
  switch (status) {
    case 'RESOLVED':
      return 'success';
    case 'IN_PROGRESS':
      return 'info';
    case 'DISMISSED':
      return 'danger';
    case 'OPEN':
    default:
      return 'warning';
  }
};

const getSeverityVariant = (severity: BugSeverity): 'success' | 'warning' | 'danger' | 'info' => {
  switch (severity) {
    case 'CRITICAL':
      return 'danger';
    case 'HIGH':
      return 'danger';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'info';
    case 'UNSPECIFIED':
    default:
      return 'info';
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const BugReportList: React.FC<BugReportListProps> = ({
  bugReports,
  isLoading = false,
  onEdit,
  onDelete,
  className = '',
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className={`bg-theme-bg-primary shadow overflow-hidden sm:rounded-md ${className}`}>
        <ul className="divide-y divide-theme-border-primary">
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="animate-pulse">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="h-5 bg-theme-bg-tertiary rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-theme-bg-tertiary rounded w-1/2"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-6 bg-theme-bg-tertiary rounded w-16"></div>
                    <div className="h-6 bg-theme-bg-tertiary rounded w-20"></div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (bugReports.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-theme-text-tertiary" />
        <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No bug reports found</h3>
        <p className="mt-1 text-sm text-theme-text-secondary">
          All bug reports have been resolved or dismissed.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-theme-bg-primary shadow overflow-hidden sm:rounded-md ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-theme-border-primary">
          <thead className="bg-theme-bg-secondary">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                Message
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                Reporter
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                Severity
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-theme-bg-primary divide-y divide-theme-border-primary">
            {bugReports.map((bugReport) => {
              const isExpanded = expandedId === bugReport.id;
              return (
                <React.Fragment key={bugReport.id}>
                  <tr className="hover:bg-theme-bg-tertiary transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                          <ExclamationTriangleIcon className="h-5 w-5 text-theme-interactive-warning" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-theme-text-primary max-w-md truncate" title={bugReport.message}>
                            {bugReport.message}
                          </div>
                          {bugReport.pageUrl && (
                            <div className="text-xs text-theme-text-tertiary truncate max-w-md" title={bugReport.pageUrl}>
                              {bugReport.pageUrl}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-theme-text-primary">
                        {bugReport.reporterName || 'Anonymous'}
                      </div>
                      {bugReport.reporterEmail && (
                        <div className="text-xs text-theme-text-tertiary">
                          {bugReport.reporterEmail}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusVariant(bugReport.status)} size="sm">
                        {bugReport.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getSeverityVariant(bugReport.severity)} size="sm">
                        {bugReport.severity}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text-secondary">
                      {formatDate(bugReport.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(isExpanded ? null : bugReport.id)}
                          title={isExpanded ? 'Collapse' : 'Expand details'}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </Button>
                        {onEdit && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(bugReport)}
                            title="Edit bug report"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(bugReport.id)}
                            title="Delete bug report"
                            className="text-theme-interactive-danger hover:text-theme-interactive-danger"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-theme-bg-secondary">
                        <div className="space-y-3">
                          {bugReport.stepsToReproduce && (
                            <div>
                              <h4 className="text-sm font-medium text-theme-text-primary mb-1">Steps to Reproduce</h4>
                              <p className="text-sm text-theme-text-secondary whitespace-pre-wrap">
                                {bugReport.stepsToReproduce}
                              </p>
                            </div>
                          )}
                          {bugReport.clientVersion && (
                            <div>
                              <h4 className="text-sm font-medium text-theme-text-primary mb-1">Client Version</h4>
                              <p className="text-sm text-theme-text-secondary">{bugReport.clientVersion}</p>
                            </div>
                          )}
                          {bugReport.internalNote && (
                            <div>
                              <h4 className="text-sm font-medium text-theme-text-primary mb-1">Internal Note</h4>
                              <p className="text-sm text-theme-text-secondary whitespace-pre-wrap">
                                {bugReport.internalNote}
                              </p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4 text-xs text-theme-text-tertiary">
                            <div>
                              <span className="font-medium">Created:</span> {formatDate(bugReport.createdAt)}
                            </div>
                            <div>
                              <span className="font-medium">Updated:</span> {formatDate(bugReport.updatedAt)}
                            </div>
                            {bugReport.clientIp && (
                              <div>
                                <span className="font-medium">IP Address:</span> {bugReport.clientIp}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BugReportList;
