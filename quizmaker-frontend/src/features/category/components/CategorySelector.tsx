import React, { useState, useEffect, useRef } from 'react';
import { CategoryDto } from '@/types';
import { categoryService } from '@/services';

interface CategorySelectorProps {
  selectedCategories: CategoryDto[];
  onSelectionChange: (categories: CategoryDto[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxSelections?: number;
  showSearch?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategories,
  onSelectionChange,
  multiple = false,
  placeholder = 'Select categories...',
  className = '',
  disabled = false,
  maxSelections,
  showSearch = true
}) => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Filter categories based on search term
  useEffect(() => {
    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCategories(filtered);
  }, [categories, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await categoryService.getCategories({
        page: 0,
        size: 100, // Load more categories for better selection
        sort: 'name,asc'
      });

      setCategories(response.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDropdown = () => {
    if (disabled) return;
    
    setIsOpen(!isOpen);
    if (!isOpen && showSearch) {
      // Focus search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const handleCategorySelect = (category: CategoryDto) => {
    if (multiple) {
      const isSelected = selectedCategories.some(cat => cat.id === category.id);
      
      if (isSelected) {
        // Remove category
        const updatedSelection = selectedCategories.filter(cat => cat.id !== category.id);
        onSelectionChange(updatedSelection);
      } else {
        // Add category (check max selections)
        if (maxSelections && selectedCategories.length >= maxSelections) {
          return; // Don't add if max reached
        }
        const updatedSelection = [...selectedCategories, category];
        onSelectionChange(updatedSelection);
      }
    } else {
      // Single selection
      onSelectionChange([category]);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleRemoveCategory = (categoryId: string) => {
    const updatedSelection = selectedCategories.filter(cat => cat.id !== categoryId);
    onSelectionChange(updatedSelection);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const isCategorySelected = (category: CategoryDto) => {
    return selectedCategories.some(cat => cat.id === category.id);
  };

  const getDisplayText = () => {
    if (selectedCategories.length === 0) {
      return placeholder;
    }
    
    if (!multiple) {
      return selectedCategories[0].name;
    }
    
    if (selectedCategories.length === 1) {
      return selectedCategories[0].name;
    }
    
    return `${selectedCategories.length} categories selected`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Selector Button */}
      <button
        type="button"
        onClick={handleToggleDropdown}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left bg-theme-bg-primary border border-theme-border-primary rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? 'ring-2 ring-theme-interactive-primary border-blue-500' : 'hover:border-theme-border-secondary'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {multiple && selectedCategories.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedCategories.slice(0, 3).map(category => (
                  <span
                    key={category.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-theme-bg-info text-theme-interactive-info"
                  >
                    {category.name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCategory(category.id);
                      }}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                ))}
                {selectedCategories.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-theme-bg-tertiary text-theme-text-secondary">
                    +{selectedCategories.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span className={`block truncate ${selectedCategories.length === 0 ? 'text-theme-text-tertiary' : 'text-theme-text-primary'}`}>
                {getDisplayText()}
              </span>
            )}
          </div>
          <div className="flex items-center ml-2">
            {multiple && selectedCategories.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="mr-1 p-1 text-theme-text-tertiary hover:text-theme-text-secondary"
                title="Clear all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <svg
              className={`w-5 h-5 text-theme-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-theme-bg-primary border border-theme-border-primary rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search Input */}
          {showSearch && (
            <div className="p-2 border-b border-theme-border-primary">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-transparent"
              />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-3 text-sm text-theme-interactive-danger bg-theme-bg-danger border-b border-red-200">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-3 text-sm text-theme-text-tertiary text-center">
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-theme-text-tertiary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading categories...
              </div>
            </div>
          )}

          {/* Categories List */}
          {!loading && !error && (
            <div className="py-1">
              {filteredCategories.length === 0 ? (
                <div className="px-3 py-2 text-sm text-theme-text-tertiary text-center">
                  {searchTerm ? 'No categories found matching your search.' : 'No categories available.'}
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-theme-bg-tertiary focus:bg-theme-bg-tertiary focus:outline-none ${
                      isCategorySelected(category) ? 'bg-theme-bg-info text-blue-900' : 'text-theme-text-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{category.name}</div>
                        {category.description && (
                          <div className="text-xs text-theme-text-tertiary truncate">{category.description}</div>
                        )}
                      </div>
                      {isCategorySelected(category) && (
                        <svg className="w-4 h-4 text-theme-interactive-primary ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Max Selections Warning */}
          {multiple && maxSelections && selectedCategories.length >= maxSelections && (
            <div className="p-2 text-xs text-theme-interactive-warning bg-theme-bg-warning border-t border-amber-200">
              Maximum {maxSelections} categories selected. Remove some to add more.
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 