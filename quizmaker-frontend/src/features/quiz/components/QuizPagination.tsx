// src/components/QuizPagination.tsx
// ---------------------------------------------------------------------------
// Pagination for quiz lists
// ---------------------------------------------------------------------------

import React from 'react';
import { Button, Dropdown, Input } from '@/components';

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
      {/* Page Size Selector - Desktop Only */}
      <div className="hidden md:flex items-center space-x-2">
        {onPageSizeChange && (
          <>
            <span className="text-sm text-theme-text-secondary">Show:</span>
            <div className="w-24">
              <Dropdown
                options={[
                  { value: '10', label: '10' },
                  { value: '20', label: '20' },
                  { value: '50', label: '50' },
                  { value: '100', label: '100' }
                ]}
                value={String(pageSize)}
                onChange={(value) => onPageSizeChange(Number(Array.isArray(value) ? value[0] : value))}
                size="sm"
              />
            </div>
            <span className="text-sm text-theme-text-secondary">per page</span>
          </>
        )}
      </div>

      {/* Results Info - Desktop Only */}
      <div className="hidden md:flex flex-1 justify-center">
        <p className="text-sm text-theme-text-secondary">
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalElements}</span> results
        </p>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-center md:justify-end space-x-2 flex-1 md:flex-initial">
        {/* Previous Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(pageNumber - 1)}
          disabled={pageNumber === 1}
          title="Previous page"
          aria-label="Go to previous page"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="sr-only">Previous</span>
        </Button>

        {/* Page Numbers - Desktop */}
        <div className="hidden md:flex items-center space-x-1">
          {pageRange.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-sm text-theme-text-tertiary">...</span>
              ) : (
                <Button
                  type="button"
                  variant={page === pageNumber ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  title={`Go to page ${page}`}
                  aria-label={`Go to page ${page}`}
                  aria-current={page === pageNumber ? 'page' : undefined}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile Page Info */}
        <div className="md:hidden">
          <span className="text-sm text-theme-text-secondary">
            Page {pageNumber} of {totalPages}
          </span>
        </div>

        {/* Next Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(pageNumber + 1)}
          disabled={pageNumber === totalPages}
          title="Next page"
          aria-label="Go to next page"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="sr-only">Next</span>
        </Button>
      </div>

      {/* Jump to Page - Desktop Only */}
      <div className="hidden lg:flex items-center space-x-2 ml-4">
        <label htmlFor="jump-page" className="text-sm text-theme-text-secondary">
          Jump to:
        </label>
        <Input
          type="number"
          id="jump-page"
          min={1}
          max={totalPages}
          value={String(pageNumber)}
          onChange={(e) => {
            const page = Number(e.target.value);
            if (page >= 1 && page <= totalPages) {
              onPageChange(page);
            }
          }}
          size="sm"
          hideNumberSpinners
          className="!w-16"
        />
        <span className="text-sm text-theme-text-secondary">of {totalPages}</span>
      </div>
    </div>
  );
};

export default QuizPagination; 