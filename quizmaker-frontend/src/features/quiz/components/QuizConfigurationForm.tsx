// src/features/quiz/components/QuizConfigurationForm.tsx
// ---------------------------------------------------------------------------
// Form component for configuring basic quiz settings before creation.
// This is step 2 of the quiz creation wizard.
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { CreateQuizRequest, Visibility, Difficulty } from '@/types';
import { Button, Input, useToast } from '@/components';
import { CreationMethod } from './QuizCreationWizard';

interface QuizConfigurationFormProps {
  quizData: Partial<CreateQuizRequest>;
  onDataChange: (data: Partial<CreateQuizRequest>) => void;
  errors: Record<string, string | undefined>;
  creationMethod: CreationMethod | null;
  onCreateQuiz: () => void;
  isCreating: boolean;
}

export const QuizConfigurationForm: React.FC<QuizConfigurationFormProps> = ({
  quizData,
  onDataChange,
  errors,
  creationMethod,
  onCreateQuiz,
  isCreating
}) => {
  const { addToast } = useToast();
  const [localData, setLocalData] = useState<Partial<CreateQuizRequest>>(quizData);

  // Update local data when props change
  useEffect(() => {
    setLocalData(quizData);
  }, [quizData]);

  const handleInputChange = (field: keyof CreateQuizRequest, value: any) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onDataChange(newData);
  };

  const getMethodSpecificTitle = () => {
    switch (creationMethod) {
      case 'manual':
        return 'Configure Your Manual Quiz';
      case 'text':
        return 'Configure Your Text-Based Quiz';
      case 'document':
        return 'Configure Your Document-Based Quiz';
      default:
        return 'Configure Your Quiz';
    }
  };

  const getMethodSpecificDescription = () => {
    switch (creationMethod) {
      case 'manual':
        return 'Set up the basic information for your manually created quiz. You\'ll add questions in the next step.';
      case 'text':
        return 'Configure your quiz settings. After creation, AI will generate questions based on your text content.';
      case 'document':
        return 'Set up your quiz configuration. The system will analyze your document and generate relevant questions.';
      default:
        return 'Configure the basic settings for your quiz.';
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-theme-text-primary mb-2">
          {getMethodSpecificTitle()}
        </h3>
        <p className="text-theme-text-secondary">
          {getMethodSpecificDescription()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column - Basic info */}
        <div className="space-y-6">
          <div className="bg-theme-bg-secondary rounded-lg p-6">
            <h4 className="text-lg font-medium text-theme-text-primary mb-4">Basic Information</h4>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Quiz Title *
              </label>
              <Input
                type="text"
                value={localData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter quiz title..."
                maxLength={100}
                className={errors.title ? 'border-theme-border-danger' : ''}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-theme-interactive-danger">{errors.title}</p>
              )}
              <p className="mt-1 text-xs text-theme-text-tertiary">
                A clear, descriptive title for your quiz (3-100 characters)
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Description
              </label>
              <textarea
                value={localData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter quiz description..."
                rows={4}
                maxLength={1000}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary ${
                  errors.description ? 'border-theme-border-danger' : 'border-theme-border-primary'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-theme-interactive-danger">{errors.description}</p>
              )}
              <div className="text-xs text-theme-text-tertiary mt-1">
                {(localData.description || '').length}/1000 characters
              </div>
              <p className="mt-1 text-xs text-theme-text-tertiary">
                Optional description to help users understand the quiz
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                  Visibility
                </label>
                <select
                  value={localData.visibility || 'PRIVATE'}
                  onChange={(e) => handleInputChange('visibility', e.target.value as Visibility)}
                  className="w-full px-3 py-2 border border-theme-border-primary rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                >
                  <option value="PRIVATE" className="bg-theme-bg-primary text-theme-text-primary">Private</option>
                  <option value="PUBLIC" className="bg-theme-bg-primary text-theme-text-primary">Public</option>
                </select>
                <p className="mt-1 text-xs text-theme-text-tertiary">Who can see this quiz</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                  Difficulty
                </label>
                <select
                  value={localData.difficulty || 'MEDIUM'}
                  onChange={(e) => handleInputChange('difficulty', e.target.value as Difficulty)}
                  className="w-full px-3 py-2 border border-theme-border-primary rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                >
                  <option value="EASY" className="bg-theme-bg-primary text-theme-text-primary">Easy</option>
                  <option value="MEDIUM" className="bg-theme-bg-primary text-theme-text-primary">Medium</option>
                  <option value="HARD" className="bg-theme-bg-primary text-theme-text-primary">Hard</option>
                </select>
                <p className="mt-1 text-xs text-theme-text-tertiary">Overall quiz difficulty</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Settings */}
        <div className="space-y-6">
          <div className="bg-theme-bg-secondary rounded-lg p-6">
            <h4 className="text-lg font-medium text-theme-text-primary mb-4">Quiz Settings</h4>

            <div className="mb-4">
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Estimated Time (minutes) *
              </label>
              <Input
                type="number"
                value={localData.estimatedTime || ''}
                onChange={(e) => handleInputChange('estimatedTime', parseInt(e.target.value) || 0)}
                placeholder="30"
                min={1}
                max={180}
                className={errors.estimatedTime ? 'border-theme-border-danger' : ''}
              />
              {errors.estimatedTime && (
                <p className="mt-1 text-sm text-theme-interactive-danger">{errors.estimatedTime}</p>
              )}
              <p className="mt-1 text-xs text-theme-text-tertiary">
                How long the quiz should take to complete (1-180 minutes)
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-theme-text-secondary">Enable Timer</label>
                  <p className="text-xs text-theme-text-tertiary">Add a time limit for the quiz</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localData.timerEnabled || false}
                    onChange={(e) => handleInputChange('timerEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-theme-bg-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-theme-border-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-theme-bg-primary after:border-theme-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary"></div>
                </label>
              </div>

              {localData.timerEnabled && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                    Timer Duration (minutes) *
                  </label>
                  <Input
                    type="number"
                    value={localData.timerDuration || ''}
                    onChange={(e) => handleInputChange('timerDuration', parseInt(e.target.value) || 0)}
                    placeholder="30"
                    min={1}
                    max={180}
                    className={errors.timerDuration ? 'border-theme-border-danger' : ''}
                  />
                  {errors.timerDuration && (
                    <p className="mt-1 text-sm text-theme-interactive-danger">{errors.timerDuration}</p>
                  )}
                  <p className="mt-1 text-xs text-theme-text-tertiary">
                    Time limit for the quiz (1-180 minutes)
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Method-specific settings */}
          {creationMethod && (
            <div className="bg-theme-bg-info rounded-lg p-6">
              <h4 className="text-lg font-medium text-theme-text-primary mb-4">
                {creationMethod === 'manual' && 'Manual Creation Settings'}
                {creationMethod === 'text' && 'Text Generation Settings'}
                {creationMethod === 'document' && 'Document Generation Settings'}
              </h4>
              
              {creationMethod === 'manual' && (
                <p className="text-sm text-theme-text-secondary">
                  You'll be able to add questions manually in the next step. Choose from various question types and create custom content.
                </p>
              )}
              
              {creationMethod === 'text' && (
                <p className="text-sm text-theme-text-secondary">
                  After creating the quiz, you'll be prompted to paste your text content. AI will analyze it and generate relevant questions.
                </p>
              )}
              
              {creationMethod === 'document' && (
                <p className="text-sm text-theme-text-secondary">
                  After creating the quiz, you'll be able to upload a document. The system will process it and generate questions automatically.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Quiz Button */}
      <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-lg font-medium text-theme-text-primary">Ready to Create Quiz?</h4>
            <p className="text-sm text-theme-text-secondary mt-1">
              Review your settings above. You can always modify them later.
            </p>
            <p className="text-xs text-theme-text-tertiary mt-2">
              The quiz will be created as a draft. You'll add questions in the next step.
            </p>
          </div>
          <div className="ml-6">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={onCreateQuiz}
              loading={isCreating}
              disabled={isCreating}
            >
              {isCreating ? 'Creating Quiz...' : 'Create Quiz & Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
