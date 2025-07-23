import React, { useState, useEffect, useRef } from 'react';
import { TagDto } from '../types/tag.types';
import { TagService } from '../api/tag.service';
import api from '../api/axiosInstance';

interface TagSelectorProps {
  selectedTags: TagDto[];
  onSelectionChange: (tags: TagDto[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxSelections?: number;
  showSearch?: boolean;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onSelectionChange,
  multiple = false,
  placeholder = 'Select tags...',
  className = '',
  disabled = false,
  maxSelections,
  showSearch = true
}) => {
  const [tags, setTags] = useState<TagDto[]>([]);
  const [filteredTags, setFilteredTags] = useState<TagDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const tagService = new TagService(api);

  // Load tags on component mount
  useEffect(() => {
    loadTags();
  }, []);

  // Filter tags based on search term
  useEffect(() => {
    const filtered = tags.filter(tag =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tag.description && tag.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredTags(filtered);
  }, [tags, searchTerm]);

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

  const loadTags = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await tagService.getTags({
        page: 0,
        size: 100, // Load more tags for better selection
        sort: 'name,asc'
      });

      setTags(response.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
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

  const handleTagSelect = (tag: TagDto) => {
    if (multiple) {
      const isSelected = selectedTags.some(t => t.id === tag.id);
      
      if (isSelected) {
        // Remove tag
        const updatedSelection = selectedTags.filter(t => t.id !== tag.id);
        onSelectionChange(updatedSelection);
      } else {
        // Add tag (check max selections)
        if (maxSelections && selectedTags.length >= maxSelections) {
          return; // Don't add if max reached
        }
        const updatedSelection = [...selectedTags, tag];
        onSelectionChange(updatedSelection);
      }
    } else {
      // Single selection
      onSelectionChange([tag]);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleRemoveTag = (tagId: string) => {
    const updatedSelection = selectedTags.filter(t => t.id !== tagId);
    onSelectionChange(updatedSelection);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const isTagSelected = (tag: TagDto) => {
    return selectedTags.some(t => t.id === tag.id);
  };

  const getDisplayText = () => {
    if (selectedTags.length === 0) {
      return placeholder;
    }
    
    if (!multiple) {
      return selectedTags[0].name;
    }
    
    if (selectedTags.length === 1) {
      return selectedTags[0].name;
    }
    
    return `${selectedTags.length} tags selected`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Selector Button */}
      <button
        type="button"
        onClick={handleToggleDropdown}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-gray-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {multiple && selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedTags.slice(0, 3).map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(tag.id);
                      }}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                ))}
                {selectedTags.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    +{selectedTags.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span className={`block truncate ${selectedTags.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
                {getDisplayText()}
              </span>
            )}
          </div>
          <div className="flex items-center ml-2">
            {multiple && selectedTags.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="mr-1 p-1 text-gray-400 hover:text-gray-600"
                title="Clear all"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search Input */}
          {showSearch && (
            <div className="p-2 border-b border-gray-200">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border-b border-red-200">
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
            <div className="p-3 text-sm text-gray-500 text-center">
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading tags...
              </div>
            </div>
          )}

          {/* Tags List */}
          {!loading && !error && (
            <div className="py-1">
              {filteredTags.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  {searchTerm ? 'No tags found matching your search.' : 'No tags available.'}
                </div>
              ) : (
                filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagSelect(tag)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                      isTagSelected(tag) ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                            {tag.name}
                          </span>
                          <div className="font-medium truncate">{tag.name}</div>
                        </div>
                        {tag.description && (
                          <div className="text-xs text-gray-500 truncate mt-1">{tag.description}</div>
                        )}
                      </div>
                      {isTagSelected(tag) && (
                        <svg className="w-4 h-4 text-blue-600 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
          {multiple && maxSelections && selectedTags.length >= maxSelections && (
            <div className="p-2 text-xs text-amber-600 bg-amber-50 border-t border-amber-200">
              Maximum {maxSelections} tags selected. Remove some to add more.
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 