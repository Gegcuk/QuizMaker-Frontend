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
import { Dropdown, Input, Checkbox } from '@/components';

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
        <Dropdown
          label="Visibility"
          value={quizData.visibility || 'PRIVATE'}
          onChange={(value) => onDataChange({ ...quizData, visibility: (typeof value === 'string' ? value : value[0]) as Visibility })}
          options={[
            { label: 'Private - Only you can see and take this quiz', value: 'PRIVATE' },
            { label: 'Public - Anyone can see and take this quiz', value: 'PUBLIC' }
          ]}
          disabled={!isEditing}
          fullWidth
          helperText={
            quizData.visibility === 'PUBLIC' 
              ? 'This quiz will be visible to all users' 
              : 'This quiz will only be visible to you'
          }
        />

        {/* Difficulty */}
        <Dropdown
          label="Difficulty Level"
          value={quizData.difficulty || 'MEDIUM'}
          onChange={(value) => onDataChange({ ...quizData, difficulty: (typeof value === 'string' ? value : value[0]) as Difficulty })}
          options={[
            { label: 'Easy - Suitable for beginners', value: 'EASY' },
            { label: 'Medium - Balanced difficulty', value: 'MEDIUM' },
            { label: 'Hard - Challenging questions', value: 'HARD' }
          ]}
          disabled={!isEditing}
          fullWidth
          helperText="This helps users understand the expected difficulty level"
        />

        {/* Timer Settings */}
        <div className="space-y-4">
          <Checkbox
            name="timerEnabled"
            checked={quizData.timerEnabled || false}
            onChange={(checked) => onDataChange({ ...quizData, timerEnabled: checked })}
            label="Enable Timer"
            description="When enabled, users will have a time limit to complete the quiz"
            disabled={!isEditing}
          />

          {quizData.timerEnabled && (
            <Input
              type="number"
              id="timerDuration"
              name="timerDuration"
              min={1}
              max={180}
              value={quizData.timerDuration || ''}
              onChange={handleInputChange}
              placeholder="Enter timer duration..."
              label="Timer Duration (minutes)"
              disabled={!isEditing}
              error={combinedErrors.timerDuration}
              helperText="Time limit for completing the quiz (1-180 minutes)"
              fullWidth
            />
          )}
        </div>

        {/* Estimated Time */}
        <Input
          type="number"
          id="estimatedTime"
          name="estimatedTime"
          min={1}
          max={180}
          value={quizData.estimatedTime || ''}
          onChange={handleInputChange}
          placeholder="Enter estimated time..."
          label={
            <>
              Estimated Time (minutes) <span className="text-theme-interactive-danger">*</span>
            </>
          }
          disabled={!isEditing}
          error={combinedErrors.estimatedTime}
          helperText="Estimated time to complete the quiz (1-180 minutes)"
          fullWidth
        />

        {/* Repetition Settings */}
        <Checkbox
          name="isRepetitionEnabled"
          checked={quizData.isRepetitionEnabled || false}
          onChange={(checked) => onDataChange({ ...quizData, isRepetitionEnabled: checked })}
          label="Allow Multiple Attempts"
          description="When enabled, users can take this quiz multiple times"
          disabled={!isEditing}
        />

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