// src/components/QuizTagManager.tsx
// ---------------------------------------------------------------------------
// Add/remove tags from quiz based on QUIZ_ENDPOINTS
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { TagDto } from '@/types';
import { TagService, api } from '@/services';
import type { AxiosError } from 'axios';

interface QuizTagManagerProps {
  quizId: string;
  currentTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  className?: string;
}

interface TagWithStatus extends TagDto {
  isSelected: boolean;
}

const QuizTagManager: React.FC<QuizTagManagerProps> = ({
  quizId,
  currentTagIds,
  onTagsChange,
  className = ''
}) => {
  const tagService = new TagService(api);
  
  const [tags, setTags] = useState<TagWithStatus[]>([]);
  const [displayedCount, setDisplayedCount] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Load available tags
  useEffect(() => {
    const loadTags = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await tagService.getTags();
        const tagsWithStatus = response.content.map(tag => ({
          ...tag,
          isSelected: currentTagIds.includes(tag.id)
        }));
        setTags(tagsWithStatus);
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const errorMessage = axiosError.response?.data?.message || 'Failed to load tags';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadTags();
  }, [currentTagIds]);

  // Filter tags based on search
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle tag selection
  const handleTagToggle = (tagId: string) => {
    const updatedTags = tags.map(t => 
      t.id === tagId ? { ...t, isSelected: !t.isSelected } : t
    );
    setTags(updatedTags);
    
    const selectedIds = updatedTags
      .filter(t => t.isSelected)
      .map(t => t.id);
    
    onTagsChange(selectedIds);
  };

  // Handle bulk selection
  const handleBulkSelect = (selectAll: boolean) => {
    const updatedTags = tags.map(t => ({ ...t, isSelected: selectAll }));
    setTags(updatedTags);
    
    const selectedIds = selectAll ? tags.map(t => t.id) : [];
    onTagsChange(selectedIds);
  };

  // Handle creating new tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setIsCreating(true);
      setError(null);
      
      const response = await tagService.createTag({ 
        name: newTagName.trim(), 
        description: newTagDescription.trim() 
      });
      
      // Create the new tag object with the response
      const newTag: TagWithStatus = {
        id: response.tagId,
        name: newTagName.trim(),
        description: newTagDescription.trim(),
        isSelected: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setTags(prev => [...prev, newTag]);
      setNewTagName('');
      setNewTagDescription('');
      setShowCreateForm(false);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to create tag';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-theme-bg-primary shadow rounded-lg ${className}`}>
        <div className="px-6 py-4 border-b border-theme-border-primary">
          <h3 className="text-lg font-medium text-theme-text-primary">Tag Manager</h3>
        </div>
        <div className="px-6 py-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-theme-bg-tertiary rounded w-1/4"></div>
            <div className="h-4 bg-theme-bg-tertiary rounded w-1/2"></div>
            <div className="h-4 bg-theme-bg-tertiary rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-theme-bg-primary shadow rounded-lg ${className}`}>
      <div className="px-6 py-4 border-b border-theme-border-primary">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-theme-text-primary">Tag Manager</h3>
            <p className="mt-1 text-sm text-theme-text-tertiary">
              Select tags to categorize this quiz ({currentTagIds.length} selected)
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="text-sm text-theme-interactive-primary hover:text-indigo-500"
          >
            {showCreateForm ? 'Cancel' : '+ Add New Tag'}
          </button>
        </div>
      </div>

      <div className="px-6 py-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Create new tag form */}
        {showCreateForm && (
          <div className="mb-4 p-4 bg-theme-bg-secondary rounded-lg">
            <h4 className="text-sm font-medium text-theme-text-secondary mb-3">Create New Tag</h4>
            <div className="space-y-3">
              <div>
                <label htmlFor="new-tag-name" className="block text-sm font-medium text-theme-text-secondary">
                  Tag Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="new-tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name..."
                  className="mt-1 block w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="new-tag-description" className="block text-sm font-medium text-theme-text-secondary">
                  Description
                </label>
                <textarea
                  id="new-tag-description"
                  value={newTagDescription}
                  onChange={(e) => setNewTagDescription(e.target.value)}
                  placeholder="Enter tag description..."
                  rows={2}
                  className="mt-1 block w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || isCreating}
                  className="px-3 py-1 text-sm bg-theme-interactive-primary text-white rounded-md hover:bg-theme-interactive-primary disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Tag'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTagName('');
                    setNewTagDescription('');
                  }}
                  className="px-3 py-1 text-sm bg-theme-bg-tertiary text-theme-text-secondary rounded-md hover:bg-theme-bg-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and filters */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="tag-search" className="block text-sm font-medium text-theme-text-secondary">
                Search Tags
              </label>
              <input
                type="text"
                id="tag-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by tag name or description..."
                className="mt-1 block w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm"
              />
            </div>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleBulkSelect(true)}
                className="text-sm text-theme-interactive-primary hover:text-indigo-500"
              >
                Select All
              </button>
              <button
                onClick={() => handleBulkSelect(false)}
                className="text-sm text-theme-interactive-primary hover:text-indigo-500"
              >
                Clear All
              </button>
            </div>
            <p className="text-sm text-theme-text-tertiary">
              {filteredTags.length} tags found
            </p>
          </div>
        </div>

        {/* Tags list */}
        <div className="space-y-2">
          {/* Header with count */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-theme-text-secondary">Available Tags</h4>
            <span className="text-sm text-theme-text-tertiary">
              {filteredTags.length > displayedCount 
                ? `Showing ${displayedCount} of ${filteredTags.length} tags`
                : `${filteredTags.length} tag${filteredTags.length !== 1 ? 's' : ''} available`
              }
            </span>
          </div>

          {filteredTags.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No tags found</h3>
              <p className="mt-1 text-sm text-theme-text-tertiary">
                {searchTerm ? 'Try adjusting your search' : 'Create your first tag to get started'}
              </p>
            </div>
          ) : (
            <>
              {filteredTags.slice(0, displayedCount).map((tag) => (
                <div
                  key={tag.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    tag.isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-theme-border-primary hover:border-theme-border-primary'
                  }`}
                  onClick={() => handleTagToggle(tag.id)}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={tag.isSelected}
                      onChange={() => handleTagToggle(tag.id)}
                      className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-theme-text-primary">
                          #{tag.name}
                        </span>
                      </div>
                      {tag.description && (
                        <p className="text-sm text-theme-text-secondary line-clamp-2">
                          {tag.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-xs text-theme-text-tertiary">
                        <span>Created: {new Date(tag.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Show More Button */}
              {filteredTags.length > displayedCount && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setDisplayedCount(prev => Math.min(prev + 5, filteredTags.length))}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-theme-interactive-primary bg-theme-bg-primary border border-theme-interactive-primary rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Show 5 More
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Selected tags summary */}
        {currentTagIds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-theme-border-primary">
            <h4 className="text-sm font-medium text-theme-text-secondary mb-2">Selected Tags</h4>
            <div className="flex flex-wrap gap-2">
              {tags
                .filter(tag => tag.isSelected)
                .map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    #{tag.name}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizTagManager; 