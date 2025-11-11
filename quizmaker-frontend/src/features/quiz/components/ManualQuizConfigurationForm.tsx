// ---------------------------------------------------------------------------
// ManualQuizConfigurationForm.tsx - Configuration form for manual quiz creation
// Basic quiz settings without AI generation parameters
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { CreateQuizRequest, Visibility, Difficulty } from '@/types';
import { Button, Input, useToast, Dropdown } from '@/components';
import { QuizWizardDraft } from '@/features/quiz/types/quizWizard.types';

interface ManualQuizConfigurationFormProps {
  quizData: QuizWizardDraft;
  onDataChange: (data: QuizWizardDraft) => void;
  errors: Record<string, string | undefined>;
  onCreateQuiz: (data?: QuizWizardDraft) => void;
  isCreating: boolean;
}

export const ManualQuizConfigurationForm: React.FC<ManualQuizConfigurationFormProps> = ({
  quizData,
  onDataChange,
  errors,
  onCreateQuiz,
  isCreating
}) => {
  const { addToast } = useToast();
  const [localData, setLocalData] = useState<Partial<CreateQuizRequest>>(quizData);

  useEffect(() => {
    setLocalData(quizData);
  }, [quizData]);

  const handleInputChange = (field: keyof CreateQuizRequest, value: any) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    onDataChange(newData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!localData.title?.trim()) {
      addToast({ message: 'Please enter a quiz title' });
      return;
    }
    
    const submissionData: QuizWizardDraft = { ...localData };
    onCreateQuiz(submissionData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-theme-text-primary mb-2">
          Configure Your Manual Quiz
        </h3>
        <p className="text-theme-text-secondary">
          Set up the basic information for your quiz. You'll add questions manually in the next step.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quiz Title */}
        <div>
          <label className="block text-sm font-medium text-theme-text-secondary mb-2">
            Quiz Title *
          </label>
          <Input
            type="text"
            value={localData.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter quiz title..."
            className="w-full"
            error={errors.title}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-theme-text-secondary mb-2">
            Description
          </label>
          <textarea
            value={localData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
            placeholder="Describe your quiz..."
          />
        </div>


        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-theme-text-secondary mb-2">
            Overall Difficulty
          </label>
          <Dropdown
            value={localData.difficulty || 'MEDIUM'}
            onChange={(value) => handleInputChange('difficulty', value as Difficulty)}
            options={[
              { label: 'Easy', value: 'EASY' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Hard', value: 'HARD' }
            ]}
          />
        </div>


        {/* Estimated Time */}
        <div>
          <label className="block text-sm font-medium text-theme-text-secondary mb-2">
            Estimated Time (minutes)
          </label>
          <Input
            type="number"
            value={localData.estimatedTime || ''}
            onChange={(e) => handleInputChange('estimatedTime', parseInt(e.target.value) || undefined)}
            placeholder="Estimated time to complete the quiz"
            min="1"
            max="300"
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={isCreating || !localData.title?.trim()}
            className="px-8"
          >
            {isCreating ? 'Creating Quiz...' : 'Create Quiz & Add Questions'}
          </Button>
        </div>
      </form>
    </div>
  );
};
