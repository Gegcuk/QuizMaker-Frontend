// ---------------------------------------------------------------------------
// TextQuizConfigurationForm.tsx - Configuration form for text-based quiz generation
// Includes text input and AI generation parameters
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { CreateQuizRequest, Difficulty } from '@/types';
import { Button, Input, useToast } from '@/components';
import { QuizWizardDraft } from '@/features/quiz/types/quizWizard.types';

interface TextQuizConfigurationFormProps {
  quizData: QuizWizardDraft;
  onDataChange: (data: QuizWizardDraft) => void;
  errors: Record<string, string | undefined>;
  onCreateQuiz: (data?: QuizWizardDraft) => void;
  isCreating: boolean;
}

interface TextGenerationConfig {
  text: string;
  language: string;
  chunkingStrategy: 'CHAPTER_BASED' | 'FIXED_SIZE';
  maxChunkSize: number;
  questionsPerType: Record<string, number>;
  difficulty: Difficulty;
  estimatedTimePerQuestion: number;
}

export const TextQuizConfigurationForm: React.FC<TextQuizConfigurationFormProps> = ({
  quizData,
  onDataChange,
  errors,
  onCreateQuiz,
  isCreating
}) => {
  const { addToast } = useToast();
  const [localData, setLocalData] = useState<Partial<CreateQuizRequest>>(quizData);
  const [generationConfig, setGenerationConfig] = useState<TextGenerationConfig>({
    text: '',
    language: 'en',
    chunkingStrategy: 'CHAPTER_BASED',
    maxChunkSize: 5000,
    questionsPerType: {
      MCQ_SINGLE: 3,
      MCQ_MULTI: 1,
      TRUE_FALSE: 2,
      FILL_GAP: 1,
      COMPLIANCE: 0,
      ORDERING: 0,
      HOTSPOT: 0,
      MATCHING: 0
    },
    difficulty: 'MEDIUM',
    estimatedTimePerQuestion: 2
  });

  useEffect(() => {
    const { generationConfig: incomingGenerationConfig, ...rest } = quizData;
    const { generationRequest, ...baseQuizData } = rest as { generationRequest?: unknown } & Partial<CreateQuizRequest>;
    void generationRequest;
    setLocalData(baseQuizData);

    if (incomingGenerationConfig) {
      const config = incomingGenerationConfig as TextGenerationConfig;
      setGenerationConfig(prev => ({
        ...prev,
        ...config,
        questionsPerType: {
          ...prev.questionsPerType,
          ...config.questionsPerType,
        },
      }));
    }
  }, [quizData]);

  const handleInputChange = <K extends keyof CreateQuizRequest>(field: K, value: CreateQuizRequest[K]) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    // Preserve existing generationRequest and generationConfig when updating basic fields
    const dataToSend: QuizWizardDraft = {
      ...newData,
      generationRequest: quizData.generationRequest,
      generationConfig,
    };
    onDataChange(dataToSend);
  };

  const handleGenerationConfigChange = <K extends keyof TextGenerationConfig>(field: K, value: TextGenerationConfig[K]) => {
    const updatedConfig: TextGenerationConfig = {
      ...generationConfig,
      [field]: value,
    };

    setGenerationConfig(updatedConfig);

    const dataToSend: QuizWizardDraft = {
      ...localData,
      generationConfig: updatedConfig,
      generationRequest: quizData.generationRequest,
    };
    onDataChange(dataToSend);
  };

  const handleQuestionTypeChange = (type: string, count: number) => {
    const updatedQuestions = { ...generationConfig.questionsPerType, [type]: count };
    const updatedConfig: TextGenerationConfig = {
      ...generationConfig,
      questionsPerType: updatedQuestions,
    };

    setGenerationConfig(updatedConfig);

    const dataToSend: QuizWizardDraft = {
      ...localData,
      generationConfig: updatedConfig,
      generationRequest: quizData.generationRequest,
    };
    onDataChange(dataToSend);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!localData.title?.trim()) {
      addToast({ message: 'Please enter a quiz title' });
      return;
    }
    
    if (!generationConfig.text.trim()) {
      addToast({ message: 'Please enter text content for generation' });
      return;
    }

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
      language: generationConfig.language,
      chunkingStrategy: generationConfig.chunkingStrategy,
      maxChunkSize: generationConfig.maxChunkSize,
      quizTitle: localData.title,
      quizDescription: localData.description || '',
      questionsPerType: filteredQuestionsPerType,
      difficulty: generationConfig.difficulty,
      estimatedTimePerQuestion: generationConfig.estimatedTimePerQuestion,
      // Only include categoryId and tagIds if they have values
      ...(localData.categoryId && { categoryId: localData.categoryId }),
      ...(localData.tagIds && localData.tagIds.length > 0 && { tagIds: localData.tagIds })
    };


    // Store generation config in quizData for later use
    const dataWithConfig: QuizWizardDraft = {
      ...localData,
      generationConfig,
      generationRequest,
    };
    onDataChange(dataWithConfig);

    onCreateQuiz(dataWithConfig);
  };

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
              <select
                value={localData.difficulty || 'MEDIUM'}
                onChange={(e) => handleInputChange('difficulty', e.target.value as Difficulty)}
                className="w-full px-3 py-2 border border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
              >
                <option value="EASY" className="bg-theme-bg-primary text-theme-text-primary">Easy</option>
                <option value="MEDIUM" className="bg-theme-bg-primary text-theme-text-primary">Medium</option>
                <option value="HARD" className="bg-theme-bg-primary text-theme-text-primary">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
          <h4 className="text-lg font-medium text-theme-text-primary mb-4">Text Content</h4>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-theme-text-secondary mb-2">
              Text Content *
            </label>
            <textarea
              value={generationConfig.text}
              onChange={(e) => handleGenerationConfigChange('text', e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
              placeholder="Paste your text content here. The AI will analyze it and generate relevant questions..."
            />
            <p className="text-sm text-theme-text-tertiary mt-1">
              {generationConfig.text.length} characters (max 300,000)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Language
              </label>
              <select
                value={generationConfig.language}
                onChange={(e) => handleGenerationConfigChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
              >
                <option value="en" className="bg-theme-bg-primary text-theme-text-primary">English</option>
                <option value="es" className="bg-theme-bg-primary text-theme-text-primary">Spanish</option>
                <option value="fr" className="bg-theme-bg-primary text-theme-text-primary">French</option>
                <option value="de" className="bg-theme-bg-primary text-theme-text-primary">German</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Chunking Strategy
              </label>
              <select
                value={generationConfig.chunkingStrategy}
                onChange={(e) => handleGenerationConfigChange('chunkingStrategy', e.target.value)}
                className="w-full px-3 py-2 border border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
              >
                <option value="CHAPTER_BASED" className="bg-theme-bg-primary text-theme-text-primary">Chapter Based</option>
                <option value="FIXED_SIZE" className="bg-theme-bg-primary text-theme-text-primary">Fixed Size</option>
              </select>
            </div>
          </div>
        </div>

        {/* Generation Settings */}
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
          <h4 className="text-lg font-medium text-theme-text-primary mb-4">Question Generation Settings</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(generationConfig.questionsPerType).map(([type, count]) => (
              <div key={type}>
                <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                  {type.replace('_', ' ')}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Estimated Time per Question (minutes)
              </label>
              <Input
                type="number"
                value={generationConfig.estimatedTimePerQuestion}
                onChange={(e) => handleGenerationConfigChange('estimatedTimePerQuestion', parseInt(e.target.value) || 2)}
                min="1"
                max="10"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Max Chunk Size
              </label>
              <Input
                type="number"
                value={generationConfig.maxChunkSize}
                onChange={(e) => handleGenerationConfigChange('maxChunkSize', parseInt(e.target.value) || 5000)}
                min="1000"
                max="300000"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={isCreating || !localData.title?.trim() || !generationConfig.text.trim()}
            className="px-8"
          >
            {isCreating ? 'Generating Quiz...' : 'Generate Quiz from Text'}
          </Button>
        </div>
      </form>
    </div>
  );
};
