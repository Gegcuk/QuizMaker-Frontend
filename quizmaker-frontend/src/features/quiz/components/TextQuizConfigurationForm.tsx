// ---------------------------------------------------------------------------
// TextQuizConfigurationForm.tsx - Configuration form for text-based quiz generation
// Includes text input and AI generation parameters
// ---------------------------------------------------------------------------

import React, { useState, useMemo } from 'react';
import { CreateQuizRequest, Difficulty, QuestionType } from '@/types';
import { Button, Input, useToast, Dropdown, Textarea, Hint, Alert, ButtonWithValidationTooltip } from '@/components';
import { QuizWizardDraft } from '@/features/quiz/types/quizWizard.types';
import { tokenEstimationService } from '@/services';
import { TokenEstimationDisplay } from '@/features/ai';

interface TextQuizConfigurationFormProps {
  quizData: QuizWizardDraft;
  onDataChange: (data: QuizWizardDraft) => void;
  errors: Record<string, string | undefined>;
  onCreateQuiz: (data?: QuizWizardDraft) => void;
  isCreating: boolean;
}

interface TextGenerationConfig {
  text: string;
  questionsPerType: Record<string, number>;
  difficulty: Difficulty;
}

export const TextQuizConfigurationForm: React.FC<TextQuizConfigurationFormProps> = ({
  onDataChange,
  errors,
  onCreateQuiz,
  isCreating
}) => {
  const { addToast } = useToast();
  
  // Local validation errors state
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  
  // Keep all state completely local - no syncing with parent until submission
  const [localData, setLocalData] = useState<Partial<CreateQuizRequest>>({
    title: '',
    description: '',
    difficulty: 'MEDIUM'
  });
  
  const [generationConfig, setGenerationConfig] = useState<TextGenerationConfig>({
    text: '',
    questionsPerType: {
      MCQ_SINGLE: 3,
      MCQ_MULTI: 1,
      TRUE_FALSE: 2,
      FILL_GAP: 1,
      COMPLIANCE: 0,
      ORDERING: 0,
      MATCHING: 0
    },
    difficulty: 'MEDIUM'
  });

  const handleInputChange = <K extends keyof CreateQuizRequest>(field: K, value: CreateQuizRequest[K]) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (localErrors[field]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleGenerationConfigChange = <K extends keyof TextGenerationConfig>(field: K, value: TextGenerationConfig[K]) => {
    setGenerationConfig(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (localErrors[field]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Get missing requirements for disabled button tooltip
  const getMissingRequirements = (): string[] => {
    const missing: string[] = [];
    
    if (!localData.title?.trim()) {
      missing.push('Quiz title is required');
    }
    
    if (!generationConfig.text.trim()) {
      missing.push('Text content is required');
    } else if (generationConfig.text.trim().length < 300) {
      const currentLength = generationConfig.text.trim().length;
      missing.push(`Text content must be at least 300 characters (currently ${currentLength}, missing ${300 - currentLength})`);
    }
    
    const totalQuestions = Object.values(generationConfig.questionsPerType).reduce((sum, count) => sum + count, 0);
    if (totalQuestions === 0) {
      missing.push('At least one question type must have a count greater than 0');
    }
    
    return missing;
  };

  const missingRequirements = getMissingRequirements();
  const isButtonDisabled = isCreating || missingRequirements.length > 0;

  const handleQuestionTypeChange = (type: string, count: number) => {
    const getMaxForType = (t: string) => {
      switch (t) {
        case 'MCQ_MULTI':
          return 5;
        case 'OPEN':
          return 5;
        case 'FILL_GAP':
          return 5;
        case 'ORDERING':
          return 3;
        case 'MCQ_SINGLE':
          return 10;
        case 'TRUE_FALSE':
          return 10;
        case 'COMPLIANCE':
          return 10;
        case 'MATCHING':
          return 5;
        default:
          return 10;
      }
    };
    const max = getMaxForType(type);
    const clamped = Math.max(0, Math.min(count, max));
    setGenerationConfig(prev => ({
      ...prev,
      questionsPerType: {
        ...prev.questionsPerType,
        [type]: clamped
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    const validationErrors: Record<string, string> = {};
    
    // Validation - check all required fields before submission
    if (!localData.title?.trim()) {
      validationErrors.title = 'Quiz title is required';
    }
    
    if (!generationConfig.text.trim()) {
      validationErrors.text = 'Text content is required';
    } else if (generationConfig.text.trim().length < 300) {
      const currentLength = generationConfig.text.trim().length;
      validationErrors.text = `Text content must be at least 300 characters long (currently ${currentLength} characters, missing ${300 - currentLength} characters)`;
    } else if (generationConfig.text.length > 100000) {
      validationErrors.text = 'Text content must not exceed 100,000 characters';
    }

    // Check if at least one question type is selected
    const totalQuestions = Object.values(generationConfig.questionsPerType).reduce((sum, count) => sum + count, 0);
    if (totalQuestions === 0) {
      validationErrors.questionTypes = 'Please select at least one question type with a count greater than 0';
    }

    // Set errors and return if validation failed
    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      // Show toast with all errors
      const errorMessages = Object.values(validationErrors).join(', ');
      addToast({ type: 'error', message: errorMessages });
      return;
    }

    // Clear errors if validation passed
    setLocalErrors({});

    // Filter out question types with 0 counts (API expects only types with actual counts)
    const filteredQuestionsPerType = Object.entries(generationConfig.questionsPerType)
      .filter(([, count]) => count > 0)
      .reduce((acc, [type, count]) => {
        acc[type] = count;
        return acc;
      }, {} as Record<string, number>);

    // Prepare the generation request
    const generationRequest = {
      text: generationConfig.text,
      quizTitle: localData.title,
      quizDescription: localData.description || '',
      questionsPerType: filteredQuestionsPerType,
      difficulty: localData.difficulty || 'MEDIUM',
      // Always use SIZE_BASED with 100000 chunk size (backend max limit)
      chunkingStrategy: 'SIZE_BASED' as const,
      maxChunkSize: 100000,
      // Only include categoryId and tagIds if they have values
      ...(localData.categoryId && { categoryId: localData.categoryId }),
      ...(localData.tagIds && localData.tagIds.length > 0 && { tagIds: localData.tagIds })
    };

    // NOW send all data to parent - only at submission time
    const dataWithConfig: QuizWizardDraft = {
      ...localData,
      generationConfig,
      generationRequest,
    };
    onDataChange(dataWithConfig);
    onCreateQuiz(dataWithConfig);
  };

  // Calculate token estimation
  const tokenEstimation = useMemo(() => {
    if (!generationConfig.text.trim() || generationConfig.text.trim().length < 300) {
      return null;
    }

    // Filter out question types with 0 questions and convert to QuestionType format
    const filteredQuestionTypes = Object.entries(generationConfig.questionsPerType)
      .filter(([_, count]) => count > 0)
      .reduce((acc, [type, count]) => {
        // Map string type to QuestionType
        const questionType = type as QuestionType;
        acc[questionType] = count;
        return acc;
      }, {} as Partial<Record<QuestionType, number>>);

    // Check if at least one question type has count > 0
    if (Object.keys(filteredQuestionTypes).length === 0) {
      return null;
    }

    try {
      return tokenEstimationService.estimateFromText(
        generationConfig.text.trim(),
        filteredQuestionTypes,
        localData.difficulty || generationConfig.difficulty || 'MEDIUM'
      );
    } catch (error) {
      console.error('Token estimation error:', error);
      return null;
    }
  }, [generationConfig.text, generationConfig.questionsPerType, localData.difficulty, generationConfig.difficulty]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-theme-text-primary mb-2">
          Configure Your Text-Based Quiz
        </h3>
        <p className="text-theme-text-secondary">
          Provide your text content and configure how the AI should generate questions from it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Quiz Settings */}
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
          <h4 className="text-lg font-medium text-theme-text-primary mb-4">Basic Quiz Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quiz Title */}
            <div data-field="title">
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Quiz Title *
              </label>
              <Input
                type="text"
                value={localData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter quiz title..."
                className="w-full"
                error={localErrors.title || errors.title}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Description
              </label>
              <Input
                type="text"
                value={localData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description..."
                className="w-full"
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
          </div>
        </div>

        {/* Text Content */}
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
          <h4 className="text-lg font-medium text-theme-text-primary mb-4">Text Content</h4>
          
          <div className="mb-4" data-field="text">
            <Textarea
              label="Text Content *"
              value={generationConfig.text}
              onChange={(e) => handleGenerationConfigChange('text', e.target.value)}
              rows={8}
              placeholder="Paste your text content here. The AI will analyze it and generate relevant questions..."
              showCharCount
              maxLength={100000}
              helperText={localErrors.text || "The AI will analyze your text and generate relevant questions"}
              error={localErrors.text}
              fullWidth
            />
          </div>

          {/* Token Estimation */}
          <div className="mt-4">
            <TokenEstimationDisplay estimation={tokenEstimation} />
          </div>
        </div>

        {/* Questions per type */}
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary" data-field="questionTypes">
          {localErrors.questionTypes && (
            <Alert type="error" className="mb-4">
              {localErrors.questionTypes}
            </Alert>
          )}
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-lg font-medium text-theme-text-primary">Number of Questions per Type</h4>
            <Hint
              position="bottom"
              size="sm"
              content={
                <div className="space-y-2">
                  <p className="font-medium">Set how many questions to generate for each type.</p>
                  <p className="text-xs text-theme-text-tertiary">
                    <strong>Tip:</strong> Using multiple question types <strong className="italic text-theme-interactive-primary">significantly improves</strong> understanding and memorization by engaging different cognitive processes.
                  </p>
                  <p className="text-xs text-theme-text-tertiary border-t border-theme-border-primary pt-2">
                    <strong>Note:</strong> Each question type requires a separate API call, which increases token usage proportionally.
                  </p>
                </div>
              }
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(generationConfig.questionsPerType).map(([type, count]) => (
              <div key={type}>
                <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                  {(
                    type === 'MCQ_SINGLE' ? 'Single Choice' :
                    type === 'MCQ_MULTI' ? 'Multiple Choice' :
                    type === 'TRUE_FALSE' ? 'True/False' :
                    type === 'FILL_GAP' ? 'Fill in the Gap' :
                    type === 'COMPLIANCE' ? 'Compliance' :
                    type === 'ORDERING' ? 'Ordering' :
                    type === 'MATCHING' ? 'Matching' : type.replace('_', ' ')
                  )}
                </label>
                <Input
                  type="number"
                  value={count}
                  onChange={(e) => handleQuestionTypeChange(type, parseInt(e.target.value) || 0)}
                  min="0"
                  max="10"
                  className="w-full"
                />
              </div>
            ))}
          </div>

        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <ButtonWithValidationTooltip
            type="submit"
            variant="primary"
            disabled={isButtonDisabled}
            className="px-8"
            validationErrors={missingRequirements}
          >
            {isCreating ? 'Generating Quiz...' : 'Generate Quiz from Text'}
          </ButtonWithValidationTooltip>
        </div>
      </form>
    </div>
  );
};
