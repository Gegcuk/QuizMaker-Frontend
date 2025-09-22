// src/components/QuizManagementTab.tsx
// ---------------------------------------------------------------------------
// Combined quiz management component with single form layout:
// - Basic Information (title, description)
// - Settings (visibility, difficulty, timer, etc.)
// - Modern tag and category selection buttons
// ---------------------------------------------------------------------------

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Input } from '../ui';
import { CreateQuizRequest, UpdateQuizRequest } from '@/types';
import { TagDto } from '../../types/tag.types';
import { CategoryDto } from '@/types';
import { TagService } from '../../api/tag.service';
import { categoryService } from '../../features/category';
import api from '../../api/axiosInstance';
import type { AxiosError } from 'axios';

interface QuizManagementTabProps {
  quizId?: string;
  quizData: Partial<CreateQuizRequest | UpdateQuizRequest>;
  onDataChange: (data: Partial<CreateQuizRequest | UpdateQuizRequest>) => void;
  errors?: Record<string, string>;
  isEditing?: boolean;
  className?: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  estimatedTime?: string;
  timerDuration?: string;
}

const QuizManagementTab: React.FC<QuizManagementTabProps> = ({
  quizId,
  quizData,
  onDataChange,
  errors = {},
  isEditing = false,
  className = ''
}) => {
  const tagService = new TagService(api);

  const [localErrors, setLocalErrors] = useState<FormErrors>({});
  const [showTagModal, setShowTagModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCreateTagForm, setShowCreateTagForm] = useState(false);
  const [showCreateCategoryForm, setShowCreateCategoryForm] = useState(false);
  const [availableTags, setAvailableTags] = useState<TagDto[]>([]);
  const [availableCategories, setAvailableCategories] = useState<CategoryDto[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Load tags and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tagsResponse, categoriesResponse] = await Promise.all([
          tagService.getTags().catch(() => ({ content: [] })),
          categoryService.getCategories().catch(() => ({ content: [] }))
        ]);
        setAvailableTags(tagsResponse.content);
        setAvailableCategories(categoriesResponse.content);
      } catch (error) {
        console.error('Failed to load tags/categories:', error);
      }
    };
    loadData();
  }, []);

  // Clear field errors when user starts typing
  const clearFieldError = (field: keyof FormErrors) => {
    setLocalErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // Validation function
  const validateField = (field: keyof FormErrors, value: string | number): string | undefined => {
    switch (field) {
      case 'title':
        if (!String(value).trim()) {
          return 'Quiz title is required';
        }
        if (String(value).trim().length < 3) {
          return 'Quiz title must be at least 3 characters';
        }
        if (String(value).trim().length > 100) {
          return 'Quiz title must be no more than 100 characters';
        }
        break;
      case 'description':
        if (String(value).trim().length > 1000) {
          return 'Description must be no more than 1000 characters';
        }
        break;
      case 'estimatedTime':
        if (Number(value) < 1) {
          return 'Estimated time must be at least 1 minute';
        }
        if (Number(value) > 180) {
          return 'Estimated time must be no more than 180 minutes';
        }
        break;
      case 'timerDuration':
        if (Number(value) < 1) {
          return 'Timer duration must be at least 1 minute';
        }
        if (Number(value) > 180) {
          return 'Timer duration must be no more than 180 minutes';
        }
        break;
    }
    return undefined;
  };

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    // Convert number inputs
    if (type === 'number') {
      processedValue = value === '' ? undefined : parseInt(value, 10);
    }
    
    // Convert boolean inputs
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    
    // Update the parent component's data
    onDataChange({ ...quizData, [name]: processedValue });
    
    // Clear local error for this field
    clearFieldError(name as keyof FormErrors);
    
    // Validate the field if it's a number or string
    if (type === 'number' && processedValue !== undefined) {
      const error = validateField(name as keyof FormErrors, processedValue);
      if (error) {
        setLocalErrors(prev => ({ ...prev, [name]: error }));
      }
    } else if (type === 'text' || type === 'textarea') {
      const error = validateField(name as keyof FormErrors, value);
      if (error) {
        setLocalErrors(prev => ({ ...prev, [name]: error }));
      }
    }
  };

  // Handle tag selection
  const handleTagToggle = (tagId: string) => {
    const currentTags = quizData.tagIds || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    
    onDataChange({ ...quizData, tagIds: newTags });
  };

  // Handle category selection
  const handleCategorySelect = (categoryId?: string) => {
    onDataChange({ ...quizData, categoryId });
    setShowCategoryModal(false);
  };

  // Handle creating new tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setIsCreatingTag(true);
      const response = await tagService.createTag({ 
        name: newTagName.trim(), 
        description: newTagDescription.trim() 
      });
      
      // Create the new tag object
      const newTag: TagDto = {
        id: response.tagId,
        name: newTagName.trim(),
        description: newTagDescription.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to available tags only (don't automatically select it)
      setAvailableTags(prev => [...prev, newTag]);
      
      // Reset form
      setNewTagName('');
      setNewTagDescription('');
      setShowCreateTagForm(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsCreatingTag(false);
    }
  };

  // Handle creating new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setIsCreatingCategory(true);
      const response = await categoryService.createCategory({ 
        name: newCategoryName.trim(), 
        description: newCategoryDescription.trim() 
      });
      
      // Fetch the full category data
      const newCategory = await categoryService.getCategoryById(response.categoryId);
      
      // Add to available categories only (don't automatically select it)
      setAvailableCategories(prev => [...prev, newCategory]);
      
      // Reset form and close modals
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowCreateCategoryForm(false);
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Get selected tags
  const selectedTags = availableTags.filter(tag => 
    (quizData.tagIds || []).includes(tag.id)
  );

  // Get selected category
  const selectedCategory = availableCategories.find(cat => 
    cat.id === quizData.categoryId
  );

  // Combine local and prop errors
  const combinedErrors = { ...localErrors, ...errors };

  return (
    <div className={`space-y-6 ${className}`}>
        {/* Basic Information Section */}
        <div className="space-y-6">
          <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
            Basic Information
          </h4>
          
          {/* Quiz Title */}
          <div>
            <Input
              id="title"
              name="title"
              value={quizData.title || ''}
              onChange={handleInputChange}
              placeholder="Enter quiz title..."
              label="Quiz Title"
              fullWidth
              disabled={!isEditing}
              error={combinedErrors.title}
              helperText={`${quizData.title?.length || 0}/100 characters`}
            />
          </div>

          {/* Quiz Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={quizData.description || ''}
              onChange={handleInputChange}
              placeholder="Enter quiz description (optional)..."
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                combinedErrors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={!isEditing}
            />
            {combinedErrors.description && (
              <p className="mt-1 text-sm text-red-600">{combinedErrors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {quizData.description?.length || 0}/1000 characters
            </p>
          </div>
        </div>

        {/* Settings Section */}
        <div className="space-y-6">
          <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
            Quiz Settings
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visibility */}
            <div>
              <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
                Visibility
              </label>
              <select
                id="visibility"
                name="visibility"
                value={quizData.visibility || 'PRIVATE'}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={!isEditing}
              >
                <option value="PRIVATE">Private</option>
                <option value="PUBLIC">Public</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                Difficulty Level
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={quizData.difficulty || 'MEDIUM'}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={!isEditing}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            {/* Estimated Time */}
            <div>
              <Input
                type="number"
                id="estimatedTime"
                name="estimatedTime"
                min={1}
                max={180}
                value={quizData.estimatedTime || ''}
                onChange={handleInputChange}
                placeholder="30"
                label="Estimated Time (minutes)"
                fullWidth
                disabled={!isEditing}
                error={combinedErrors.estimatedTime}
              />
            </div>

            {/* Timer Duration */}
            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  name="timerEnabled"
                  checked={quizData.timerEnabled || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={!isEditing}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Enable Timer
                </span>
              </label>
              {quizData.timerEnabled && (
                <Input
                  type="number"
                  id="timerDuration"
                  name="timerDuration"
                  min={1}
                  max={180}
                  value={quizData.timerDuration || ''}
                  onChange={handleInputChange}
                  placeholder="30"
                  fullWidth
                  disabled={!isEditing}
                  error={combinedErrors.timerDuration}
                />
              )}
            </div>
          </div>

          {/* Repetition Setting */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isRepetitionEnabled"
                checked={quizData.isRepetitionEnabled || false}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={!isEditing}
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Allow Multiple Attempts
              </span>
            </label>
          </div>
        </div>

        {/* Tags and Category Section */}
        <div className="space-y-6">
          <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
            Organization
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tags
              </label>
              <div className="space-y-3">
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        #{tag.name}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleTagToggle(tag.id)}
                            className="ml-1 text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full"
                            aria-label={`Remove tag ${tag.name}`}
                            title={`Remove tag ${tag.name}`}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setShowTagModal(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {selectedTags.length > 0 ? 'Manage Tags' : 'Add Tags'}
                  </button>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category
              </label>
              <div className="space-y-3">
                {selectedCategory ? (
                  <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedCategory.name}</p>
                      {selectedCategory.description && (
                        <p className="text-xs text-gray-600">{selectedCategory.description}</p>
                      )}
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleCategorySelect(undefined)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded"
                        aria-label={`Clear category ${selectedCategory.name}`}
                        title={`Clear category ${selectedCategory.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 p-3 border border-gray-300 rounded-md bg-gray-50">
                    No category selected
                  </div>
                )}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {selectedCategory ? 'Change Category' : 'Select Category'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Tag Selection Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowTagModal(false)}></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                             <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg leading-6 font-medium text-gray-900">
                     Select Tags
                   </h3>
                   <button
                     type="button"
                     onClick={() => setShowCreateTagForm(!showCreateTagForm)}
                     className="text-sm text-indigo-600 hover:text-indigo-500"
                   >
                     {showCreateTagForm ? 'Cancel' : '+ New Tag'}
                   </button>
                 </div>

                 {/* Create Tag Form */}
                 {showCreateTagForm && (
                   <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                     <h4 className="text-sm font-medium text-gray-700 mb-3">Create New Tag</h4>
                     <div className="space-y-3">
                       <div>
                         <Input
                           id="new-tag-name"
                           value={newTagName}
                           onChange={(e) => setNewTagName(e.target.value)}
                           placeholder="Enter tag name..."
                           label="Tag Name"
                           fullWidth
                         />
                       </div>
                       <div>
                         <label htmlFor="new-tag-description" className="block text-sm font-medium text-gray-700">
                           Description
                         </label>
                         <textarea
                           id="new-tag-description"
                           value={newTagDescription}
                           onChange={(e) => setNewTagDescription(e.target.value)}
                           placeholder="Enter tag description..."
                           rows={2}
                           className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                         />
                       </div>
                       <div className="flex space-x-2">
                         <button
                           type="button"
                           onClick={handleCreateTag}
                           disabled={!newTagName.trim() || isCreatingTag}
                           className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                         >
                           {isCreatingTag ? 'Creating...' : 'Create Tag'}
                         </button>
                         <button
                           type="button"
                           onClick={() => {
                             setShowCreateTagForm(false);
                             setNewTagName('');
                             setNewTagDescription('');
                           }}
                           className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                         >
                           Cancel
                         </button>
                       </div>
                     </div>
                   </div>
                 )}

                 <div className="max-h-60 overflow-y-auto space-y-2">
                  {availableTags.map(tag => (
                    <label key={tag.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(quizData.tagIds || []).includes(tag.id)}
                        onChange={() => handleTagToggle(tag.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">#{tag.name}</p>
                        {tag.description && (
                          <p className="text-xs text-gray-600">{tag.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowCategoryModal(false)}></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                             <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg leading-6 font-medium text-gray-900">
                     Select Category
                   </h3>
                   <button
                     type="button"
                     onClick={() => setShowCreateCategoryForm(!showCreateCategoryForm)}
                     className="text-sm text-indigo-600 hover:text-indigo-500"
                   >
                     {showCreateCategoryForm ? 'Cancel' : '+ New Category'}
                   </button>
                 </div>

                 {/* Create Category Form */}
                 {showCreateCategoryForm && (
                   <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                     <h4 className="text-sm font-medium text-gray-700 mb-3">Create New Category</h4>
                     <div className="space-y-3">
                       <div>
                         <Input
                           id="new-category-name"
                           value={newCategoryName}
                           onChange={(e) => setNewCategoryName(e.target.value)}
                           placeholder="Enter category name..."
                           label="Category Name"
                           fullWidth
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
                           type="button"
                           onClick={handleCreateCategory}
                           disabled={!newCategoryName.trim() || isCreatingCategory}
                           className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                         >
                           {isCreatingCategory ? 'Creating...' : 'Create Category'}
                         </button>
                         <button
                           type="button"
                           onClick={() => {
                             setShowCreateCategoryForm(false);
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

                 <div className="max-h-60 overflow-y-auto space-y-2">
                  <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="radio"
                      name="categorySelection"
                      checked={!quizData.categoryId}
                      onChange={() => handleCategorySelect(undefined)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">No Category</p>
                      <p className="text-xs text-gray-600">Don't assign to any category</p>
                    </div>
                  </label>
                  {availableCategories.map(category => (
                    <label key={category.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="radio"
                        name="categorySelection"
                        checked={quizData.categoryId === category.id}
                        onChange={() => handleCategorySelect(category.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-gray-600">{category.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManagementTab; 
