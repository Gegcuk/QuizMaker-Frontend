// src/components/ui/Pagination.tsx
// ---------------------------------------------------------------------------
// Pagination component for navigating through paginated content.
// Features:
// • Page navigation with previous/next buttons
// • Page number display with ellipsis for large page counts
// • Customizable styling and accessibility
// • Responsive design
// ---------------------------------------------------------------------------

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Button from './Button';

export interface PaginationProps {
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Maximum number of page buttons to show */
  maxVisiblePages?: number;
  /** Custom CSS classes */
  className?: string;
  /** Whether to show page info text */
  showPageInfo?: boolean;
  /** Whether pagination is disabled */
  disabled?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  className = '',
  showPageInfo = true,
  disabled = false
}) => {
  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (page: number) => {
    if (disabled || page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    onPageChange(page);
  };

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate range to show
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      // Adjust start if we're near the end
      if (end === totalPages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      // Add first page and ellipsis if needed
      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('...');
        }
      }
      
      // Add visible pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add last page and ellipsis if needed
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`bg-theme-bg-primary px-4 py-3 flex items-center justify-between border border-theme-border-primary rounded-lg shadow-sm ${className}`}>
      {/* Page Info */}
      {showPageInfo && (
        <div className="text-sm text-theme-text-secondary">
          Page {currentPage} of {totalPages}
        </div>
      )}
      
      {/* Pagination Controls */}
      <div className="flex items-center space-x-1">
        {/* Previous Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          title="Previous page"
          aria-label="Go to previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-sm text-theme-text-tertiary"
                >
                  ...
                </span>
              );
            }
            
            const pageNumber = page as number;
            const isCurrent = pageNumber === currentPage;
            
            return (
              <Button
                key={pageNumber}
                type="button"
                variant={isCurrent ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handlePageChange(pageNumber)}
                disabled={disabled}
                title={`Go to page ${pageNumber}`}
                aria-label={`Go to page ${pageNumber}`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled || currentPage >= totalPages}
          title="Next page"
          aria-label="Go to next page"
        >
          <ChevronRightIcon className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </Button>
      </div>
    </div>
  );
};

export default Pagination; 