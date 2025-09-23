import React, { useState, useRef, useEffect } from 'react';

export interface FilterOptions {
  difficulty?: string[];
  category?: string[];
  tags?: string[];
  estimatedTime?: {
    min?: number;
    max?: number;
  };
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
    if (filters.estimatedTime?.min || filters.estimatedTime?.max) count += 1;
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
      newFilters[filterType] = value;
    }
    
    onFiltersChange(newFilters);
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-theme-text-secondary bg-theme-bg-primary border border-theme-border-primary rounded-full hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
        </svg>
        <span className="mr-2">Filters</span>
        {activeFiltersCount > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
            {activeFiltersCount}
          </span>
        )}
        <svg 
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={onClearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Difficulty Filter */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Difficulty</h4>
              <div className="space-y-2">
                {difficultyOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.difficulty?.includes(option.value) || false}
                      onChange={() => handleFilterChange('difficulty', option.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            {availableCategories.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Category</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {availableCategories.map((category) => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.category?.includes(category.id) || false}
                        onChange={() => handleFilterChange('category', category.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Filter */}
            {availableTags.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Tags</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <label key={tag.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.tags?.includes(tag.id) || false}
                        onChange={() => handleFilterChange('tags', tag.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Status Filter */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(option.value) || false}
                      onChange={() => handleFilterChange('status', option.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Duration Filter */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Duration</h4>
              <div className="space-y-2">
                {timeRanges.map((range) => (
                  <label key={range.value} className="flex items-center">
                    <input
                      type="radio"
                      name="duration"
                      checked={
                        filters.estimatedTime?.min === range.min && 
                        filters.estimatedTime?.max === range.max
                      }
                      onChange={() => handleFilterChange('estimatedTime', { min: range.min, max: range.max })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{range.label}</span>
                  </label>
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