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
    <div className={`bg-white shadow rounded-lg border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Sort By</h3>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Choose how to sort the quiz list
        </p>
      </div>

      <div className="px-6 py-4">
        <div className="space-y-3">
          {sortOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
            >
              <input
                type="radio"
                name="sort"
                value={option.value}
                checked={sortBy === option.value}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {option.label}
                </div>
                <div className="text-sm text-gray-500">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Quick Sort Buttons */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Sort</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSortChange('createdAt_desc')}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              sortBy === 'createdAt_desc'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => onSortChange('title_asc')}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              sortBy === 'title_asc'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            A-Z
          </button>
          <button
            onClick={() => onSortChange('difficulty_asc')}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              sortBy === 'difficulty_asc'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Easy First
          </button>
          <button
            onClick={() => onSortChange('estimatedTime_asc')}
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              sortBy === 'estimatedTime_asc'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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