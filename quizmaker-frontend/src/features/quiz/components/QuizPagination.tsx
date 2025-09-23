// src/components/QuizPagination.tsx
// ---------------------------------------------------------------------------
// Pagination for quiz lists
// ---------------------------------------------------------------------------

import React from 'react';

interface PaginationInfo {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

interface QuizPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
}

const QuizPagination: React.FC<QuizPaginationProps> = ({
  pagination,
  onPageChange,
  onPageSizeChange,
  className = ''
}) => {
  const { pageNumber, pageSize, totalElements, totalPages } = pagination;

  // Don't render if there's only one page or no results
  if (totalPages <= 1 || totalElements === 0) {
    return null;
  }

  // Calculate page range to show
  const getPageRange = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, pageNumber - delta); i <= Math.min(totalPages - 1, pageNumber + delta); i++) {
      range.push(i);
    }

    if (pageNumber - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (pageNumber + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const pageRange = getPageRange();

  // Calculate start and end item numbers
  const startItem = (pageNumber - 1) * pageSize + 1;
  const endItem = Math.min(pageNumber * pageSize, totalElements);

  return (
    <div className={`bg-theme-bg-primary px-4 py-3 flex items-center justify-between border border-theme-border-primary rounded-b-lg shadow-sm ${className}`}>
      {/* Page Size Selector */}
      {onPageSizeChange && (
        <div className="flex items-center space-x-2">
          <label htmlFor="page-size" className="text-sm text-theme-text-secondary">
            Show:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-theme-text-secondary">per page</span>
        </div>
      )}

      {/* Results Info */}
      <div className="flex-1 flex justify-center sm:justify-start">
        <p className="text-sm text-theme-text-secondary">
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalElements}</span> results
        </p>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(pageNumber - 1)}
          disabled={pageNumber === 1}
          className={`relative inline-flex items-center px-2 py-2 rounded-md text-sm font-medium ${
            pageNumber === 1
              ? 'bg-theme-bg-tertiary text-theme-text-tertiary cursor-not-allowed'
              : 'bg-theme-bg-primary text-theme-text-tertiary hover:bg-theme-bg-tertiary border border-theme-border-primary'
          }`}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="sr-only">Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center space-x-1">
          {pageRange.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-sm text-theme-text-tertiary">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    page === pageNumber
                      ? 'bg-theme-interactive-primary text-theme-text-primary'
                      : 'bg-theme-bg-primary text-theme-text-tertiary hover:bg-theme-bg-tertiary border border-theme-border-primary'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile Page Info */}
        <div className="sm:hidden">
          <span className="text-sm text-theme-text-secondary">
            Page {pageNumber} of {totalPages}
          </span>
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(pageNumber + 1)}
          disabled={pageNumber === totalPages}
          className={`relative inline-flex items-center px-2 py-2 rounded-md text-sm font-medium ${
            pageNumber === totalPages
              ? 'bg-theme-bg-tertiary text-theme-text-tertiary cursor-not-allowed'
              : 'bg-theme-bg-primary text-theme-text-tertiary hover:bg-theme-bg-tertiary border border-theme-border-primary'
          }`}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="sr-only">Next</span>
        </button>
      </div>

      {/* Jump to Page */}
      <div className="hidden lg:flex items-center space-x-2">
        <label htmlFor="jump-page" className="text-sm text-theme-text-secondary">
          Jump to:
        </label>
        <input
          type="number"
          id="jump-page"
          min={1}
          max={totalPages}
          value={pageNumber}
          onChange={(e) => {
            const page = Number(e.target.value);
            if (page >= 1 && page <= totalPages) {
              onPageChange(page);
            }
          }}
          className="w-16 border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm"
        />
        <span className="text-sm text-theme-text-secondary">of {totalPages}</span>
      </div>
    </div>
  );
};

export default QuizPagination; 