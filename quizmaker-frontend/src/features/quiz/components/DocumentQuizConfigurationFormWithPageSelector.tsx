// DocumentQuizConfigurationFormWithPageSelector.tsx
// Enhanced document-based quiz configuration with page selection support

import React, { useState } from 'react';
import { CreateQuizRequest, Difficulty, DocumentChunkDto, GenerateQuizFromDocumentRequest, QuizQuestionType } from '@/types';
import { Button, Input, useToast, Dropdown, Hint, Alert } from '@/components';
import { QuizWizardDraft } from '@/features/quiz/types/quizWizard.types';
import { DocumentPageSelector } from '@/features/document';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface DocumentQuizConfigurationFormWithPageSelectorProps {
  quizData: QuizWizardDraft;
  onDataChange: (data: QuizWizardDraft) => void;
  errors: Record<string, string | undefined>;
  onCreateQuiz: (data?: QuizWizardDraft) => void;
  isCreating: boolean;
}

interface DocumentGenerationConfig {
  documentId?: string;
  selectedChunkIndices?: number[];
  selectedChunks?: DocumentChunkDto[];
  quizScope: 'ENTIRE_DOCUMENT' | 'SPECIFIC_CHUNKS';
  questionsPerType: Record<string, number>;
}

export const DocumentQuizConfigurationFormWithPageSelector: React.FC<DocumentQuizConfigurationFormWithPageSelectorProps> = ({
  onDataChange,
  errors,
  onCreateQuiz,
  isCreating
}) => {
  const { addToast } = useToast();
  
  const [step, setStep] = useState<'select-pages' | 'configure'>('select-pages');
  
  const [localData, setLocalData] = useState<Partial<CreateQuizRequest>>({
    title: '',
    description: '',
    difficulty: 'MEDIUM'
  });
  
  const [generationConfig, setGenerationConfig] = useState<DocumentGenerationConfig>({
    quizScope: 'SPECIFIC_CHUNKS',
    questionsPerType: {
      MCQ_SINGLE: 3,
      MCQ_MULTI: 1,
      TRUE_FALSE: 2,
      FILL_GAP: 1,
      COMPLIANCE: 0,
      ORDERING: 0,
      MATCHING: 0
    },
  });

  const handleInputChange = <K extends keyof CreateQuizRequest>(field: K, value: CreateQuizRequest[K]) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerationConfigChange = <K extends keyof DocumentGenerationConfig>(field: K, value: DocumentGenerationConfig[K]) => {
    setGenerationConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionTypeChange = (type: string, count: number) => {
    const getMaxForType = (t: string) => {
      switch (t) {
        case 'MCQ_MULTI':
        case 'OPEN':
        case 'FILL_GAP':
        case 'MATCHING':
          return 5;
        case 'ORDERING':
          return 3;
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

  const handlePageSelectionComplete = (data: {
    documentId: string;
    selectedChunkIndices: number[];
    chunks: DocumentChunkDto[];
  }) => {
    setGenerationConfig(prev => ({
      ...prev,
      documentId: data.documentId,
      selectedChunkIndices: data.selectedChunkIndices,
      selectedChunks: data.chunks,
      quizScope: 'SPECIFIC_CHUNKS'
    }));

    if (!localData.title && data.chunks.length > 0) {
      const firstChunk = data.chunks[0];
      const docTitle = firstChunk.chapterTitle || 'Document';
      setLocalData(prev => ({
        ...prev,
        title: `${docTitle} Quiz`
      }));
    }

    addToast({ 
      type: 'success', 
      message: `${data.selectedChunkIndices.length} pages selected. Now configure your quiz.` 
    });

    setStep('configure');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!localData.title?.trim()) {
      addToast({ type: 'error', message: 'Please enter a quiz title' });
      return;
    }
    
    if (!generationConfig.documentId) {
      addToast({ type: 'error', message: 'Please select pages from a document first' });
      setStep('select-pages');
      return;
    }

    if (!generationConfig.selectedChunkIndices || generationConfig.selectedChunkIndices.length === 0) {
      addToast({ type: 'error', message: 'Please select at least one page' });
      setStep('select-pages');
      return;
    }

    const totalQuestions = Object.values(generationConfig.questionsPerType).reduce((sum, count) => sum + count, 0);
    if (totalQuestions === 0) {
      addToast({ type: 'error', message: 'Please select at least one question type with a count greater than 0' });
      return;
    }

    const filteredQuestionsPerType = Object.entries(generationConfig.questionsPerType)
      .filter(([, count]) => count > 0)
      .reduce((acc, [type, count]) => {
        acc[type as QuizQuestionType] = count;
        return acc;
      }, {} as Record<QuizQuestionType, number>);

    const generationRequest: GenerateQuizFromDocumentRequest = {
      documentId: generationConfig.documentId!,
      quizScope: 'SPECIFIC_CHUNKS',
      chunkIndices: generationConfig.selectedChunkIndices ?? [],
      questionsPerType: filteredQuestionsPerType,
      difficulty: (localData.difficulty || 'MEDIUM') as Difficulty,
      quizTitle: localData.title!,
      quizDescription: localData.description,
      categoryId: localData.categoryId,
      tagIds: localData.tagIds
    };

    const dataWithConfig: QuizWizardDraft = {
      ...localData,
      generationConfig,
      generationRequest,
    };
    onDataChange(dataWithConfig);
    onCreateQuiz(dataWithConfig);
  };

  if (step === 'select-pages') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <SparklesIcon className="h-8 w-8 text-theme-interactive-primary mr-2" />
            <h3 className="text-2xl font-bold text-theme-text-primary">
              Select Pages for Quiz Generation
            </h3>
          </div>
          <p className="text-theme-text-secondary max-w-2xl mx-auto">
            Upload your document, preview its contents, and select specific pages or sections 
            you want to use for generating quiz questions.
          </p>
        </div>

        <DocumentPageSelector
          onSelectionComplete={handlePageSelectionComplete}
          className="shadow-lg"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-theme-text-primary mb-2">
          Configure Your Quiz
        </h3>
        <p className="text-theme-text-secondary">
          Set up quiz details and question preferences for the selected pages.
        </p>
      </div>

      {generationConfig.selectedChunks && generationConfig.selectedChunks.length > 0 && (
        <div className="mb-6 p-4 bg-theme-bg-info border border-theme-border-primary rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-theme-text-primary mb-1">
                Selected Pages: {generationConfig.selectedChunkIndices?.length || 0}
              </h4>
              <p className="text-sm text-theme-text-secondary">
                {generationConfig.selectedChunks.map(c => c.title).slice(0, 3).join(', ')}
                {generationConfig.selectedChunks.length > 3 && ` and ${generationConfig.selectedChunks.length - 3} more...`}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStep('select-pages')}
            >
              Change Selection
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6">
          <h4 className="text-lg font-medium text-theme-text-primary mb-4">Basic Quiz Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-lg font-medium text-theme-text-primary">Number of Questions per Type</h4>
            <Hint
              position="right"
              size="sm"
              content="Set how many questions of each type to generate per selected page/chunk. The AI will attempt to create the specified number of questions based on the content."
            />
          </div>
          <p className="text-sm text-theme-text-secondary mb-4">
            Questions will be generated for each selected page/chunk
          </p>
          
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

          <Alert type="info" className="text-sm">
            <strong>Note:</strong> The total number of questions will be multiplied by the number of selected pages. 
            For example, 3 questions per type x 5 pages = 15 questions of that type.
          </Alert>
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep('select-pages')}
          >
            {'< Back to Page Selection'}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isCreating || !localData.title?.trim() || !generationConfig.documentId}
            className="px-8"
          >
            {isCreating ? 'Generating Quiz...' : 'Generate Quiz from Selected Pages'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DocumentQuizConfigurationFormWithPageSelector;

