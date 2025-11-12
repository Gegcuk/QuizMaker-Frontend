// src/components/QuizManagementTab.tsx
// ---------------------------------------------------------------------------
// Combined quiz management component with single form layout:
// - Basic Information (title, description)
// - Settings (visibility, difficulty, timer, etc.)
// - Modern tag and category selection buttons
// ---------------------------------------------------------------------------

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Input, Button, Dropdown, Textarea, Checkbox } from '@/components';
import { CreateQuizRequest, UpdateQuizRequest } from '@/types';
import { TagDto } from '@/types';
import { CategoryDto } from '@/types';
import { TagService, api } from '@/services';
import { categoryService } from '@/services';
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
  const ENABLE_TAGS_AND_CATEGORY = false;
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
    if (!ENABLE_TAGS_AND_CATEGORY) return;
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
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 space-y-6">
          <h4 className="text-md font-medium text-theme-text-primary">
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
          <Textarea
            id="description"
            name="description"
            rows={4}
            value={quizData.description || ''}
            onChange={handleInputChange}
            placeholder="Enter quiz description (optional)..."
            label="Description"
            disabled={!isEditing}
            error={combinedErrors.description}
            showCharCount
            maxLength={1000}
          />
        </div>

        {/* Settings Section */}
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 space-y-6">
          <h4 className="text-md font-medium text-theme-text-primary">
            Quiz Settings
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visibility */}
            <Dropdown
              label="Visibility"
              options={[
                { value: 'PRIVATE', label: 'Private' },
                { value: 'PUBLIC', label: 'Public' }
              ]}
              value={quizData.visibility || 'PRIVATE'}
              onChange={(value) => onDataChange({ ...quizData, visibility: value as 'PRIVATE' | 'PUBLIC' })}
              disabled={!isEditing}
              fullWidth
            />

            {/* Difficulty */}
            <Dropdown
              label="Difficulty Level"
              options={[
                { value: 'EASY', label: 'Easy' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HARD', label: 'Hard' }
              ]}
              value={quizData.difficulty || 'MEDIUM'}
              onChange={(value) => onDataChange({ ...quizData, difficulty: value as 'EASY' | 'MEDIUM' | 'HARD' })}
              disabled={!isEditing}
              fullWidth
            />

            {/* Estimated Time */}
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
        </div>

        {/* Tags and Category Section */}
        {ENABLE_TAGS_AND_CATEGORY && (
        <div className="space-y-6">
          <h4 className="text-md font-medium text-theme-text-primary border-b border-theme-border-primary pb-2 bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
            Organization
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-3">
                Tags
              </label>
              <div className="space-y-3 pb-3">
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-bg-tertiary text-theme-text-primary"
                      >
                        #{tag.name}
                        {isEditing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTagToggle(tag.id)}
                            className="ml-1 !p-0 !min-w-0 !w-auto"
                            aria-label={`Remove tag ${tag.name}`}
                            title={`Remove tag ${tag.name}`}
                          >
                            ×
                          </Button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {isEditing && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTagModal(true)}
                      leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      }
                    >
                      {selectedTags.length > 0 ? 'Manage Tags' : 'Add Tags'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-3">
                Category
              </label>
              <div className="space-y-3 pb-3">
                {selectedCategory ? (
                  <div className="flex items-center justify-between p-3 border border-theme-border-primary rounded-md bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary">
                    <div>
                      <p className="text-sm font-medium text-theme-text-primary">{selectedCategory.name}</p>
                      {selectedCategory.description && (
                        <p className="text-xs text-theme-text-secondary">{selectedCategory.description}</p>
                      )}
                    </div>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCategorySelect(undefined)}
                        className="!p-1 !min-w-0 !w-auto"
                        aria-label={`Clear category ${selectedCategory.name}`}
                        title={`Clear category ${selectedCategory.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-theme-text-tertiary p-3 border border-theme-border-primary rounded-md bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary">
                    No category selected
                  </div>
                )}
                {isEditing && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCategoryModal(true)}
                      leftIcon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      }
                    >
                      {selectedCategory ? 'Change Category' : 'Select Category'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

      {/* Tag Selection Modal */}
      {ENABLE_TAGS_AND_CATEGORY && showTagModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-theme-bg-tertiary opacity-75" onClick={() => setShowTagModal(false)}></div>
            </div>
            <div className="inline-block align-middle bg-theme-bg-primary border border-theme-border-primary rounded-lg text-left overflow-hidden shadow-theme-lg transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full bg-theme-bg-primary text-theme-text-primary">
                             <div className="bg-theme-bg-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg leading-6 font-medium text-theme-text-primary">
                     Select Tags
                   </h3>
                   <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     onClick={() => setShowCreateTagForm(!showCreateTagForm)}
                     className="!p-1 text-sm"
                   >
                     {showCreateTagForm ? 'Cancel' : '+ New Tag'}
                   </Button>
                 </div>

                 {/* Create Tag Form */}
                 {showCreateTagForm && (
                   <div className="mb-4 p-4 bg-theme-bg-secondary border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
                     <h4 className="text-sm font-medium text-theme-text-secondary mb-3">Create New Tag</h4>
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
                       <Textarea
                         id="new-tag-description"
                         value={newTagDescription}
                         onChange={(e) => setNewTagDescription(e.target.value)}
                         placeholder="Enter tag description..."
                         rows={2}
                         label="Description"
                         fullWidth
                       />
                       <div className="flex space-x-2">
                         <Button
                           type="button"
                           variant="primary"
                           size="sm"
                           onClick={handleCreateTag}
                           disabled={!newTagName.trim() || isCreatingTag}
                           loading={isCreatingTag}
                         >
                           Create Tag
                         </Button>
                         <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           onClick={() => {
                             setShowCreateTagForm(false);
                             setNewTagName('');
                             setNewTagDescription('');
                           }}
                         >
                           Cancel
                         </Button>
                       </div>
                     </div>
                   </div>
                 )}

                 <div className="max-h-60 overflow-y-auto space-y-2">
                  {availableTags.map(tag => (
                    <div key={tag.id} className="p-2 hover:bg-theme-bg-secondary rounded">
                      <Checkbox
                        checked={(quizData.tagIds || []).includes(tag.id)}
                        onChange={() => handleTagToggle(tag.id)}
                        label={
                          <div>
                            <p className="text-sm font-medium text-theme-text-primary">#{tag.name}</p>
                            {tag.description && (
                              <p className="text-xs text-theme-text-secondary">{tag.description}</p>
                            )}
                          </div>
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-theme-bg-secondary px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setShowTagModal(false)}
                  className="w-full sm:w-auto"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection Modal */}
      {ENABLE_TAGS_AND_CATEGORY && showCategoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-theme-bg-tertiary opacity-75" onClick={() => setShowCategoryModal(false)}></div>
            </div>
            <div className="inline-block align-middle bg-theme-bg-primary border border-theme-border-primary rounded-lg text-left overflow-hidden shadow-theme-lg transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full bg-theme-bg-primary text-theme-text-primary">
                             <div className="bg-theme-bg-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg leading-6 font-medium text-theme-text-primary">
                     Select Category
                   </h3>
                   <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     onClick={() => setShowCreateCategoryForm(!showCreateCategoryForm)}
                     className="!p-1 text-sm"
                   >
                     {showCreateCategoryForm ? 'Cancel' : '+ New Category'}
                   </Button>
                 </div>

                 {/* Create Category Form */}
                 {showCreateCategoryForm && (
                   <div className="mb-4 p-4 bg-theme-bg-secondary border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
                     <h4 className="text-sm font-medium text-theme-text-secondary mb-3">Create New Category</h4>
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
                       <Textarea
                         id="new-category-description"
                         value={newCategoryDescription}
                         onChange={(e) => setNewCategoryDescription(e.target.value)}
                         placeholder="Enter category description..."
                         rows={2}
                         label="Description"
                         fullWidth
                       />
                       <div className="flex space-x-2">
                         <Button
                           type="button"
                           variant="primary"
                           size="sm"
                           onClick={handleCreateCategory}
                           disabled={!newCategoryName.trim() || isCreatingCategory}
                           loading={isCreatingCategory}
                         >
                           Create Category
                         </Button>
                         <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           onClick={() => {
                             setShowCreateCategoryForm(false);
                             setNewCategoryName('');
                             setNewCategoryDescription('');
                           }}
                         >
                           Cancel
                         </Button>
                       </div>
                     </div>
                   </div>
                 )}

                 <div className="max-h-60 overflow-y-auto space-y-2">
                  <div className="p-2 hover:bg-theme-bg-secondary rounded cursor-pointer" onClick={() => handleCategorySelect(undefined)}>
                    <Checkbox
                      checked={!quizData.categoryId}
                      onChange={() => handleCategorySelect(undefined)}
                      label={
                        <div>
                          <p className="text-sm font-medium text-theme-text-primary">No Category</p>
                          <p className="text-xs text-theme-text-secondary">Don't assign to any category</p>
                        </div>
                      }
                    />
                  </div>
                  {availableCategories.map(category => (
                    <div key={category.id} className="p-2 hover:bg-theme-bg-secondary rounded cursor-pointer" onClick={() => handleCategorySelect(category.id)}>
                      <Checkbox
                        checked={quizData.categoryId === category.id}
                        onChange={() => handleCategorySelect(category.id)}
                        label={
                          <div>
                            <p className="text-sm font-medium text-theme-text-primary">{category.name}</p>
                            {category.description && (
                              <p className="text-xs text-theme-text-secondary">{category.description}</p>
                            )}
                          </div>
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-theme-bg-secondary px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCategoryModal(false)}
                  className="w-full sm:w-auto"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManagementTab; 
