// src/components/QuizSort.tsx
// ---------------------------------------------------------------------------
// Sorting options for quiz lists
// ---------------------------------------------------------------------------

import React from 'react';

export type SortOption = 
  | 'title_asc'
  | 'title_desc'
  | 'createdAt_asc'
  | 'createdAt_desc'
  | 'updatedAt_asc'
  | 'updatedAt_desc'
  | 'difficulty_asc'
  | 'difficulty_desc'
  | 'estimatedTime_asc'
  | 'estimatedTime_desc';

interface QuizSortProps {
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  className?: string;
}

const QuizSort: React.FC<QuizSortProps> = ({
  sortBy,
  onSortChange,
  className = ''
}) => {
  const sortOptions = [
    {
      value: 'title_asc' as SortOption,
      label: 'Title (A-Z)',
      description: 'Sort by title alphabetically'
    },
    {
      value: 'title_desc' as SortOption,
      label: 'Title (Z-A)',
      description: 'Sort by title reverse alphabetically'
    },
    {
      value: 'createdAt_desc' as SortOption,
      label: 'Newest First',
      description: 'Sort by creation date, newest first'
    },
    {
      value: 'createdAt_asc' as SortOption,
      label: 'Oldest First',
      description: 'Sort by creation date, oldest first'
    },
    {
      value: 'updatedAt_desc' as SortOption,
      label: 'Recently Updated',
      description: 'Sort by last update, most recent first'
    },
    {
      value: 'updatedAt_asc' as SortOption,
      label: 'Least Recently Updated',
      description: 'Sort by last update, least recent first'
    },
    {
      value: 'difficulty_asc' as SortOption,
      label: 'Difficulty (Easy to Hard)',
      description: 'Sort by difficulty level, easiest first'
    },
    {
      value: 'difficulty_desc' as SortOption,
      label: 'Difficulty (Hard to Easy)',
      description: 'Sort by difficulty level, hardest first'
    },
    {
      value: 'estimatedTime_asc' as SortOption,
      label: 'Duration (Short to Long)',
      description: 'Sort by estimated time, shortest first'
    },
    {
      value: 'estimatedTime_desc' as SortOption,
      label: 'Duration (Long to Short)',
      description: 'Sort by estimated time, longest first'
    }
  ];

  return (
    <div className={`bg-theme-bg-primary shadow rounded-lg border border-theme-border-primary ${className}`}>
      <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-secondary">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-theme-text-tertiary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <h3 className="text-lg font-medium text-theme-text-primary">Sort By</h3>
        </div>
        <p className="mt-1 text-sm text-theme-text-tertiary">
          Choose how to sort the quiz list
        </p>
      </div>

      <div className="px-6 py-4">
        <div className="space-y-3">
          {sortOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-start space-x-3 cursor-pointer hover:bg-theme-bg-secondary p-2 rounded-md transition-colors"
            >
              <input
                type="radio"
                name="sort"
                value={option.value}
                checked={sortBy === option.value}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-theme-text-primary">
                  {option.label}
                </div>
                <div className="text-sm text-theme-text-tertiary">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Quick Sort Buttons */}
      <div className="px-6 py-3 bg-theme-bg-secondary border-t border-theme-border-primary">
        <h4 className="text-sm font-medium text-theme-text-secondary mb-2">Quick Sort</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSortChange('createdAt_desc')}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              sortBy === 'createdAt_desc'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-theme-bg-primary text-theme-text-secondary border border-theme-border-primary hover:bg-theme-bg-tertiary'
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => onSortChange('title_asc')}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              sortBy === 'title_asc'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-theme-bg-primary text-theme-text-secondary border border-theme-border-primary hover:bg-theme-bg-tertiary'
            }`}
          >
            A-Z
          </button>
          <button
            onClick={() => onSortChange('difficulty_asc')}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              sortBy === 'difficulty_asc'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-theme-bg-primary text-theme-text-secondary border border-theme-border-primary hover:bg-theme-bg-tertiary'
            }`}
          >
            Easy First
          </button>
          <button
            onClick={() => onSortChange('estimatedTime_asc')}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              sortBy === 'estimatedTime_asc'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-theme-bg-primary text-theme-text-secondary border border-theme-border-primary hover:bg-theme-bg-tertiary'
            }`}
          >
            Quick
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizSort; 