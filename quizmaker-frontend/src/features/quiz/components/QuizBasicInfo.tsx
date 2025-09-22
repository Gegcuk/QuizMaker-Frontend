// src/components/QuizBasicInfo.tsx
// ---------------------------------------------------------------------------
// Quiz title, description, and basic settings component
// ---------------------------------------------------------------------------

import React, { useState, useEffect, ChangeEvent } from 'react';
import { CreateQuizRequest, UpdateQuizRequest } from '@/types';

interface QuizBasicInfoProps {
  quizData: Partial<CreateQuizRequest | UpdateQuizRequest>;
  onDataChange: (data: Partial<CreateQuizRequest | UpdateQuizRequest>) => void;
  errors?: Record<string, string>;
  isEditing?: boolean;
  className?: string;
}

interface FormErrors {
  title?: string;
  description?: string;
}

const QuizBasicInfo: React.FC<QuizBasicInfoProps> = ({
  quizData,
  onDataChange,
  errors = {},
  isEditing = false,
  className = ''
}) => {
  const [localErrors, setLocalErrors] = useState<FormErrors>({});

  // Clear field errors when user starts typing
  const clearFieldError = (field: keyof FormErrors) => {
    setLocalErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // Validation function
  const validateField = (field: keyof FormErrors, value: string): string | undefined => {
    switch (field) {
      case 'title':
        if (!value.trim()) {
          return 'Quiz title is required';
        }
        if (value.trim().length < 3) {
          return 'Quiz title must be at least 3 characters';
        }
        if (value.trim().length > 100) {
          return 'Quiz title must be no more than 100 characters';
        }
        break;
      case 'description':
        if (value.trim().length > 1000) {
          return 'Description must be no more than 1000 characters';
        }
        break;
    }
    return undefined;
  };

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Update the parent component's data
    onDataChange({ ...quizData, [name]: value });
    
    // Clear local error for this field
    clearFieldError(name as keyof FormErrors);
    
    // Validate the field
    const error = validateField(name as keyof FormErrors, value);
    if (error) {
      setLocalErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Combine local and prop errors
  const combinedErrors = { ...localErrors, ...errors };

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          Set the title and description for your quiz
        </p>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Quiz Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Quiz Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={quizData.title || ''}
            onChange={handleInputChange}
            placeholder="Enter quiz title..."
            className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              combinedErrors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={!isEditing}
          />
          {combinedErrors.title && (
            <p className="mt-1 text-sm text-red-600">{combinedErrors.title}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {quizData.title?.length || 0}/100 characters
          </p>
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

        {/* Preview */}
        {quizData.title && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {quizData.title}
              </h2>
              {quizData.description && (
                <p className="text-sm text-gray-600">
                  {quizData.description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizBasicInfo; 