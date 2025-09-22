// src/components/QuizFilters.tsx
// ---------------------------------------------------------------------------
// Advanced filtering and search based on QuizSearchCriteria
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { QuizSearchCriteria, Difficulty } from '@/types';
import { useQuizMetadata } from '@/features/quiz/hooks/useQuizMetadataQueries';

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
    <div className={`bg-white shadow rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-gray-600 hover:text-gray-500 flex items-center"
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
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={filters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
            placeholder="Search by title or description..."
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
            Difficulty
          </label>
          <select
            id="difficulty"
            value={filters.difficulty || ''}
            onChange={(e) => handleInputChange('difficulty', e.target.value || undefined)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        {/* Author Name */}
        <div>
          <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-1">
            Author
          </label>
          <input
            type="text"
            id="authorName"
            value={filters.authorName || ''}
            onChange={(e) => handleInputChange('authorName', e.target.value)}
            placeholder="Filter by author username..."
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-200 space-y-4">
          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            {metadataLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center">
                    <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
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
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-gray-500">No categories available</p>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            {metadataLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center">
                    <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
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
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">#{tag.name}</span>
                  </label>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-gray-500">No tags available</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            <button
              onClick={onClearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Clear All
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{filters.search}"
              </span>
            )}
            {filters.difficulty && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Difficulty: {filters.difficulty}
              </span>
            )}
            {filters.authorName && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Author: {filters.authorName}
              </span>
            )}
            {filters.category && filters.category.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Categories: {filters.category.length}
              </span>
            )}
            {filters.tag && filters.tag.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                Tags: {filters.tag.length}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizFilters; 