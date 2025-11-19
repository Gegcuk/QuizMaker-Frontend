// src/components/quiz/DocumentUploadTab.tsx
// ---------------------------------------------------------------------------
// Document upload and quiz generation tab
// Extracted from DocumentUploadWithQuizPage for integration into the new tabbed interface
// ---------------------------------------------------------------------------

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizService, api, tokenEstimationService } from '@/services';
import { QuizQuestionType, Difficulty, QuizScope, QuestionType } from '@/types';
import { GenerationProgress, TokenEstimationDisplay } from '@/features/ai';
import { Button, Alert, Input, Dropdown, Hint, Textarea } from '@/components';

export const DocumentUploadTab: React.FC = () => {
  const navigate = useNavigate();
  const quizService = new QuizService(api);
  
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGenerationJob, setActiveGenerationJob] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quiz generation configuration
  const [quizConfig, setQuizConfig] = useState({
    quizScope: 'ENTIRE_DOCUMENT' as QuizScope,
    quizDescription: '',
    questionTypes: {
      MCQ_SINGLE: 3,
      MCQ_MULTI: 1,
      TRUE_FALSE: 2,
      OPEN: 1,
      FILL_GAP: 1,
      COMPLIANCE: 0,
      ORDERING: 0,
      HOTSPOT: 0
    },
    difficulty: 'MEDIUM' as Difficulty,
    estimatedTimePerQuestion: 2,
    chunkingStrategy: 'AUTO',
    maxChunkSize: 50000
  });

  const validateFile = (file: File): string | null => {
    const maxFileSize = 150 * 1024 * 1024; // 150MB limit
    const supportedTypes = ['application/pdf', 'application/epub+zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds maximum allowed size of ${formatFileSize(maxFileSize)}`;
    }
    
    // Check file type
    if (!supportedTypes.includes(file.type)) {
      return `File type not supported. Supported types: PDF, EPUB, DOCX, TXT`;
    }
    
    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setSelectedFile(file);
    // Auto-generate quiz description from filename
    const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    setQuizConfig(prev => ({
      ...prev,
      quizDescription: `Quiz generated from ${fileName} document`
    }));
  };

  const validateQuestionTypes = (): string | null => {
    const questionTypes = quizConfig.questionTypes;
    const selectedTypes = Object.entries(questionTypes).filter(([_, count]) => count > 0);
    
    if (selectedTypes.length === 0) {
      return 'Please select at least one question type';
    }
    
    for (const [type, count] of selectedTypes) {
      if (count < 1) {
        return `Question type ${type} must have at least 1 question`;
      }
    }
    
    return null;
  };

  const handleUploadAndGenerate = async () => {
    if (!selectedFile) return;
    
    const validationError = validateQuestionTypes();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Document title (for the document itself, not the quiz)
      const documentTitle = selectedFile.name.replace(/\.[^/.]+$/, '');
      formData.append('title', documentTitle);
      
      // Auto-generate quiz title from document title (first 200 chars)
      const quizTitle = documentTitle.substring(0, 200);
      formData.append('quizTitle', quizTitle);
      
      // Filter out question types with 0 questions
      const filteredQuestionTypes = Object.entries(quizConfig.questionTypes)
        .filter(([_, count]) => count > 0)
        .reduce((acc, [type, count]) => {
          acc[type] = count;
          return acc;
        }, {} as Record<string, number>);
      
      formData.append('questionsPerType', JSON.stringify(filteredQuestionTypes));
      formData.append('difficulty', quizConfig.difficulty);
      formData.append('quizScope', quizConfig.quizScope);
      formData.append('chunkingStrategy', quizConfig.chunkingStrategy);
      formData.append('maxChunkSize', quizConfig.maxChunkSize.toString());
      formData.append('estimatedTimePerQuestion', quizConfig.estimatedTimePerQuestion.toString());
      
      if (quizConfig.quizDescription) {
        formData.append('quizDescription', quizConfig.quizDescription);
      }

      const response = await quizService.generateQuizFromUpload(formData);
      
      setSelectedFile(null);
      setActiveGenerationJob(response.jobId);
      setError(null);
      
      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Upload and generation failed';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const getChunkingStrategyDescription = (strategy: string): string => {
    switch (strategy) {
      case 'AUTO':
        return 'Automatically determine the best chunking strategy based on document structure';
      case 'CHAPTER_BASED':
        return 'Split document by chapters for better topic organization';
      case 'SECTION_BASED':
        return 'Split document by sections for detailed content breakdown';
      case 'SIZE_BASED':
        return 'Split document by size limits for consistent chunk sizes';
      case 'PAGE_BASED':
        return 'Split document by page boundaries for page-based organization';
      default:
        return '';
    }
  };

  // Calculate token estimation based on file size (rough estimate)
  // This is a simplified estimation - actual estimation would require chunk data
  const tokenEstimation = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    // Filter out question types with 0 questions and convert to QuestionType format
    const filteredQuestionTypes = Object.entries(quizConfig.questionTypes)
      .filter(([_, count]) => count > 0)
      .reduce((acc, [type, count]) => {
        // Map QuizQuestionType to QuestionType (they're mostly compatible)
        const questionType = type as QuestionType;
        acc[questionType] = count;
        return acc;
      }, {} as Partial<Record<QuestionType, number>>);

    // Check if at least one question type has count > 0
    if (Object.keys(filteredQuestionTypes).length === 0) {
      return null;
    }

    try {
      // Estimate character count from file size
      // Rough approximation: PDF/DOCX files typically have ~2000-3000 chars per KB
      // We'll use a conservative estimate of 2500 chars per KB
      const estimatedCharCount = Math.floor(selectedFile.size / 1024 * 2500);
      
      // Create a placeholder content string for estimation
      // The actual estimation will be more accurate once chunks are processed
      const placeholderContent = ' '.repeat(Math.max(0, estimatedCharCount));
      
      return tokenEstimationService.estimateFromText(
        placeholderContent,
        filteredQuestionTypes,
        quizConfig.difficulty
      );
    } catch (error) {
      console.error('Token estimation error:', error);
      return null;
    }
  }, [selectedFile, quizConfig.questionTypes, quizConfig.difficulty]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - File Upload */}
        <div className="space-y-6">
          <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
            <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Document Upload</h3>
            
            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive
                  ? 'border-theme-border-info bg-theme-bg-info'
                  : 'border-theme-border-primary hover:border-theme-border-secondary'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="text-6xl text-theme-text-tertiary">📄</div>
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="text-lg font-medium text-theme-text-primary">{selectedFile.name}</div>
                    <div className="text-sm text-theme-text-secondary">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove file
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-lg font-medium text-theme-text-primary">
                      Drag and drop your document here
                    </div>
                    <div className="text-sm text-theme-text-secondary">
                      or click to browse files
                    </div>
                    <div className="text-xs text-theme-text-tertiary">
                      Supported: PDF, DOCX, TXT • Max size: 150 MB
                    </div>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInputChange}
                  accept=".pdf,.epub,.docx,.txt,application/pdf,application/epub+zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  className="hidden"
                />
                
                {!selectedFile && (
                  <Button
                    variant="primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                )}
              </div>
            </div>

            {/* Document Processing Configuration */}
            {selectedFile && (
              <div className="mt-6 space-y-4">
                <h4 className="font-medium text-theme-text-primary">Document Processing</h4>
                
                {/* Chunking Strategy */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-theme-text-secondary">
                      Chunking Strategy
                    </label>
                    <Hint
                      position="right"
                      size="sm"
                    content={
                      <div className="space-y-2">
                        <p className="font-medium">How to split your document:</p>
                        <ul className="text-xs space-y-1">
                          <li><strong>Auto:</strong> Automatically selects the best strategy</li>
                          <li><strong>Chapter:</strong> Splits by chapter headings</li>
                        </ul>
                      </div>
                    }
                  />
                </div>
                <Dropdown
                  value={quizConfig.chunkingStrategy}
                  onChange={(value) => setQuizConfig(prev => ({
                    ...prev,
                    chunkingStrategy: typeof value === 'string' ? value : value[0]
                  }))}
                  options={[
                    { label: 'Auto - Best Strategy', value: 'AUTO' },
                    { label: 'Chapter Based', value: 'CHAPTER_BASED' }
                  ]}
                />
                </div>

                {/* Max Chunk Size */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-theme-text-secondary">
                      Maximum Chunk Size (characters)
                    </label>
                    <Hint
                      position="right"
                      size="sm"
                      content="Maximum number of characters per chunk. Recommended: 30,000-50,000 for optimal quiz generation. Range: 1,000-100,000."
                    />
                  </div>
                  <Input
                    type="number"
                    value={quizConfig.maxChunkSize}
                    onChange={(e) => setQuizConfig(prev => ({
                      ...prev,
                      maxChunkSize: parseInt(e.target.value) || 50000
                    }))}
                    min="1000"
                    max="100000"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quiz Configuration */}
        <div className="space-y-6">
          <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
            <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Quiz Configuration</h3>
            
            <div className="space-y-4">
              {/* Quiz Description */}
              <Textarea
                label="Quiz Description"
                value={quizConfig.quizDescription}
                onChange={(e) => setQuizConfig(prev => ({
                  ...prev,
                  quizDescription: e.target.value
                }))}
                placeholder="Enter quiz description..."
                rows={3}
              />

              {/* Quiz Scope */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-theme-text-secondary">
                    Quiz Scope
                  </label>
                  <Hint
                    position="right"
                    size="sm"
                    content={
                      <div className="space-y-1 text-xs">
                        <p><strong>Entire Document:</strong> Generate from all content</p>
                        <p><strong>Specific Chunks:</strong> Select specific chunks to use</p>
                        <p><strong>Specific Chapter:</strong> Target one chapter by title/number</p>
                        <p><strong>Specific Section:</strong> Target a specific section</p>
                      </div>
                    }
                  />
                </div>
                <Dropdown
                  value={quizConfig.quizScope}
                  onChange={(value) => setQuizConfig(prev => ({
                    ...prev,
                    quizScope: value as QuizScope
                  }))}
                  options={[
                    { label: 'Entire Document', value: 'ENTIRE_DOCUMENT' },
                    { label: 'Specific Chunks', value: 'SPECIFIC_CHUNKS' },
                    { label: 'Specific Chapter', value: 'SPECIFIC_CHAPTER' },
                    { label: 'Specific Section', value: 'SPECIFIC_SECTION' }
                  ]}
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                  Difficulty Level
                </label>
                <Dropdown
                  value={quizConfig.difficulty}
                  onChange={(value) => setQuizConfig(prev => ({
                    ...prev,
                    difficulty: value as Difficulty
                  }))}
                  options={[
                    { label: 'Easy', value: 'EASY' },
                    { label: 'Medium', value: 'MEDIUM' },
                    { label: 'Hard', value: 'HARD' }
                  ]}
                />
              </div>

              {/* Questions Per Type */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-theme-text-secondary">
                    Questions Per Type (per chunk) <span className="text-theme-interactive-danger">*</span>
                  </label>
                  <Hint
                    position="right"
                    size="sm"
                    content="Specify how many questions of each type to generate per document chunk. At least one type must have a value ≥ 1."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-theme-text-secondary mb-1">Single Choice</label>
                    <Input
                      type="number"
                      value={quizConfig.questionTypes.MCQ_SINGLE}
                      onChange={(e) => setQuizConfig(prev => ({
                        ...prev,
                        questionTypes: {
                          ...prev.questionTypes,
                          MCQ_SINGLE: parseInt(e.target.value) || 0
                        }
                      }))}
                      min="0"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-theme-text-secondary mb-1">Multiple Choice</label>
                    <Input
                      type="number"
                      value={quizConfig.questionTypes.MCQ_MULTI}
                      onChange={(e) => setQuizConfig(prev => ({
                        ...prev,
                        questionTypes: {
                          ...prev.questionTypes,
                          MCQ_MULTI: parseInt(e.target.value) || 0
                        }
                      }))}
                      min="0"
                      max="5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-theme-text-secondary mb-1">True/False</label>
                    <Input
                      type="number"
                      value={quizConfig.questionTypes.TRUE_FALSE}
                      onChange={(e) => setQuizConfig(prev => ({
                        ...prev,
                        questionTypes: {
                          ...prev.questionTypes,
                          TRUE_FALSE: parseInt(e.target.value) || 0
                        }
                      }))}
                      min="0"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-theme-text-secondary mb-1">Open Questions</label>
                    <Input
                      type="number"
                      value={quizConfig.questionTypes.OPEN}
                      onChange={(e) => setQuizConfig(prev => ({
                        ...prev,
                        questionTypes: {
                          ...prev.questionTypes,
                          OPEN: parseInt(e.target.value) || 0
                        }
                      }))}
                      min="0"
                      max="5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-theme-text-secondary mb-1">Fill in the Gap</label>
                    <Input
                      type="number"
                      value={quizConfig.questionTypes.FILL_GAP}
                      onChange={(e) => setQuizConfig(prev => ({
                        ...prev,
                        questionTypes: {
                          ...prev.questionTypes,
                          FILL_GAP: parseInt(e.target.value) || 0
                        }
                      }))}
                      min="0"
                      max="5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-theme-text-secondary mb-1">Ordering</label>
                    <Input
                      type="number"
                      value={quizConfig.questionTypes.ORDERING}
                      onChange={(e) => setQuizConfig(prev => ({
                        ...prev,
                        questionTypes: {
                          ...prev.questionTypes,
                          ORDERING: parseInt(e.target.value) || 0
                        }
                      }))}
                      min="0"
                      max="3"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-theme-text-secondary">
                  Select at least one question type with at least 1 question per type
                </p>
              </div>

              {/* Estimated Time Per Question */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-theme-text-secondary">
                    Estimated Time Per Question (minutes)
                  </label>
                  <Hint
                    position="right"
                    size="sm"
                    content="Average time a quiz taker should spend on each question. Used to calculate total quiz duration. Range: 1-10 minutes."
                  />
                </div>
                <Input
                  type="number"
                  value={quizConfig.estimatedTimePerQuestion}
                  onChange={(e) => setQuizConfig(prev => ({
                    ...prev,
                    estimatedTimePerQuestion: parseInt(e.target.value) || 2
                  }))}
                  min="1"
                  max="10"
                />
              </div>

              {/* Token Estimation */}
              {selectedFile && (
                <div className="mt-6">
                  <TokenEstimationDisplay 
                    estimation={tokenEstimation} 
                    showBreakdown={false}
                  />
                  <p className="text-xs text-theme-text-tertiary mt-2">
                    * Estimation is approximate based on file size. Actual usage may vary after document processing.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-6">
          <Alert type="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !isUploading && !activeGenerationJob && (
        <div className="mt-8 text-center">
          <Button
            variant="primary"
            onClick={handleUploadAndGenerate}
            disabled={!selectedFile}
            className="px-8 py-3 text-lg"
          >
            Upload Document & Start Quiz Generation
          </Button>
        </div>
      )}

      {/* Quiz Generation Progress */}
      {activeGenerationJob && (
        <div className="mt-8">
          <GenerationProgress
            jobId={activeGenerationJob}
            onGenerationComplete={(quizId) => {
              setActiveGenerationJob(null);
              // Navigate to the generated quiz
              navigate(`/quizzes/${quizId}`);
            }}
            onGenerationError={(error) => {
              setActiveGenerationJob(null);
              setError(error);
            }}
            onGenerationCancelled={() => {
              setActiveGenerationJob(null);
            }}
          />
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 p-4 bg-theme-bg-info border border-theme-border-info rounded-lg">
        <h3 className="text-sm font-medium text-theme-text-primary mb-2">Tips for Best Results:</h3>
        <ul className="text-sm text-theme-interactive-primary space-y-1">
          <li>• Use well-structured documents with clear headings for better chunking</li>
          <li>• Select question types that match your learning objectives</li>
          <li>• Consider document size - larger documents may take longer to process</li>
          <li>• You can monitor generation progress and cancel if needed</li>
          <li>• Generated quizzes will appear in your quiz list when complete</li>
        </ul>
      </div>
    </div>
  );
};
