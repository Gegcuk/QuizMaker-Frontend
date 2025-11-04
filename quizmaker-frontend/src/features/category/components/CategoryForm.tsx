import React, { useState, useEffect } from 'react';
import { CategoryDto, CreateCategoryRequest, UpdateCategoryRequest } from '@/types';
import { categoryService } from '@/services';
import { Button, Input } from '@/components';

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
          <Button
            type="button"
            onClick={handlePreviewToggle}
            variant="ghost"
            size="sm"
          >
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
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
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="name" className="block text-sm font-medium text-theme-text-secondary">
                Category Name <span className="text-theme-interactive-danger">*</span>
              </label>
              <span className="text-sm text-theme-text-tertiary">
                {characterCount.name}/100
              </span>
            </div>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter category name (3-100 characters)"
              maxLength={100}
              fullWidth
              error={errors.name}
            />
          </div>

          {/* Description Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="description" className="block text-sm font-medium text-theme-text-secondary">
                Description
              </label>
              <span className="text-sm text-theme-text-tertiary">
                {characterCount.description}/1000
              </span>
            </div>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-transparent bg-theme-bg-primary text-theme-text-primary ${
                errors.description ? 'border-theme-border-danger' : 'border-theme-border-primary'
              }`}
              placeholder="Enter category description (optional, max 1000 characters)"
              maxLength={1000}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-theme-interactive-danger">{errors.description}</p>
            )}
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
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-theme-border-primary">
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              size="md"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading || !formData.name.trim()}
              loading={loading}
            >
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Category' : 'Create Category')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}; 
