import React, { useState, useRef, useEffect } from 'react';

export type SortOption = 
  | 'recommended'
  | 'newest'
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

interface QuizSortDropdownProps {
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  className?: string;
}

const QuizSortDropdown: React.FC<QuizSortDropdownProps> = ({
  sortBy,
  onSortChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    {
      value: 'recommended' as SortOption,
      label: 'Recommended',
      description: 'Best matches for you'
    },
    {
      value: 'newest' as SortOption,
      label: 'Newest',
      description: 'Recently created quizzes'
    },
    {
      value: 'title_asc' as SortOption,
      label: 'A-Z',
      description: 'Alphabetical order'
    },
    {
      value: 'title_desc' as SortOption,
      label: 'Z-A',
      description: 'Reverse alphabetical order'
    },
    {
      value: 'createdAt_desc' as SortOption,
      label: 'Newest First',
      description: 'Most recently created'
    },
    {
      value: 'createdAt_asc' as SortOption,
      label: 'Oldest First',
      description: 'Least recently created'
    },
    {
      value: 'difficulty_asc' as SortOption,
      label: 'Easy to Hard',
      description: 'Difficulty level ascending'
    },
    {
      value: 'difficulty_desc' as SortOption,
      label: 'Hard to Easy',
      description: 'Difficulty level descending'
    },
    {
      value: 'estimatedTime_asc' as SortOption,
      label: 'Quick to Long',
      description: 'Shortest duration first'
    },
    {
      value: 'estimatedTime_desc' as SortOption,
      label: 'Long to Quick',
      description: 'Longest duration first'
    }
  ];

  const getCurrentSortLabel = () => {
    const currentOption = sortOptions.find(option => option.value === sortBy);
    return currentOption ? currentOption.label : 'Recommended';
  };

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

  const handleSortChange = (newSortBy: SortOption) => {
    onSortChange(newSortBy);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Sort Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
      >
        <span className="mr-2">Sort by: {getCurrentSortLabel()}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  sortBy === option.value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                  {sortBy === option.value && (
                    <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSortDropdown; 