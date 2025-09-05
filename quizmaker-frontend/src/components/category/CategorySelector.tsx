import React, { useState, useEffect, useRef } from 'react';
import { CategoryService } from '../../api/category.service';
import api from '../../api/axiosInstance';
import { CategoryDto } from '../../types/category.types';

interface CategorySelectorProps {
  selectedCategories?: string[] | string;
  onSelectionChange?: (selected: string[] | string) => void;
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  selectedCategories,
  onSelectionChange,
  multiple = false,
  placeholder = 'Select category...',
  disabled = false,
  required = false,
  error: propError,
  className = '' 
}) => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [internalError, setInternalError] = useState<string | null>(null);

  const categoryService = new CategoryService(api);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize selected values
  const [selectedIds, setSelectedIds] = useState<string[]>(
    multiple 
      ? (Array.isArray(selectedCategories) ? selectedCategories : [])
      : (typeof selectedCategories === 'string' && selectedCategories ? [selectedCategories] : [])
  );

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, searchTerm]);

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

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setInternalError(null);
      
      const response = await categoryService.getCategories({ size: 100 });
      setCategories(response.content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
      setInternalError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCategories = () => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCategories(filtered);
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategorySelect = (categoryId: string) => {
    let newSelectedIds: string[];

    if (multiple) {
      if (selectedIds.includes(categoryId)) {
        newSelectedIds = selectedIds.filter(id => id !== categoryId);
      } else {
        newSelectedIds = [...selectedIds, categoryId];
      }
    } else {
      newSelectedIds = [categoryId];
      setIsOpen(false);
    }

    setSelectedIds(newSelectedIds);
    
    if (onSelectionChange) {
      if (multiple) {
        onSelectionChange(newSelectedIds);
      } else {
        onSelectionChange(newSelectedIds[0] || '');
      }
    }
  };

  const handleRemoveSelection = (categoryId: string) => {
    const newSelectedIds = selectedIds.filter(id => id !== categoryId);
    setSelectedIds(newSelectedIds);
    
    if (onSelectionChange) {
      if (multiple) {
        onSelectionChange(newSelectedIds);
      } else {
        onSelectionChange(newSelectedIds[0] || '');
      }
    }
  };

  const getSelectedCategories = () => {
    return categories.filter(category => selectedIds.includes(category.id));
  };

  const getDisplayText = () => {
    const selected = getSelectedCategories();
    
    if (selected.length === 0) {
      return placeholder;
    }
    
    if (multiple) {
      if (selected.length === 1) {
        return selected[0].name;
      }
      return `${selected.length} categories selected`;
    }
    
    return selected[0].name;
  };

  const isSelected = (categoryId: string) => {
    return selectedIds.includes(categoryId);
  };

  const selectedCategoriesList = getSelectedCategories();

  return (
    <div className={`relative ${className}`}>
      {/* Main Input */}
      <div
        ref={dropdownRef}
        className={`relative cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <div
          onClick={handleToggle}
          className={`w-full px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            propError ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-wrap gap-1 min-h-6">
              {selectedCategoriesList.length > 0 ? (
                multiple ? (
                  selectedCategoriesList.map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {category.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSelection(category.id);
                        }}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-900">{selectedCategoriesList[0].name}</span>
                )
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </div>
            <div className="flex items-center">
              {isLoading && (
                <svg className="animate-spin h-4 w-4 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <svg
                className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Categories List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">
                  {searchTerm ? 'No categories found matching your search.' : 'No categories available.'}
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-50 ${
                      isSelected(category.id) ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-xs">
                              {category.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{category.name}</div>
                          {category.description && (
                            <div className="text-xs text-gray-500 truncate">{category.description}</div>
                          )}
                        </div>
                      </div>
                      {isSelected(category.id) && (
                        <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {multiple && selectedCategoriesList.length > 0 && (
              <div className="p-2 border-t bg-gray-50">
                <div className="text-xs text-gray-600">
                  {selectedCategoriesList.length} category{selectedCategoriesList.length !== 1 ? 'ies' : 'y'} selected
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {(propError || internalError) && (
        <p className="mt-1 text-sm text-red-600">{propError || internalError}</p>
      )}

      {/* Required Indicator */}
      {required && (
        <p className="mt-1 text-xs text-gray-500">* Required field</p>
      )}
    </div>
  );
};

export default CategorySelector; 
