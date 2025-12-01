// ---------------------------------------------------------------------------
// DocumentQuizConfigurationForm.tsx - Configuration form for document-based quiz generation
// Includes document upload, page selection, and AI generation parameters
// ---------------------------------------------------------------------------

import React, { useState, useMemo } from 'react';
import { CreateQuizRequest, Difficulty, QuestionType } from '@/types';
import { Button, Input, useToast, Dropdown, Hint, ButtonWithValidationTooltip } from '@/components';
import { QuizWizardDraft } from '@/features/quiz/types/quizWizard.types';
import { FastDocumentPreviewModal } from '@/features/document';
import { RectangleStackIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { tokenEstimationService } from '@/services';
import { TokenEstimationDisplay } from '@/features/ai';

interface DocumentQuizConfigurationFormProps {
  quizData: QuizWizardDraft;
  onDataChange: (data: QuizWizardDraft) => void;
  errors: Record<string, string | undefined>;
  onCreateQuiz: (data?: QuizWizardDraft) => void;
  isCreating: boolean;
}

interface DocumentGenerationConfig {
  file: File | null;
  quizScope: 'ENTIRE_DOCUMENT' | 'SPECIFIC_CHAPTER' | 'SPECIFIC_CHUNKS';
  questionsPerType: Record<string, number>;
  difficulty: Difficulty;
}

export const DocumentQuizConfigurationForm: React.FC<DocumentQuizConfigurationFormProps> = ({
  onDataChange,
  errors,
  onCreateQuiz,
  isCreating
}) => {
  const { addToast } = useToast();
  
  // Keep all state completely local - no syncing with parent until submission
  const [localData, setLocalData] = useState<Partial<CreateQuizRequest>>({
    title: '',
    description: '',
    difficulty: 'MEDIUM',
    estimatedTime: 30,
    timerDuration: 30,
    timerEnabled: false,
    isRepetitionEnabled: false,
    visibility: 'PRIVATE'
  });
  
  const [generationConfig, setGenerationConfig] = useState<DocumentGenerationConfig>({
    file: null,
    quizScope: 'ENTIRE_DOCUMENT',
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

  // Page selection state
  const [selectedPageNumbers, setSelectedPageNumbers] = useState<number[]>([]);
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/epub+zip',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        addToast({ message: 'Please upload a PDF, EPUB, Word document, or text file' });
        return;
      }

      // Validate file size (150MB max)
      if (file.size > 150 * 1024 * 1024) {
        addToast({ message: 'File size must be less than 150MB' });
        return;
      }

      // Reset previous selection when new file is uploaded
      setSelectedPageNumbers([]);
      setSelectedContent('');
      setGenerationConfig(prev => ({ ...prev, file }));
      
      // Open preview modal for all file types
      setShowPreviewModal(true);
    }
  };

  const handlePageSelectionConfirm = (data: {
    selectedPageNumbers: number[];
    selectedContent: string;
  }) => {
    setSelectedPageNumbers(data.selectedPageNumbers);
    setSelectedContent(data.selectedContent);
    setShowPreviewModal(false);
    
    // Auto-populate title from filename if not set (max 100 chars)
    if (!localData.title && generationConfig.file) {
      let fileName = generationConfig.file.name.replace(/\.[^/.]+$/, '');
      if (fileName.length > 100) {
        fileName = fileName.substring(0, 100);
      }
      setLocalData(prev => ({ ...prev, title: fileName }));
    }
    
    addToast({
      type: 'success',
      message: `${data.selectedPageNumbers.length} pages selected (${data.selectedContent.length} characters)`
    });
  };

  const handleOpenPageSelector = () => {
    if (!generationConfig.file) {
      addToast({ type: 'error', message: 'Please upload a document first' });
      return;
    }
    setShowPreviewModal(true);
  };

  // Calculate token estimation based on selected pages
  const tokenEstimation = useMemo(() => {
    // Need file and at least one page selected
    if (!generationConfig.file || selectedPageNumbers.length === 0) {
      return null;
    }

    // Filter out question types with 0 questions and convert to QuestionType format
    const filteredQuestionTypes = Object.entries(generationConfig.questionsPerType)
      .filter(([_, count]) => count > 0)
      .reduce((acc, [type, count]) => {
        const questionType = type as QuestionType;
        acc[questionType] = count;
        return acc;
      }, {} as Partial<Record<QuestionType, number>>);

    // Check if at least one question type has count > 0
    if (Object.keys(filteredQuestionTypes).length === 0) {
      return null;
    }

    try {
      // Estimate character count based on number of selected pages
      // Average page typically has ~2000-3000 characters
      // We'll use a conservative estimate of 5000 characters per page
      const AVERAGE_CHARS_PER_PAGE = 5000;
      const estimatedCharCount = selectedPageNumbers.length * AVERAGE_CHARS_PER_PAGE;
      
      // Create a placeholder content string for estimation (use actual characters, not just spaces)
      // Use a repeating pattern that won't be trimmed
      const placeholderPattern = 'Lorem ipsum dolor sit amet consectetur adipiscing elit. ';
      const repeatCount = Math.ceil(estimatedCharCount / placeholderPattern.length);
      const placeholderContent = placeholderPattern.repeat(Math.max(1, repeatCount)).substring(0, estimatedCharCount);
      
      return tokenEstimationService.estimateFromText(
        placeholderContent,
        filteredQuestionTypes as Record<QuestionType, number>,
        generationConfig.difficulty || localData.difficulty || 'MEDIUM'
      );
    } catch (error) {
      console.error('Token estimation error:', error);
      return null;
    }
  }, [generationConfig.file, selectedPageNumbers.length, generationConfig.questionsPerType, generationConfig.difficulty, localData.difficulty]);

  // Get missing requirements for disabled button tooltip
  const getMissingRequirements = (): string[] => {
    const missing: string[] = [];
    
    if (!generationConfig.file) {
      missing.push('Document file is required');
    }
    
    if (selectedPageNumbers.length === 0) {
      missing.push('Please select at least one page from the document');
    }
    
    const totalQuestions = Object.values(generationConfig.questionsPerType).reduce((sum, count) => sum + count, 0);
    if (totalQuestions === 0) {
      missing.push('At least one question type must have a count greater than 0');
    }
    
    return missing;
  };

  const missingRequirements = getMissingRequirements();
  const isButtonDisabled = isCreating || missingRequirements.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation - check all required fields before submission
    if (!generationConfig.file) {
      addToast({ message: 'Please upload a document' });
      return;
    }

    // Validate page selection
    if (selectedPageNumbers.length === 0 || !selectedContent) {
      addToast({ type: 'error', message: 'Please select pages from the document' });
      return;
    }

    // Check if at least one question type is selected
    const totalQuestions = Object.values(generationConfig.questionsPerType).reduce((sum, count) => sum + count, 0);
    if (totalQuestions === 0) {
      addToast({ message: 'Please select at least one question type with a count greater than 0' });
      return;
    }

    // Prepare the generation request as FormData
    const formData = new FormData();
    
    // For ALL file types, create a text file with selected content
    const selectedBlob = new Blob([selectedContent], { type: 'text/plain' });
    const selectedFile = new File(
      [selectedBlob], 
      `selected-${generationConfig.file!.name}.txt`,
      { type: 'text/plain' }
    );
    
    formData.append('file', selectedFile);
    formData.append('quizScope', 'ENTIRE_DOCUMENT');
    
    // Document title (for the document itself, not the quiz)
    const documentTitle = generationConfig.file?.name.replace(/\.[^/.]+$/, '') || 'Selected Content';
    formData.append('title', documentTitle);
    
    // Document processing parameters - always use SIZE_BASED with 100000 chunk size (backend max limit)
    formData.append('chunkingStrategy', 'SIZE_BASED');
    formData.append('maxChunkSize', '100000');
    
    formData.append('quizTitle', localData.title!);
    if (localData.description) {
      formData.append('quizDescription', localData.description);
    }
    
    // Filter out question types with 0 counts (API expects only types with actual counts)
    const filteredQuestionsPerType = Object.entries(generationConfig.questionsPerType)
      .filter(([, count]) => count > 0)
      .reduce((acc, [type, count]) => {
        acc[type] = count;
        return acc;
      }, {} as Record<string, number>);
    
    formData.append('questionsPerType', JSON.stringify(filteredQuestionsPerType));
    formData.append('difficulty', localData.difficulty || 'MEDIUM');
    if (localData.categoryId) {
      formData.append('categoryId', localData.categoryId);
    }
    if (localData.tagIds && localData.tagIds.length > 0) {
      formData.append('tagIds', JSON.stringify(localData.tagIds));
    }

    const generationRequest = formData;

    // NOW send all data to parent - only at submission time
    // Use the quiz title or auto-generate from filename (max 100 chars for validation)
    let finalTitle = localData.title?.trim() || generationConfig.file?.name.replace(/\.[^/.]+$/, '') || 'Generated Quiz';
    if (finalTitle.length > 100) {
      finalTitle = finalTitle.substring(0, 100);
    }
    const dataWithConfig: QuizWizardDraft = {
      ...localData,
      title: finalTitle,
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
          Configure Your Document-Based Quiz
        </h3>
        <p className="text-theme-text-secondary">
          Upload a document and configure how the AI should generate questions from it.
        </p>
      </div>

      {/* Display validation errors from parent */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Validation Errors:</h4>
          <ul className="list-disc list-inside text-sm text-red-700">
            {Object.entries(errors).map(([key, value]) => (
              <li key={key}>{key}: {value}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Quiz Settings */}
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
          <h4 className="text-lg font-medium text-theme-text-primary mb-4">Basic Quiz Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Document Upload */}
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
          <h4 className="text-lg font-medium text-theme-text-primary mb-4">Document Upload</h4>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-theme-text-secondary mb-2">
              Upload Document *
            </label>
            <div className="border-2 border-dashed border-theme-border-primary rounded-lg p-6 text-center bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.epub,.doc,.docx,.txt"
                className="hidden"
                id="document-upload"
              />
              <label htmlFor="document-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-2">
                  <p className="text-sm text-theme-text-secondary">
                    <span className="font-medium text-theme-interactive-primary hover:text-theme-interactive-primary">
                      Click to upload
                    </span> or drag and drop
                  </p>
                  <p className="text-xs text-theme-text-tertiary">
                    PDF, EPUB, DOC, DOCX, TXT up to 150MB
                    <span className="block mt-1 text-theme-interactive-primary font-medium">Preview will open immediately - select pages visually!</span>
                  </p>
                </div>
              </label>
            </div>
            
            {generationConfig.file && (
              <div className="mt-3 p-3 bg-theme-bg-success border border-theme-border-success rounded-md">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-theme-text-tertiary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-theme-interactive-success">
                    {generationConfig.file.name} ({(generationConfig.file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Token Estimation */}
          {generationConfig.file && selectedPageNumbers.length > 0 && tokenEstimation && (
            <div className="mt-4">
              <TokenEstimationDisplay 
                estimation={tokenEstimation} 
                showBreakdown={false}
              />
              <p className="text-xs text-theme-text-tertiary mt-2">
                * Estimation based on {selectedPageNumbers.length} selected page{selectedPageNumbers.length !== 1 ? 's' : ''} (~{selectedPageNumbers.length * 5000} characters). Actual usage may vary.
              </p>
            </div>
          )}


        </div>

        {/* Page Selection Summary */}
        {generationConfig.file && (
          <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-theme-text-primary mb-1">Page Selection</h4>
                <p className="text-sm text-theme-text-secondary">
                  {selectedPageNumbers.length > 0 
                    ? `${selectedPageNumbers.length} pages selected` 
                    : 'Click to preview and select pages'}
                </p>
              </div>
            </div>

            {selectedPageNumbers.length > 0 ? (
              <>
                <div className="mb-4 p-4 bg-theme-bg-success border border-theme-border-success rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircleIcon className="h-5 w-5 text-theme-interactive-success mr-2" />
                    <span className="font-medium text-theme-text-primary">
                      {selectedPageNumbers.length} pages selected
                    </span>
                  </div>
                  <div className="text-sm text-theme-text-secondary">
                    <strong>Pages:</strong>{' '}
                    {selectedPageNumbers.slice(0, 15).join(', ')}
                    {selectedPageNumbers.length > 15 && ` and ${selectedPageNumbers.length - 15} more...`}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleOpenPageSelector}
                  className="w-full"
                >
                  <RectangleStackIcon className="h-5 w-5 mr-2" />
                  Change Page Selection
                </Button>
              </>
            ) : (
              <div className="text-center">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleOpenPageSelector}
                  className="w-full"
                >
                  <RectangleStackIcon className="h-5 w-5 mr-2" />
                  Open Preview & Select Pages
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Document Preview Modal - Opens immediately when file is selected */}
        {generationConfig.file && showPreviewModal && (
          <FastDocumentPreviewModal
            file={generationConfig.file}
            initialSelection={selectedPageNumbers}
            onConfirm={handlePageSelectionConfirm}
            onCancel={() => setShowPreviewModal(false)}
          />
        )}

        {/* Questions per type */}
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
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
            {isCreating ? 'Generating Quiz...' : 'Generate Quiz from Document'}
          </ButtonWithValidationTooltip>
        </div>
      </form>
    </div>
  );
};
