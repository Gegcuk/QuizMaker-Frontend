import React, { useState, useEffect } from 'react';
import { CategoryService } from '../../api/category.service';
import api from '../../api/axiosInstance';
import { 
  CategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest
} from '../../types/category.types';

interface CategoryFormProps {
  category?: CategoryDto | null;
  onSave?: (category: CategoryDto) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

interface FormData {
  name: string;
  description: string;
}

interface ValidationErrors {
  name?: string;
  description?: string;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ 
  category, 
  onSave, 
  onCancel, 
  onError,
  className = '' 
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const categoryService = new CategoryService(api);
  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || ''
      });
    }
  }, [category]);

  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Category name must be at least 3 characters long';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Category name must be no more than 100 characters long';
    }

    // Description validation
    if (formData.description.trim().length > 1000) {
      newErrors.description = 'Description must be no more than 1000 characters long';
    }

    return newErrors;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // Validate field on blur
    const fieldErrors = validateForm();
    if (fieldErrors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: fieldErrors[field]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched({
        name: true,
        description: true
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      const requestData: CreateCategoryRequest | UpdateCategoryRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      };

      let savedCategory: CategoryDto;

      if (isEditing && category) {
        savedCategory = await categoryService.updateCategory(category.id, requestData as UpdateCategoryRequest);
      } else {
        const response = await categoryService.createCategory(requestData as CreateCategoryRequest);
        // Fetch the created category to get full details
        savedCategory = await categoryService.getCategoryById(response.categoryId);
      }

      onSave?.(savedCategory);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save category';
      setErrors({ name: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    onCancel?.();
  };

  const getFieldError = (field: keyof FormData): string | undefined => {
    return touched[field] ? errors[field] : undefined;
  };

  const isFormValid = () => {
    return formData.name.trim().length >= 3 && 
           formData.name.trim().length <= 100 &&
           formData.description.trim().length <= 1000;
  };

  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Category' : 'Create New Category'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {isEditing 
            ? 'Update the category information below.' 
            : 'Fill in the details to create a new category.'
          }
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Category Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            placeholder="Enter category name"
            maxLength={100}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              getFieldError('name') ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {getFieldError('name') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('name')}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.name.length}/100 characters (minimum 3)
          </p>
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            placeholder="Enter category description (optional)"
            rows={4}
            maxLength={1000}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none ${
              getFieldError('description') ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {getFieldError('description') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('description')}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.description.length}/1000 characters
          </p>
        </div>

        {/* Preview */}
        {formData.name.trim() && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {formData.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-900">{formData.name}</h5>
                  {formData.description.trim() && (
                    <p className="text-sm text-gray-500">{formData.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isFormValid()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Category' : 'Create Category'
            )}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for creating categories:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use clear, descriptive names that users will understand</li>
          <li>• Keep names between 3-100 characters</li>
          <li>• Add descriptions to help users understand what quizzes belong in this category</li>
          <li>• Consider using broad categories that can accommodate multiple related topics</li>
        </ul>
      </div>
    </div>
  );
};

export default CategoryForm; 
