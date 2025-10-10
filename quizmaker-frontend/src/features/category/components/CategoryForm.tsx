import React, { useState, useEffect } from 'react';
import { CategoryDto, CreateCategoryRequest, UpdateCategoryRequest } from '@/types';
import { categoryService } from '@/services';

interface CategoryFormProps {
  category?: CategoryDto;
  onSave: (category: CategoryDto) => void;
  onCancel: () => void;
  className?: string;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSave,
  onCancel,
  className = ''
}) => {
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || ''
      });
    }
  }, [category]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Category name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Category name must be at most 100 characters';
    }

    // Description validation
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be at most 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateCategoryRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let savedCategory: CategoryDto;

      if (isEditing && category) {
        const updateData: UpdateCategoryRequest = {
          name: formData.name,
          description: formData.description
        };
        savedCategory = await categoryService.updateCategory(category.id, updateData);
      } else {
        const result = await categoryService.createCategory(formData);
        // Fetch the created category to get full details
        savedCategory = await categoryService.getCategoryById(result.categoryId);
      }

      onSave(savedCategory);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save category';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewToggle = () => {
    setPreviewMode(!previewMode);
  };

  const characterCount = {
    name: formData.name.length,
    description: formData.description?.length || 0
  };

  return (
    <div className={`bg-theme-bg-primary rounded-lg shadow-theme border border-theme-border-primary ${className}`}>
      <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-theme-text-primary">
            {isEditing ? 'Edit Category' : 'Create New Category'}
          </h3>
          <button
            type="button"
            onClick={handlePreviewToggle}
            className="text-sm text-theme-interactive-primary hover:text-theme-interactive-info px-3 py-1 rounded-md hover:bg-theme-bg-info"
          >
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="p-6">
          <div className="bg-theme-bg-secondary rounded-lg p-4">
            <h4 className="text-lg font-medium text-theme-text-primary mb-2">
              {formData.name || 'Category Name'}
            </h4>
            <p className="text-theme-text-secondary">
              {formData.description || 'No description provided'}
            </p>
            <div className="mt-4 text-sm text-theme-text-tertiary">
              <p>Name length: {characterCount.name}/100 characters</p>
              <p>Description length: {characterCount.description}/1000 characters</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-theme-text-secondary mb-2">
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-transparent ${
                errors.name ? 'border-theme-border-danger' : 'border-theme-border-primary'
              }`}
              placeholder="Enter category name (3-100 characters)"
              maxLength={100}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-theme-interactive-danger">{errors.name}</span>
              <span className="text-sm text-theme-text-tertiary">
                {characterCount.name}/100
              </span>
            </div>
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-theme-text-secondary mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-transparent ${
                errors.description ? 'border-theme-border-danger' : 'border-theme-border-primary'
              }`}
              placeholder="Enter category description (optional, max 1000 characters)"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-theme-interactive-danger">{errors.description}</span>
              <span className="text-sm text-theme-text-tertiary">
                {characterCount.description}/1000
              </span>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-theme-bg-danger border border-theme-border-danger rounded-md p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-theme-interactive-danger mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-theme-interactive-danger text-sm">{errors.submit}</span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-theme-border-primary text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-bg-primary focus:ring-theme-interactive-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-theme-interactive-primary text-theme-text-inverse hover:bg-theme-interactive-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-bg-primary focus:ring-theme-interactive-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-theme-text-inverse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                isEditing ? 'Update Category' : 'Create Category'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}; 
