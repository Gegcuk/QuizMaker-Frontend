import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components';

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
    { value: 'recommended' as SortOption, label: 'Recommended' },
    { value: 'newest' as SortOption, label: 'Newest First' },
    { value: 'createdAt_asc' as SortOption, label: 'Oldest First' },
    { value: 'title_asc' as SortOption, label: 'A-Z' },
    { value: 'title_desc' as SortOption, label: 'Z-A' },
    { value: 'difficulty_asc' as SortOption, label: 'Easy to Hard' },
    { value: 'difficulty_desc' as SortOption, label: 'Hard to Easy' },
    { value: 'estimatedTime_asc' as SortOption, label: 'Quick to Long' },
    { value: 'estimatedTime_desc' as SortOption, label: 'Long to Quick' }
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        rounded
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
        Sort by: {getCurrentSortLabel()}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-theme-bg-primary rounded-lg shadow-lg border border-theme-border-primary z-50 bg-theme-bg-primary text-theme-text-primary">
          <div className="py-1">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSortChange(option.value)}
                className={`w-full text-left px-4 py-2 hover:bg-theme-bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-theme-interactive-primary ${
                  sortBy === option.value ? 'bg-theme-bg-tertiary text-theme-interactive-primary' : 'text-theme-text-secondary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{option.label}</div>
                  {sortBy === option.value && (
                    <svg className="w-4 h-4 text-theme-interactive-primary" fill="currentColor" viewBox="0 0 20 20">
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