import React, { useState, useMemo } from 'react';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  sortable?: boolean;
  pagination?: {
    currentPage: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
  };
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedRows: string[]) => void;
  rowKey?: (row: T) => string;
  rowLabel?: (row: T, index: number) => string;
}

const Table = <T extends Record<string, any>>({
  data,
  columns,
  sortable = false,
  pagination,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowKey = (row: T) => row.id || row.key,
  rowLabel
}: TableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Handle sorting
  const handleSort = (key: string) => {
    if (!sortable) return;

    const column = columns.find(col => col.key === key);
    if (!column?.sortable) return;

    setSortConfig(prev => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Handle row selection
  const handleRowSelect = (row: T) => {
    if (!selectable || !onSelectionChange) return;

    const key = rowKey(row);
    const newSelectedRows = selectedRows.includes(key)
      ? selectedRows.filter(id => id !== key)
      : [...selectedRows, key];
    
    onSelectionChange(newSelectedRows);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (!selectable || !onSelectionChange) return;

    const allKeys = sortedData.map(rowKey);
    const newSelectedRows = selectedRows.length === allKeys.length
      ? []
      : allKeys;
    
    onSelectionChange(newSelectedRows);
  };

  const isAllSelected = selectedRows.length === sortedData.length && sortedData.length > 0;
  const isIndeterminate = selectedRows.length > 0 && selectedRows.length < sortedData.length;

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, row: T, index: number) => {
    if (!onRowClick || event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;

    event.preventDefault();
    onRowClick(row, index);
  };

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-theme-border-primary">
          <thead className="bg-theme-bg-secondary">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary rounded-md"
                  />
                </th>
              )}
              {columns.map(column => {
                const isSortable = Boolean(column.sortable && sortable);
                const sortDirection = sortConfig?.key === column.key ? sortConfig.direction : 'none';
                const ariaSort = sortDirection === 'asc'
                  ? 'ascending'
                  : sortDirection === 'desc'
                    ? 'descending'
                    : 'none';
                const content = (
                  <span className="flex items-center justify-between">
                    <span>{column.header}</span>
                    {isSortable && (
                      <span className="ml-2">
                        <svg
                          className={`h-4 w-4 ${
                            sortDirection === 'asc' ? 'rotate-180' : 'text-theme-text-tertiary'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </span>
                );

                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={isSortable ? ariaSort : undefined}
                    className={`px-6 py-3 text-left text-xs font-medium text-theme-text-tertiary uppercase tracking-wider ${
                      column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                    style={{ width: column.width }}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column.key)}
                        className="w-full text-left hover:bg-theme-bg-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-theme-interactive-primary"
                      >
                        {content}
                      </button>
                    ) : content}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-theme-bg-primary divide-y divide-theme-border-primary">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-4 text-center text-theme-text-tertiary"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-theme-interactive-primary mr-2"></div>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-4 text-center text-theme-text-tertiary"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr
                  key={rowKey(row)}
                  className={`${
                    onRowClick ? 'cursor-pointer hover:bg-theme-bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-theme-interactive-primary' : ''
                  } ${selectedRows.includes(rowKey(row)) ? 'bg-theme-bg-info' : ''}`}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(row, index)}
                  onKeyDown={(event) => handleRowKeyDown(event, row, index)}
                >
                  {selectable && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(rowKey(row))}
                        onChange={() => handleRowSelect(row)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${rowLabel?.(row, index) || `row ${index + 1}`}`}
                        className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                      />
                    </td>
                  )}
                  {columns.map(column => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-theme-text-primary ${
                        column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''
                      }`}
                    >
                      {column.render
                        ? column.render(row[column.key], row, index)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="bg-theme-bg-primary px-4 py-3 flex items-center justify-between border-t border-theme-border-primary sm:px-6 bg-theme-bg-primary text-theme-text-primary">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-theme-border-primary text-sm font-medium rounded-md text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed bg-theme-bg-primary text-theme-text-primary"
            >
              Previous
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= Math.ceil(pagination.total / pagination.pageSize)}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-theme-border-primary text-sm font-medium rounded-md text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed bg-theme-bg-primary text-theme-text-primary"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-theme-text-secondary">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.currentPage - 1) * pagination.pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.total}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-theme-border-primary bg-theme-bg-primary text-sm font-medium text-theme-text-tertiary hover:bg-theme-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed bg-theme-bg-primary text-theme-text-primary"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                {Array.from({ length: Math.ceil(pagination.total / pagination.pageSize) }, (_, i) => i + 1)
                  .filter(page => {
                    const totalPages = Math.ceil(pagination.total / pagination.pageSize);
                    return page === 1 || page === totalPages || Math.abs(page - pagination.currentPage) <= 1;
                  })
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="relative inline-flex items-center px-4 py-2 border border-theme-border-primary bg-theme-bg-primary text-sm font-medium text-theme-text-secondary bg-theme-bg-primary text-theme-text-primary">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => pagination.onPageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.currentPage
                            ? 'z-10 bg-theme-bg-info border-theme-border-info text-theme-interactive-primary'
                            : 'bg-theme-bg-primary border-theme-border-primary text-theme-text-tertiary hover:bg-theme-bg-secondary'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= Math.ceil(pagination.total / pagination.pageSize)}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-theme-border-primary bg-theme-bg-primary text-sm font-medium text-theme-text-tertiary hover:bg-theme-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed bg-theme-bg-primary text-theme-text-primary"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
