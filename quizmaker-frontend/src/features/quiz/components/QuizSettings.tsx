// src/components/QuizSettings.tsx
// ---------------------------------------------------------------------------
// Timer, visibility, difficulty settings component based on QuizDto properties
// ---------------------------------------------------------------------------

import React, { useState, ChangeEvent } from 'react';
import { 
  CreateQuizRequest, 
  UpdateQuizRequest, 
  Visibility, 
  Difficulty 
} from '@/types';

interface QuizSettingsProps {
  quizData: Partial<CreateQuizRequest | UpdateQuizRequest>;
  onDataChange: (data: Partial<CreateQuizRequest | UpdateQuizRequest>) => void;
  errors?: Record<string, string>;
  isEditing?: boolean;
  className?: string;
}

interface FormErrors {
  estimatedTime?: string;
  timerDuration?: string;
}

const QuizSettings: React.FC<QuizSettingsProps> = ({
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
  const validateField = (field: keyof FormErrors, value: number): string | undefined => {
    switch (field) {
      case 'estimatedTime':
        if (value < 1) {
          return 'Estimated time must be at least 1 minute';
        }
        if (value > 180) {
          return 'Estimated time must be no more than 180 minutes';
        }
        break;
      case 'timerDuration':
        if (value < 1) {
          return 'Timer duration must be at least 1 minute';
        }
        if (value > 180) {
          return 'Timer duration must be no more than 180 minutes';
        }
        break;
    }
    return undefined;
  };

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    
    // Validate the field if it's a number
    if (type === 'number' && processedValue !== undefined) {
      const error = validateField(name as keyof FormErrors, processedValue);
      if (error) {
        setLocalErrors(prev => ({ ...prev, [name]: error }));
      }
    }
  };

  // Combine local and prop errors
  const combinedErrors = { ...localErrors, ...errors };

  return (
    <div className={`bg-theme-bg-primary shadow rounded-lg ${className}`}>
      <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
        <h3 className="text-lg font-medium text-theme-text-primary">Quiz Settings</h3>
        <p className="mt-1 text-sm text-theme-text-tertiary">
          Configure visibility, difficulty, and timing settings
        </p>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Visibility */}
        <div>
          <label htmlFor="visibility" className="block text-sm font-medium text-theme-text-secondary">
            Visibility
          </label>
          <select
            id="visibility"
            name="visibility"
            value={quizData.visibility || 'PRIVATE'}
            onChange={handleInputChange}
            className="mt-1 block w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
            disabled={!isEditing}
          >
            <option value="PRIVATE" className="bg-theme-bg-primary text-theme-text-primary">Private - Only you can see and take this quiz</option>
            <option value="PUBLIC" className="bg-theme-bg-primary text-theme-text-primary">Public - Anyone can see and take this quiz</option>
          </select>
          <p className="mt-1 text-xs text-theme-text-tertiary">
            {quizData.visibility === 'PUBLIC' 
              ? 'This quiz will be visible to all users' 
              : 'This quiz will only be visible to you'}
          </p>
        </div>

        {/* Difficulty */}
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-theme-text-secondary">
            Difficulty Level
          </label>
          <select
            id="difficulty"
            name="difficulty"
            value={quizData.difficulty || 'MEDIUM'}
            onChange={handleInputChange}
            className="mt-1 block w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
            disabled={!isEditing}
          >
            <option value="EASY" className="bg-theme-bg-primary text-theme-text-primary">Easy - Suitable for beginners</option>
            <option value="MEDIUM" className="bg-theme-bg-primary text-theme-text-primary">Medium - Balanced difficulty</option>
            <option value="HARD" className="bg-theme-bg-primary text-theme-text-primary">Hard - Challenging questions</option>
          </select>
          <p className="mt-1 text-xs text-theme-text-tertiary">
            This helps users understand the expected difficulty level
          </p>
        </div>

        {/* Timer Settings */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="timerEnabled"
                checked={quizData.timerEnabled || false}
                onChange={handleInputChange}
                className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                disabled={!isEditing}
              />
              <span className="ml-2 text-sm font-medium text-theme-text-secondary">
                Enable Timer
              </span>
            </label>
            <p className="mt-1 text-xs text-theme-text-tertiary">
              When enabled, users will have a time limit to complete the quiz
            </p>
          </div>

          {quizData.timerEnabled && (
            <div>
              <label htmlFor="timerDuration" className="block text-sm font-medium text-theme-text-secondary">
                Timer Duration (minutes)
              </label>
              <input
                type="number"
                id="timerDuration"
                name="timerDuration"
                min="1"
                max="180"
                value={quizData.timerDuration || ''}
                onChange={handleInputChange}
                placeholder="Enter timer duration..."
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm bg-theme-bg-primary text-theme-text-primary [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${
                  combinedErrors.timerDuration ? 'border-theme-border-danger' : 'border-theme-border-primary'
                }`}
                disabled={!isEditing}
              />
              {combinedErrors.timerDuration && (
                <p className="mt-1 text-sm text-theme-interactive-danger">{combinedErrors.timerDuration}</p>
              )}
              <p className="mt-1 text-xs text-theme-text-tertiary">
                Time limit for completing the quiz (1-180 minutes)
              </p>
            </div>
          )}
        </div>

        {/* Estimated Time */}
        <div>
          <label htmlFor="estimatedTime" className="block text-sm font-medium text-theme-text-secondary">
            Estimated Time (minutes) <span className="text-theme-interactive-danger">*</span>
          </label>
          <input
            type="number"
            id="estimatedTime"
            name="estimatedTime"
            min="1"
            max="180"
            value={quizData.estimatedTime || ''}
            onChange={handleInputChange}
            placeholder="Enter estimated time..."
            className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm bg-theme-bg-primary text-theme-text-primary [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${
              combinedErrors.estimatedTime ? 'border-theme-border-danger' : 'border-theme-border-primary'
            }`}
            disabled={!isEditing}
          />
          {combinedErrors.estimatedTime && (
            <p className="mt-1 text-sm text-theme-interactive-danger">{combinedErrors.estimatedTime}</p>
          )}
          <p className="mt-1 text-xs text-theme-text-tertiary">
            Estimated time to complete the quiz (1-180 minutes)
          </p>
        </div>

        {/* Repetition Settings */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isRepetitionEnabled"
              checked={quizData.isRepetitionEnabled || false}
              onChange={handleInputChange}
              className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
              disabled={!isEditing}
            />
            <span className="ml-2 text-sm font-medium text-theme-text-secondary">
              Allow Multiple Attempts
            </span>
          </label>
          <p className="mt-1 text-xs text-theme-text-tertiary">
            When enabled, users can take this quiz multiple times
          </p>
        </div>

        {/* Settings Summary */}
        <div className="bg-theme-bg-secondary p-4 rounded-md">
          <h4 className="text-sm font-medium text-theme-text-secondary mb-2">Settings Summary</h4>
          <div className="space-y-1 text-sm text-theme-text-secondary">
            <p>• Visibility: <span className="font-medium">{quizData.visibility || 'PRIVATE'}</span></p>
            <p>• Difficulty: <span className="font-medium">{quizData.difficulty || 'MEDIUM'}</span></p>
            <p>• Timer: <span className="font-medium">{quizData.timerEnabled ? 'Enabled' : 'Disabled'}</span></p>
            {quizData.timerEnabled && (
              <p>• Timer Duration: <span className="font-medium">{quizData.timerDuration} minutes</span></p>
            )}
            <p>• Estimated Time: <span className="font-medium">{quizData.estimatedTime} minutes</span></p>
            <p>• Multiple Attempts: <span className="font-medium">{quizData.isRepetitionEnabled ? 'Allowed' : 'Not allowed'}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSettings; 