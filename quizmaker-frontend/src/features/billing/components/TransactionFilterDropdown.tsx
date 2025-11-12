// src/features/billing/components/TransactionFilterDropdown.tsx
// ---------------------------------------------------------------------------
// Filter dropdown for transaction history
// ---------------------------------------------------------------------------

import React, { useState, useRef, useEffect } from 'react';
import { Button, Badge, Chip } from '@/components';
import type { TokenTransactionType, TokenTransactionSource } from '@/types';

export interface TransactionFilterOptions {
  types?: TokenTransactionType[];
  sources?: TokenTransactionSource[];
}

interface TransactionFilterDropdownProps {
  filters: TransactionFilterOptions;
  onFiltersChange: (filters: TransactionFilterOptions) => void;
  onClearFilters: () => void;
  className?: string;
}

const TransactionFilterDropdown: React.FC<TransactionFilterDropdownProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const typeOptions: { value: TokenTransactionType; label: string }[] = [
    { value: 'PURCHASE', label: 'Purchase' },
    { value: 'COMMIT', label: 'Commit' },
    { value: 'RELEASE', label: 'Release' },
    { value: 'REFUND', label: 'Refund' },
    { value: 'ADJUSTMENT', label: 'Adjustment' }
  ];

  const sourceOptions: { value: TokenTransactionSource; label: string }[] = [
    { value: 'QUIZ_GENERATION', label: 'Quiz Generation' },
    { value: 'AI_CHECK', label: 'AI Check' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'STRIPE', label: 'Stripe' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTypeChange = (type: TokenTransactionType) => {
    const newFilters = { ...filters };
    const currentTypes = filters.types || [];
    
    if (currentTypes.includes(type)) {
      // Remove type from array
      newFilters.types = currentTypes.filter(t => t !== type);
      if (newFilters.types.length === 0) {
        delete newFilters.types;
      }
    } else {
      // Add type to array
      newFilters.types = [...currentTypes, type];
    }
    onFiltersChange(newFilters);
  };

  const handleSourceChange = (source: TokenTransactionSource) => {
    const newFilters = { ...filters };
    const currentSources = filters.sources || [];
    
    if (currentSources.includes(source)) {
      // Remove source from array
      newFilters.sources = currentSources.filter(s => s !== source);
      if (newFilters.sources.length === 0) {
        delete newFilters.sources;
      }
    } else {
      // Add source to array
      newFilters.sources = [...currentSources, source];
    }
    onFiltersChange(newFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.types && filters.types.length > 0) count += filters.types.length;
    if (filters.sources && filters.sources.length > 0) count += filters.sources.length;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Filter Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        rounded
        className="relative"
        rightIcon={
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
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
        {activeCount > 0 && (
          <Badge variant="primary" size="sm" className="ml-1">
            {activeCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-theme-bg-primary rounded-lg shadow-lg border border-theme-border-primary z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-theme-text-primary">Filters</h3>
              {activeCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClearFilters();
                    setIsOpen(false);
                  }}
                  className="!text-xs !p-0 hover:!underline"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Type Filter */}
            <div className="mb-4">
              <label className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider mb-2 block">
                Transaction Type
              </label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((option) => {
                  const isSelected = filters.types?.includes(option.value) || false;
                  return (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={isSelected}
                      onClick={() => handleTypeChange(option.value)}
                      size="sm"
                    />
                  );
                })}
              </div>
            </div>

            {/* Source Filter */}
            <div>
              <label className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider mb-2 block">
                Source
              </label>
              <div className="flex flex-wrap gap-2">
                {sourceOptions.map((option) => {
                  const isSelected = filters.sources?.includes(option.value) || false;
                  return (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={isSelected}
                      onClick={() => handleSourceChange(option.value)}
                      size="sm"
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionFilterDropdown;

