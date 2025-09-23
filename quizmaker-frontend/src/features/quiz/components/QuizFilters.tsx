// src/components/QuizFilters.tsx
// ---------------------------------------------------------------------------
// Advanced filtering and search based on QuizSearchCriteria
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { QuizSearchCriteria, Difficulty } from '@/types';
import { useQuizMetadata } from '@/features/quiz/hooks/useQuizMetadataQueries';
import { Badge } from '@/components';

interface QuizFiltersProps {
  filters: QuizSearchCriteria;
  onFiltersChange: (filters: QuizSearchCriteria) => void;
  onClearFilters: () => void;
  className?: string;
}

const QuizFilters: React.FC<QuizFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use React Query for metadata
  const { 
    categories, 
    tags, 
    isLoading: metadataLoading,
    error: metadataError 
  } = useQuizMetadata();

  // Handle input changes
  const handleInputChange = (field: keyof QuizSearchCriteria, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  // Handle array field changes (categories, tags)
  const handleArrayChange = (field: 'category' | 'tag', value: string, checked: boolean) => {
    const currentArray = filters[field] || [];
    const newArray = checked
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    onFiltersChange({
      ...filters,
      [field]: newArray.length > 0 ? newArray : undefined
    });
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && 
    (Array.isArray(value) ? value.length > 0 : value !== '')
  );

  return (
    <div className={`bg-theme-bg-primary shadow rounded-lg border border-theme-border-primary ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-theme-text-tertiary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <h3 className="text-lg font-medium text-theme-text-primary">Filters</h3>
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-sm text-theme-interactive-primary hover:text-theme-interactive-primary font-medium"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-theme-text-secondary hover:text-theme-text-tertiary flex items-center"
            >
              <svg className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {isExpanded ? 'Hide' : 'Show'} Advanced
            </button>
          </div>
        </div>
      </div>

      {/* Basic Filters */}
      <div className="px-6 py-4 space-y-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-theme-text-secondary mb-1">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={filters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
            placeholder="Search by title or description..."
            className="w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-theme-text-secondary mb-1">
            Difficulty
          </label>
          <select
            id="difficulty"
            value={filters.difficulty || ''}
            onChange={(e) => handleInputChange('difficulty', e.target.value || undefined)}
            className="w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
          >
            <option value="" className="bg-theme-bg-primary text-theme-text-primary">All Difficulties</option>
            <option value="EASY" className="bg-theme-bg-primary text-theme-text-primary">Easy</option>
            <option value="MEDIUM" className="bg-theme-bg-primary text-theme-text-primary">Medium</option>
            <option value="HARD" className="bg-theme-bg-primary text-theme-text-primary">Hard</option>
          </select>
        </div>

        {/* Author Name */}
        <div>
          <label htmlFor="authorName" className="block text-sm font-medium text-theme-text-secondary mb-1">
            Author
          </label>
          <input
            type="text"
            id="authorName"
            value={filters.authorName || ''}
            onChange={(e) => handleInputChange('authorName', e.target.value)}
            placeholder="Filter by author username..."
            className="w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="px-6 py-4 border-t border-theme-border-primary space-y-4 bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-theme-text-secondary mb-2">
              Categories
            </label>
            {metadataLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center">
                    <div className="h-4 w-4 bg-theme-bg-tertiary rounded mr-2"></div>
                    <div className="h-4 bg-theme-bg-tertiary rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(filters.category || []).includes(category.name)}
                      onChange={(e) => handleArrayChange('category', category.name, e.target.checked)}
                      className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                    />
                    <span className="ml-2 text-sm text-theme-text-secondary">{category.name}</span>
                  </label>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-theme-text-tertiary">No categories available</p>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-theme-text-secondary mb-2">
              Tags
            </label>
            {metadataLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center">
                    <div className="h-4 w-4 bg-theme-bg-tertiary rounded mr-2"></div>
                    <div className="h-4 bg-theme-bg-tertiary rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(filters.tag || []).includes(tag.name)}
                      onChange={(e) => handleArrayChange('tag', tag.name, e.target.checked)}
                      className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                    />
                    <span className="ml-2 text-sm text-theme-text-secondary">#{tag.name}</span>
                  </label>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-theme-text-tertiary">No tags available</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="px-6 py-3 bg-theme-bg-secondary border-t border-theme-border-primary bg-theme-bg-primary text-theme-text-primary">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-theme-text-secondary">Active Filters:</span>
            <button
              onClick={onClearFilters}
              className="text-sm text-theme-interactive-primary hover:text-theme-interactive-primary"
            >
              Clear All
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="primary" size="sm">
                Search: "{filters.search}"
              </Badge>
            )}
            {filters.difficulty && (
              <Badge variant="success" size="sm">
                Difficulty: {filters.difficulty}
              </Badge>
            )}
            {filters.authorName && (
              <Badge variant="info" size="sm">
                Author: {filters.authorName}
              </Badge>
            )}
            {filters.category && filters.category.length > 0 && (
              <Badge variant="warning" size="sm">
                Categories: {filters.category.length}
              </Badge>
            )}
            {filters.tag && filters.tag.length > 0 && (
              <Badge variant="info" size="sm">
                Tags: {filters.tag.length}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizFilters; 