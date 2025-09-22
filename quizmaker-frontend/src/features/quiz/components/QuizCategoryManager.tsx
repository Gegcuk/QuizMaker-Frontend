// src/components/QuizCategoryManager.tsx
// ---------------------------------------------------------------------------
// Change quiz category based on QUIZ_ENDPOINTS
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { CategoryDto } from '@/types';
import { categoryService } from '@/services';
import { api } from '@/services';
import type { AxiosError } from 'axios';

interface QuizCategoryManagerProps {
  quizId: string;
  currentCategoryId?: string;
  onCategoryChange: (categoryId?: string) => void;
  className?: string;
}

const QuizCategoryManager: React.FC<QuizCategoryManagerProps> = ({
  quizId,
  currentCategoryId,
  onCategoryChange,
  className = ''
}) => {
  
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [displayedCount, setDisplayedCount] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Load available categories
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await categoryService.getCategories();
        setCategories(response.content);
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const errorMessage = axiosError.response?.data?.message || 'Failed to load categories';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    const newCategoryId = categoryId === currentCategoryId ? undefined : categoryId;
    onCategoryChange(newCategoryId);
  };

  // Handle creating new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setIsCreating(true);
      setError(null);
      
      const result = await categoryService.createCategory({ 
        name: newCategoryName.trim(), 
        description: newCategoryDescription.trim() 
      });
      
      // Fetch the full category data
      const newCategory = await categoryService.getCategoryById(result.categoryId);
      
      setCategories(prev => [...prev, newCategory]);
      onCategoryChange(newCategory.id);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowCreateForm(false);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to create category';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // Get current category
  const currentCategory = categories.find(cat => cat.id === currentCategoryId);

  if (isLoading) {
    return (
      <div className={`bg-white shadow rounded-lg ${className}`}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Category Manager</h3>
        </div>
        <div className="px-6 py-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Category Manager</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a category to organize this quiz
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            {showCreateForm ? 'Cancel' : '+ Add New Category'}
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

        {/* Create new category form */}
        {showCreateForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Create New Category</h4>
            <div className="space-y-3">
              <div>
                <label htmlFor="new-category-name" className="block text-sm font-medium text-gray-700">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="new-category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name..."
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="new-category-description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="new-category-description"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Enter category description..."
                  rows={2}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || isCreating}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Category'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewCategoryName('');
                    setNewCategoryDescription('');
                  }}
                  className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current category display */}
        {currentCategory && (
          <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h4 className="text-sm font-medium text-indigo-900 mb-2">Current Category</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-800">{currentCategory.name}</p>
                {currentCategory.description && (
                  <p className="text-sm text-indigo-600 mt-1">{currentCategory.description}</p>
                )}
              </div>
              <button
                onClick={() => onCategoryChange(undefined)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Categories list */}
        <div className="space-y-2">
          {/* Header with count */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Available Categories</h4>
            <span className="text-sm text-gray-500">
              {categories.length > displayedCount 
                ? `Showing ${displayedCount} of ${categories.length} categories`
                : `${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'} available`
              }
            </span>
          </div>
          
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No categories available</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first category to get started
              </p>
            </div>
          ) : (
            <>
              {categories.slice(0, displayedCount).map((category) => (
                <div
                  key={category.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    category.id === currentCategoryId
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="category"
                      checked={category.id === currentCategoryId}
                      onChange={() => handleCategoryChange(category.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {category.name}
                        </span>
                        {category.id === currentCategoryId && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Selected
                          </span>
                        )}
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Show More Button */}
              {categories.length > displayedCount && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setDisplayedCount(prev => Math.min(prev + 5, categories.length))}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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

        {/* No category option */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div
            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
              !currentCategoryId
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onCategoryChange(undefined)}
          >
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                name="category"
                checked={!currentCategoryId}
                onChange={() => onCategoryChange(undefined)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">No Category</span>
                  {!currentCategoryId && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  This quiz will not be assigned to any specific category
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCategoryManager; 