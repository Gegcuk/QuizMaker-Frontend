// src/features/document/components/DocumentUpload.tsx
// ---------------------------------------------------------------------------
// Component for uploading documents with drag-and-drop support
// Handles file validation, progress tracking, and upload configuration
// Includes quiz generation functionality
// ---------------------------------------------------------------------------

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowUpTrayIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { DocumentService } from '@/services';
import { QuizService, api } from '@/services';
import { DocumentDto, DocumentConfigDto, ChunkingStrategy, GenerateQuizFromDocumentRequest, QuizGenerationResponse, QuizScope } from '@/types';
import { Button, Modal, Alert, Badge, Input, Dropdown, Card, Hint } from '@/components';
import { GenerationProgress } from '../../ai';

interface DocumentUploadProps {
  onUploadSuccess?: (document: DocumentDto) => void;
  onUploadError?: (error: string) => void;
  onQuizGenerationStarted?: (response: QuizGenerationResponse) => void;
  className?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  onQuizGenerationStarted,
  className = ''
}) => {
  const location = useLocation();
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [config, setConfig] = useState<DocumentConfigDto | null>(null);
  const [uploadConfig, setUploadConfig] = useState({
    chunkingStrategy: 'AUTO' as ChunkingStrategy,
    maxChunkSize: 1000
  });
  const [error, setError] = useState<string | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<DocumentDto | null>(null);
  const [showQuizGenerationModal, setShowQuizGenerationModal] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeGenerationJob, setActiveGenerationJob] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentService = new DocumentService(api);
  const quizService = new QuizService(api);

  // Cleanup: Reset modal and error states on route change
  useEffect(() => {
    return () => {
      setShowQuizGenerationModal(false);
      setGenerationError(null);
      setError(null);
    };
  }, [location.pathname]);

  // Quiz generation configuration
  const [quizConfig, setQuizConfig] = useState<Partial<GenerateQuizFromDocumentRequest>>({
    quizScope: 'ENTIRE_DOCUMENT',
    quizTitle: '',
    quizDescription: '',
    questionsPerType: {
      MCQ_SINGLE: 3,
      MCQ_MULTI: 1,
      TRUE_FALSE: 2,
      OPEN: 1,
      FILL_GAP: 1,
      COMPLIANCE: 0,
      ORDERING: 0,
      HOTSPOT: 0
    },
    difficulty: 'MEDIUM',
    estimatedTimePerQuestion: 2
  });

  // Load document configuration on component mount
  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await documentService.getDocumentConfig();
        setConfig(config);
        setUploadConfig(prev => ({
          ...prev,
          chunkingStrategy: config.defaultStrategy as ChunkingStrategy,
          maxChunkSize: config.defaultMaxChunkSize
        }));
      } catch (err) {
        console.error('Failed to load document config:', err);
      }
    };
    loadConfig();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = useCallback((file: File): string | null => {
    if (!config) return 'Configuration not loaded';
    
    // For now, we'll use reasonable defaults since the new config doesn't include these
    const maxFileSize = 130 * 1024 * 1024; // 130MB limit
    const supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf'];
    
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds maximum allowed size of ${formatFileSize(maxFileSize)}`;
    }
    
    // Check file type
    if (!supportedTypes.includes(file.type)) {
      return `File type not supported. Supported types: ${supportedTypes.join(', ')}`;
    }
    
    return null;
  }, [config]);

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setSelectedFile(file);
    // Auto-generate quiz title from filename
    const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    setQuizConfig(prev => ({
      ...prev,
      quizTitle: `${fileName} Quiz`,
      quizDescription: `Quiz generated from ${fileName} document`
    }));
  }, [validateFile]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      const document = await documentService.uploadDocument({
        file: selectedFile,
        chunkingStrategy: uploadConfig.chunkingStrategy,
        maxChunkSize: uploadConfig.maxChunkSize
      });
      
      setUploadProgress(100);
      setSelectedFile(null);
      setUploadedDocument(document);
      onUploadSuccess?.(document);
      
      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Upload failed';
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!uploadedDocument) return;
    
    setIsGeneratingQuiz(true);
    setGenerationError(null);
    
    try {
      const generationRequest: GenerateQuizFromDocumentRequest = {
        documentId: uploadedDocument.id,
        quizScope: quizConfig.quizScope || 'ENTIRE_DOCUMENT',
        quizTitle: quizConfig.quizTitle || `${uploadedDocument.title} Quiz`,
        quizDescription: quizConfig.quizDescription || `Quiz generated from ${uploadedDocument.title}`,
        questionsPerType: quizConfig.questionsPerType || {
          MCQ_SINGLE: 3,
          MCQ_MULTI: 1,
          TRUE_FALSE: 2,
          OPEN: 1,
          FILL_GAP: 1,
          COMPLIANCE: 0,
          ORDERING: 0,
          HOTSPOT: 0
        },
        difficulty: quizConfig.difficulty || 'MEDIUM',
        estimatedTimePerQuestion: quizConfig.estimatedTimePerQuestion || 2
      };
      
      const response = await quizService.generateQuizFromDocument(generationRequest);
      
      setShowQuizGenerationModal(false);
      setActiveGenerationJob(response.jobId);
      onQuizGenerationStarted?.(response);
      
      // Show success message
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start quiz generation';
      setGenerationError(errorMessage);
    } finally {
      setIsGeneratingQuiz(false);
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
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const getChunkingStrategyDescription = (strategy: ChunkingStrategy): string => {
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

  return (
    <Card className={className}>
      {/* File Upload Area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-theme-text-secondary mb-2">
          Upload Document
        </label>
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
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            accept=".pdf,.docx,.txt,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/rtf"
            className="hidden"
            id="document-file-upload"
          />
          
          {selectedFile ? (
            <div className="space-y-3">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-theme-interactive-success" />
              <div>
                <div className="text-sm font-medium text-theme-text-primary">{selectedFile.name}</div>
                <div className="text-xs text-theme-text-secondary mt-1">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="text-theme-interactive-danger hover:text-theme-interactive-danger"
              >
                Remove file
              </Button>
            </div>
          ) : (
            <label htmlFor="document-file-upload" className="cursor-pointer block">
              <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-4">
                <p className="text-sm text-theme-text-secondary">
                  <span className="font-medium text-theme-interactive-primary hover:text-theme-interactive-primary">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </p>
                <p className="text-xs text-theme-text-tertiary mt-1">
                  PDF, DOCX, TXT, RTF up to 130 MB
                </p>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Upload Configuration */}
      {selectedFile && config && (
        <div className="mt-6 p-4 bg-theme-bg-secondary rounded-lg">
          <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Upload Configuration</h3>
          
          <div className="space-y-4">
            {/* Chunking Strategy */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Chunking Strategy
              </label>
              <Dropdown
                options={[
                  { value: 'AUTO', label: 'Auto - Best Strategy' },
                  { value: 'CHAPTER_BASED', label: 'Chapter Based' },
                  { value: 'SECTION_BASED', label: 'Section Based' },
                  { value: 'SIZE_BASED', label: 'Size Based' },
                  { value: 'PAGE_BASED', label: 'Page Based' }
                ]}
                value={uploadConfig.chunkingStrategy}
                onChange={(value) => setUploadConfig(prev => ({
                  ...prev,
                  chunkingStrategy: value as ChunkingStrategy
                }))}
                size="md"
                fullWidth
              />
              <p className="mt-1 text-xs text-theme-text-secondary">
                {getChunkingStrategyDescription(uploadConfig.chunkingStrategy)}
              </p>
            </div>

            {/* Max Chunk Size */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Maximum Chunk Size (characters)
              </label>
              <Input
                type="number"
                value={uploadConfig.maxChunkSize.toString()}
                onChange={(e) => setUploadConfig(prev => ({
                  ...prev,
                  maxChunkSize: parseInt(e.target.value) || 1000
                }))}
                min={100}
                max={10000}
              />
              <p className="mt-1 text-xs text-theme-text-secondary">
                Recommended: 500-2000 characters for optimal quiz generation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-theme-text-secondary mb-2">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
            <div
              className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-theme-bg-danger border border-theme-border-danger rounded-lg">
          <div className="flex items-center space-x-2">
            <ExclamationCircleIcon className="h-5 w-5 text-theme-interactive-danger flex-shrink-0" />
            <span className="text-theme-interactive-danger">{error}</span>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !isUploading && (
        <div className="mt-6">
          <Button
            type="button"
            variant="success"
            size="lg"
            fullWidth
            onClick={handleUpload}
            leftIcon={<ArrowUpTrayIcon className="h-5 w-5" />}
          >
            Upload Document
          </Button>
        </div>
      )}

      {/* Upload Tips */}
      <div className="mt-6 p-4 bg-theme-bg-info border border-theme-border-info rounded-lg">
        <div className="flex items-start space-x-2">
          <DocumentArrowUpIcon className="h-5 w-5 text-theme-interactive-info flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-theme-text-primary mb-2">Upload Tips:</h3>
            <ul className="text-sm text-theme-interactive-primary space-y-1">
              <li>• Supported formats: PDF, DOCX, TXT, RTF</li>
              <li>• Maximum file size: 130 MB</li>
              <li>• Documents are processed automatically after upload</li>
              <li>• Processing time depends on document size and complexity</li>
              <li>• You can configure chunking strategy for better quiz generation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quiz Generation Section */}
      {uploadedDocument && (
        <div className="mt-6 p-4 bg-theme-bg-success border border-theme-border-success rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-6 w-6 text-theme-interactive-success flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-theme-text-primary">Document Uploaded Successfully!</h3>
                <p className="text-sm text-theme-interactive-success">
                  "{uploadedDocument.title || uploadedDocument.originalFilename}" is ready for quiz generation
                </p>
              </div>
            </div>
            <Badge variant="success">Processed</Badge>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm text-theme-interactive-success">
              <p><strong>Document Details:</strong></p>
              <p>• Size: {formatFileSize(uploadedDocument.fileSize || 0)}</p>
              <p>• Pages: {uploadedDocument.totalPages}</p>
              <p>• Chunks: {uploadedDocument.totalChunks}</p>
              <p>• Status: {uploadedDocument.status}</p>
            </div>
            
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setShowQuizGenerationModal(true)}
              leftIcon={<SparklesIcon className="h-5 w-5" />}
            >
              Generate Quiz from Document
            </Button>
          </div>
        </div>
      )}

      {/* Quiz Generation Progress */}
      {activeGenerationJob && (
        <div className="mt-6">
          <GenerationProgress
            jobId={activeGenerationJob}
            onGenerationComplete={(quizId) => {
              setActiveGenerationJob(null);
              // You can navigate to the quiz or show a success message
              console.log('Quiz generation completed! Quiz ID:', quizId);
            }}
            onGenerationError={(error) => {
              setActiveGenerationJob(null);
              setGenerationError(error);
            }}
            onGenerationCancelled={() => {
              setActiveGenerationJob(null);
            }}
          />
        </div>
      )}

      {/* Quiz Generation Modal */}
      <Modal
        isOpen={showQuizGenerationModal}
        onClose={() => setShowQuizGenerationModal(false)}
        title="Generate Quiz from Document"
      >
        <div className="space-y-6">
          {generationError && (
            <Alert type="error" onDismiss={() => setGenerationError(null)}>
              {generationError}
            </Alert>
          )}

          <div className="space-y-4">
            {/* Quiz Title */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Quiz Title <span className="text-theme-interactive-danger">*</span>
              </label>
              <Input
                type="text"
                value={quizConfig.quizTitle || ''}
                onChange={(e) => setQuizConfig(prev => ({
                  ...prev,
                  quizTitle: e.target.value
                }))}
                placeholder="Enter quiz title..."
              />
            </div>

            {/* Quiz Description */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Quiz Description
              </label>
              <Input
                type="textarea"
                value={quizConfig.quizDescription || ''}
                onChange={(e) => setQuizConfig(prev => ({
                  ...prev,
                  quizDescription: e.target.value
                }))}
                placeholder="Enter quiz description..."
              />
            </div>

            {/* Quiz Scope */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Quiz Scope
              </label>
              <Dropdown
                options={[
                  { value: 'ENTIRE_DOCUMENT', label: 'Entire Document' },
                  { value: 'SPECIFIC_CHUNKS', label: 'Specific Chunks' },
                  { value: 'SPECIFIC_CHAPTER', label: 'Specific Chapter' },
                  { value: 'SPECIFIC_SECTION', label: 'Specific Section' }
                ]}
                value={quizConfig.quizScope || 'ENTIRE_DOCUMENT'}
                onChange={(value) => setQuizConfig(prev => ({
                  ...prev,
                  quizScope: value as QuizScope
                }))}
                size="md"
                fullWidth
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Difficulty Level
              </label>
              <Dropdown
                options={[
                  { value: 'EASY', label: 'Easy' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HARD', label: 'Hard' }
                ]}
                value={quizConfig.difficulty || 'MEDIUM'}
                onChange={(value) => setQuizConfig(prev => ({
                  ...prev,
                  difficulty: value as any
                }))}
                size="md"
                fullWidth
              />
            </div>

            {/* Questions Per Type */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <label className="block text-sm font-medium text-theme-text-secondary">
                  Questions Per Type (per chunk)
                </label>
                <Hint
                  position="bottom"
                  size="sm"
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Specify how many questions of each type to generate per document chunk.</p>
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-theme-text-secondary mb-1">Multiple Choice</label>
                  <Input
                    type="number"
                    value={(quizConfig.questionsPerType?.MCQ_SINGLE || 3).toString()}
                    onChange={(e) => setQuizConfig(prev => ({
                      ...prev,
                      questionsPerType: {
                        MCQ_SINGLE: parseInt(e.target.value) || 0,
                        MCQ_MULTI: prev.questionsPerType?.MCQ_MULTI || 1,
                        TRUE_FALSE: prev.questionsPerType?.TRUE_FALSE || 2,
                        OPEN: prev.questionsPerType?.OPEN || 1,
                        FILL_GAP: prev.questionsPerType?.FILL_GAP || 1,
                        COMPLIANCE: prev.questionsPerType?.COMPLIANCE || 0,
                        ORDERING: prev.questionsPerType?.ORDERING || 0,
                        HOTSPOT: prev.questionsPerType?.HOTSPOT || 0
                      }
                    }))}
                    min={0}
                    max={10}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-theme-text-secondary mb-1">True/False</label>
                  <Input
                    type="number"
                    value={(quizConfig.questionsPerType?.TRUE_FALSE || 2).toString()}
                    onChange={(e) => setQuizConfig(prev => ({
                      ...prev,
                      questionsPerType: {
                        MCQ_SINGLE: prev.questionsPerType?.MCQ_SINGLE || 3,
                        MCQ_MULTI: prev.questionsPerType?.MCQ_MULTI || 1,
                        TRUE_FALSE: parseInt(e.target.value) || 0,
                        OPEN: prev.questionsPerType?.OPEN || 1,
                        FILL_GAP: prev.questionsPerType?.FILL_GAP || 1,
                        COMPLIANCE: prev.questionsPerType?.COMPLIANCE || 0,
                        ORDERING: prev.questionsPerType?.ORDERING || 0,
                        HOTSPOT: prev.questionsPerType?.HOTSPOT || 0
                      }
                    }))}
                    min={0}
                    max={10}
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-theme-text-secondary mb-1">Open Questions</label>
                  <Input
                    type="number"
                    value={(quizConfig.questionsPerType?.OPEN || 1).toString()}
                    onChange={(e) => setQuizConfig(prev => ({
                      ...prev,
                      questionsPerType: {
                        MCQ_SINGLE: prev.questionsPerType?.MCQ_SINGLE || 3,
                        MCQ_MULTI: prev.questionsPerType?.MCQ_MULTI || 1,
                        TRUE_FALSE: prev.questionsPerType?.TRUE_FALSE || 2,
                        OPEN: parseInt(e.target.value) || 0,
                        FILL_GAP: prev.questionsPerType?.FILL_GAP || 1,
                        COMPLIANCE: prev.questionsPerType?.COMPLIANCE || 0,
                        ORDERING: prev.questionsPerType?.ORDERING || 0,
                        HOTSPOT: prev.questionsPerType?.HOTSPOT || 0
                      }
                    }))}
                    min={0}
                    max={5}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* Estimated Time Per Question */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Estimated Time Per Question (minutes)
              </label>
              <Input
                type="number"
                value={(quizConfig.estimatedTimePerQuestion || 2).toString()}
                onChange={(e) => setQuizConfig(prev => ({
                  ...prev,
                  estimatedTimePerQuestion: parseInt(e.target.value) || 1
                }))}
                min={1}
                max={10}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowQuizGenerationModal(false)}
              disabled={isGeneratingQuiz}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerateQuiz}
              loading={isGeneratingQuiz}
              disabled={!quizConfig.quizTitle?.trim()}
            >
              {isGeneratingQuiz ? 'Starting Generation...' : 'Start Quiz Generation'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default DocumentUpload; 
