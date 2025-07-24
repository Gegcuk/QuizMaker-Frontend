// src/components/document/DocumentUpload.tsx
// ---------------------------------------------------------------------------
// Component for uploading documents with drag-and-drop support
// Handles file validation, progress tracking, and upload configuration
// Includes quiz generation functionality
// ---------------------------------------------------------------------------

import React, { useState, useCallback, useRef } from 'react';
import { DocumentService } from '../../api/document.service';
import { QuizService } from '../../api/quiz.service';
import { DocumentDto, DocumentConfig, ChunkingStrategy } from '../../types/document.types';
import { GenerateQuizFromDocumentRequest, QuizGenerationResponse } from '../../types/quiz.types';
import api from '../../api/axiosInstance';
import { Button, Modal, Alert, Badge } from '../ui';
import { GenerationProgress } from '../ai';

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
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [config, setConfig] = useState<DocumentConfig | null>(null);
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

  // Quiz generation configuration
  const [quizConfig, setQuizConfig] = useState<Partial<GenerateQuizFromDocumentRequest>>({
    quizScope: 'ENTIRE_DOCUMENT',
    quizTitle: '',
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

  const validateFile = (file: File): string | null => {
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
    // Auto-generate quiz title from filename
    const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    setQuizConfig(prev => ({
      ...prev,
      quizTitle: `${fileName} Quiz`,
      quizDescription: `Quiz generated from ${fileName} document`
    }));
  };

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
        questionTypes: quizConfig.questionTypes || {
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
  }, []);

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
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Document</h2>
        <p className="text-gray-600">Upload a document to generate quiz questions</p>
      </div>

      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-6xl text-gray-400">📄</div>
          
          {selectedFile ? (
            <div className="space-y-2">
              <div className="text-lg font-medium text-gray-900">{selectedFile.name}</div>
              <div className="text-sm text-gray-600">
                {formatFileSize(selectedFile.size)} • {selectedFile.type}
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-lg font-medium text-gray-900">
                Drag and drop your document here
              </div>
              <div className="text-sm text-gray-600">
                or click to browse files
              </div>
              {config && (
                <div className="text-xs text-gray-500">
                  Supported: PDF, DOCX, TXT, RTF • 
                  Max size: 130 MB
                </div>
              )}
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            accept=".pdf,.docx,.txt,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/rtf"
            className="hidden"
          />
          
          {!selectedFile && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Choose File
            </button>
          )}
        </div>
      </div>

      {/* Upload Configuration */}
      {selectedFile && config && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Configuration</h3>
          
          <div className="space-y-4">
            {/* Chunking Strategy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chunking Strategy
              </label>
              <select
                value={uploadConfig.chunkingStrategy}
                onChange={(e) => setUploadConfig(prev => ({
                  ...prev,
                  chunkingStrategy: e.target.value as ChunkingStrategy
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="AUTO">Auto - Best Strategy</option>
                <option value="CHAPTER_BASED">Chapter Based</option>
                <option value="SECTION_BASED">Section Based</option>
                <option value="SIZE_BASED">Size Based</option>
                <option value="PAGE_BASED">Page Based</option>
              </select>
              <p className="mt-1 text-xs text-gray-600">
                {getChunkingStrategyDescription(uploadConfig.chunkingStrategy)}
              </p>
            </div>

            {/* Max Chunk Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Chunk Size (characters)
              </label>
              <input
                type="number"
                value={uploadConfig.maxChunkSize}
                onChange={(e) => setUploadConfig(prev => ({
                  ...prev,
                  maxChunkSize: parseInt(e.target.value) || 1000
                }))}
                min="100"
                max="10000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-600">
                Recommended: 500-2000 characters for optimal quiz generation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">❌</span>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !isUploading && (
        <div className="mt-6">
          <button
            onClick={handleUpload}
            className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            📤 Upload Document
          </button>
        </div>
      )}

      {/* Upload Tips */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Upload Tips:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Supported formats: PDF, DOCX, TXT, RTF</li>
          <li>• Maximum file size: 130 MB</li>
          <li>• Documents are processed automatically after upload</li>
          <li>• Processing time depends on document size and complexity</li>
          <li>• You can configure chunking strategy for better quiz generation</li>
        </ul>
      </div>

      {/* Quiz Generation Section */}
      {uploadedDocument && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Document Uploaded Successfully!</h3>
              <p className="text-sm text-green-700">
                "{uploadedDocument.title || uploadedDocument.originalFilename}" is ready for quiz generation
              </p>
            </div>
            <Badge variant="success">✓ Processed</Badge>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm text-green-700">
              <p><strong>Document Details:</strong></p>
              <p>• Size: {formatFileSize(uploadedDocument.fileSize)}</p>
              <p>• Pages: {uploadedDocument.totalPages}</p>
              <p>• Chunks: {uploadedDocument.totalChunks}</p>
              <p>• Status: {uploadedDocument.status}</p>
            </div>
            
            <button
              onClick={() => setShowQuizGenerationModal(true)}
              className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              🎯 Generate Quiz from Document
            </button>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={quizConfig.quizTitle || ''}
                onChange={(e) => setQuizConfig(prev => ({
                  ...prev,
                  quizTitle: e.target.value
                }))}
                placeholder="Enter quiz title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Quiz Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Description
              </label>
              <textarea
                value={quizConfig.quizDescription || ''}
                onChange={(e) => setQuizConfig(prev => ({
                  ...prev,
                  quizDescription: e.target.value
                }))}
                placeholder="Enter quiz description..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Quiz Scope */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Scope
              </label>
              <select
                value={quizConfig.quizScope || 'ENTIRE_DOCUMENT'}
                onChange={(e) => setQuizConfig(prev => ({
                  ...prev,
                  quizScope: e.target.value as QuizScope
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ENTIRE_DOCUMENT">Entire Document</option>
                <option value="SPECIFIC_CHUNKS">Specific Chunks</option>
                <option value="SPECIFIC_CHAPTER">Specific Chapter</option>
                <option value="SPECIFIC_SECTION">Specific Section</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={quizConfig.difficulty || 'MEDIUM'}
                onChange={(e) => setQuizConfig(prev => ({
                  ...prev,
                  difficulty: e.target.value as any
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            {/* Questions Per Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Questions Per Type (per chunk)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Multiple Choice</label>
                  <input
                    type="number"
                    value={quizConfig.questionTypes?.MCQ_SINGLE || 3}
                    onChange={(e) => setQuizConfig(prev => ({
                      ...prev,
                      questionTypes: {
                        MCQ_SINGLE: parseInt(e.target.value) || 0,
                        MCQ_MULTI: prev.questionTypes?.MCQ_MULTI || 1,
                        TRUE_FALSE: prev.questionTypes?.TRUE_FALSE || 2,
                        OPEN: prev.questionTypes?.OPEN || 1,
                        FILL_GAP: prev.questionTypes?.FILL_GAP || 1,
                        COMPLIANCE: prev.questionTypes?.COMPLIANCE || 0,
                        ORDERING: prev.questionTypes?.ORDERING || 0,
                        HOTSPOT: prev.questionTypes?.HOTSPOT || 0
                      }
                    }))}
                    min="0"
                    max="10"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">True/False</label>
                  <input
                    type="number"
                    value={quizConfig.questionTypes?.TRUE_FALSE || 2}
                    onChange={(e) => setQuizConfig(prev => ({
                      ...prev,
                      questionTypes: {
                        MCQ_SINGLE: prev.questionTypes?.MCQ_SINGLE || 3,
                        MCQ_MULTI: prev.questionTypes?.MCQ_MULTI || 1,
                        TRUE_FALSE: parseInt(e.target.value) || 0,
                        OPEN: prev.questionTypes?.OPEN || 1,
                        FILL_GAP: prev.questionTypes?.FILL_GAP || 1,
                        COMPLIANCE: prev.questionTypes?.COMPLIANCE || 0,
                        ORDERING: prev.questionTypes?.ORDERING || 0,
                        HOTSPOT: prev.questionTypes?.HOTSPOT || 0
                      }
                    }))}
                    min="0"
                    max="10"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Open Questions</label>
                  <input
                    type="number"
                    value={quizConfig.questionTypes?.OPEN || 1}
                    onChange={(e) => setQuizConfig(prev => ({
                      ...prev,
                      questionTypes: {
                        MCQ_SINGLE: prev.questionTypes?.MCQ_SINGLE || 3,
                        MCQ_MULTI: prev.questionTypes?.MCQ_MULTI || 1,
                        TRUE_FALSE: prev.questionTypes?.TRUE_FALSE || 2,
                        OPEN: parseInt(e.target.value) || 0,
                        FILL_GAP: prev.questionTypes?.FILL_GAP || 1,
                        COMPLIANCE: prev.questionTypes?.COMPLIANCE || 0,
                        ORDERING: prev.questionTypes?.ORDERING || 0,
                        HOTSPOT: prev.questionTypes?.HOTSPOT || 0
                      }
                    }))}
                    min="0"
                    max="5"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Estimated Time Per Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Time Per Question (minutes)
              </label>
              <input
                type="number"
                value={quizConfig.estimatedTimePerQuestion || 2}
                onChange={(e) => setQuizConfig(prev => ({
                  ...prev,
                  estimatedTimePerQuestion: parseInt(e.target.value) || 1
                }))}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
    </div>
  );
};

export default DocumentUpload; 