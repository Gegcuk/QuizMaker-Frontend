import React, { useState, useRef, useEffect } from 'react';
import { Button, Badge, Chip } from '@/components';

export interface FilterOptions {
  difficulty?: string[];
  category?: string[];
  tags?: string[];
  estimatedTime?: Array<{
    min?: number;
    max?: number;
  }>;
  status?: string[];
}

interface QuizFilterDropdownProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  className?: string;
  availableCategories?: Array<{ id: string; name: string }>;
  availableTags?: Array<{ id: string; name: string }>;
}

const QuizFilterDropdown: React.FC<QuizFilterDropdownProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className = '',
  availableCategories = [],
  availableTags = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const difficultyOptions = [
    { value: 'EASY', label: 'Easy' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HARD', label: 'Hard' }
  ];

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'ARCHIVED', label: 'Archived' }
  ];

  const timeRanges = [
    { value: '0-15', label: '0-15 min', min: 0, max: 15 },
    { value: '15-30', label: '15-30 min', min: 15, max: 30 },
    { value: '30-60', label: '30-60 min', min: 30, max: 60 },
    { value: '60+', label: '60+ min', min: 60, max: undefined }
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

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.difficulty?.length) count += filters.difficulty.length;
    if (filters.category?.length) count += filters.category.length;
    if (filters.tags?.length) count += filters.tags.length;
    if (filters.status?.length) count += filters.status.length;
    if (filters.estimatedTime?.length) count += filters.estimatedTime.length;
    return count;
  };

  const handleFilterChange = (filterType: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters };
    
    if (filterType === 'difficulty' || filterType === 'category' || filterType === 'tags' || filterType === 'status') {
      const currentValues = newFilters[filterType] as string[] || [];
      const valueIndex = currentValues.indexOf(value);
      
      if (valueIndex > -1) {
        currentValues.splice(valueIndex, 1);
      } else {
        currentValues.push(value);
      }
      
      newFilters[filterType] = currentValues.length > 0 ? currentValues : undefined;
    } else if (filterType === 'estimatedTime') {
      const currentRanges = newFilters.estimatedTime || [];
      const existingIndex = currentRanges.findIndex(
        range => range.min === value.min && range.max === value.max
      );
      
      if (existingIndex > -1) {
        // Remove range
        currentRanges.splice(existingIndex, 1);
      } else {
        // Add range
        currentRanges.push(value);
      }
      
      newFilters.estimatedTime = currentRanges.length > 0 ? currentRanges : undefined;
    }
    
    onFiltersChange(newFilters);
  };

  const activeFiltersCount = getActiveFiltersCount();

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
        {activeFiltersCount > 0 && (
          <Badge variant="primary" size="sm" className="ml-1">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-theme-bg-primary rounded-lg shadow-lg border border-theme-border-primary z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-theme-text-primary">Filters</h3>
              {activeFiltersCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClearFilters();
                    setIsOpen(false);
                  }}
                  className="!text-xs !p-0 hover:underline"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Difficulty Filter */}
            <div className="mb-4">
              <label className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider mb-2 block">
                Difficulty
              </label>
              <div className="flex flex-wrap gap-2">
                {difficultyOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    selected={filters.difficulty?.includes(option.value) || false}
                    onClick={() => handleFilterChange('difficulty', option.value)}
                  />
                ))}
              </div>
            </div>

            {/* Category Filter */}
            {availableCategories.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider mb-2 block">
                  Category
                </label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {availableCategories.map((category) => (
                    <Chip
                      key={category.id}
                      label={category.name}
                      selected={filters.category?.includes(category.id) || false}
                      onClick={() => handleFilterChange('category', category.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tags Filter */}
            {availableTags.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider mb-2 block">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      selected={filters.tags?.includes(tag.id) || false}
                      onClick={() => handleFilterChange('tags', tag.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Status Filter */}
            <div className="mb-4">
              <label className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider mb-2 block">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    selected={filters.status?.includes(option.value) || false}
                    onClick={() => handleFilterChange('status', option.value)}
                  />
                ))}
              </div>
            </div>

            {/* Duration Filter */}
            <div>
              <label className="text-xs font-medium text-theme-text-secondary uppercase tracking-wider mb-2 block">
                Duration
              </label>
              <div className="flex flex-wrap gap-2">
                {timeRanges.map((range) => (
                  <Chip
                    key={range.value}
                    label={range.label}
                    selected={filters.estimatedTime?.some(
                      t => t.min === range.min && t.max === range.max
                    ) || false}
                    onClick={() => handleFilterChange('estimatedTime', { min: range.min, max: range.max })}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizFilterDropdown; 