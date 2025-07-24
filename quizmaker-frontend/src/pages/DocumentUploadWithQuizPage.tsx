// src/pages/DocumentUploadWithQuizPage.tsx
// ---------------------------------------------------------------------------
// Combined document upload and quiz generation page
// Uses the new /api/v1/quizzes/generate-from-upload endpoint
// Allows users to upload a document and immediately start quiz generation
// ---------------------------------------------------------------------------

import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizService } from '../api/quiz.service';
import { QuizGenerationResponse, QuizQuestionType, Difficulty, QuizScope } from '../types/quiz.types';
import { GenerationProgress } from '../components/ai';
import { Button, Alert, Badge } from '../components/ui';
import { Breadcrumb, PageHeader } from '../components/layout';
import api from '../api/axiosInstance';

interface DocumentUploadWithQuizPageProps {
  className?: string;
}

const DocumentUploadWithQuizPage: React.FC<DocumentUploadWithQuizPageProps> = ({
  className = ''
}) => {
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
    difficulty: 'MEDIUM' as Difficulty,
    estimatedTimePerQuestion: 2,
    chunkingStrategy: 'CHAPTER_BASED',
    maxChunkSize: 50000
  });

  const validateFile = (file: File): string | null => {
    const maxFileSize = 150 * 1024 * 1024; // 150MB limit
    const supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds maximum allowed size of ${formatFileSize(maxFileSize)}`;
    }
    
    // Check file type
    if (!supportedTypes.includes(file.type)) {
      return `File type not supported. Supported types: PDF, DOCX, TXT`;
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
      
      if (quizConfig.quizTitle) {
        formData.append('quizTitle', quizConfig.quizTitle);
      }
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

  return (
    <div className={`max-w-6xl mx-auto py-8 px-4 ${className}`}>
      <PageHeader
        title="Upload Document & Generate Quiz"
        subtitle="Upload a document and immediately start quiz generation"
        actions={[
          {
            label: 'Back to Documents',
            variant: 'secondary',
            onClick: () => navigate('/documents')
          }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Left Column - File Upload */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Upload</h3>
            
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
                    <div className="text-xs text-gray-500">
                      Supported: PDF, DOCX, TXT • Max size: 150 MB
                    </div>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInputChange}
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
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

            {/* Document Processing Configuration */}
            {selectedFile && (
              <div className="mt-6 space-y-4">
                <h4 className="font-medium text-gray-900">Document Processing</h4>
                
                {/* Chunking Strategy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chunking Strategy
                  </label>
                  <select
                    value={quizConfig.chunkingStrategy}
                    onChange={(e) => setQuizConfig(prev => ({
                      ...prev,
                      chunkingStrategy: e.target.value
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
                    {getChunkingStrategyDescription(quizConfig.chunkingStrategy)}
                  </p>
                </div>

                {/* Max Chunk Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Chunk Size (characters)
                  </label>
                  <input
                    type="number"
                    value={quizConfig.maxChunkSize}
                    onChange={(e) => setQuizConfig(prev => ({
                      ...prev,
                      maxChunkSize: parseInt(e.target.value) || 50000
                    }))}
                    min="1000"
                    max="100000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-600">
                    Recommended: 30,000-50,000 characters for optimal quiz generation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quiz Configuration */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Configuration</h3>
            
            <div className="space-y-4">
              {/* Quiz Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quizConfig.quizTitle}
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
                  value={quizConfig.quizDescription}
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
                  value={quizConfig.quizScope}
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
                  value={quizConfig.difficulty}
                  onChange={(e) => setQuizConfig(prev => ({
                    ...prev,
                    difficulty: e.target.value as Difficulty
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
                  Questions Per Type (per chunk) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Multiple Choice (Single)</label>
                    <input
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
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Multiple Choice (Multi)</label>
                    <input
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
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">True/False</label>
                    <input
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
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Open Questions</label>
                    <input
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
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Fill in the Gap</label>
                    <input
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
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Ordering</label>
                    <input
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
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  Select at least one question type with at least 1 question per type
                </p>
              </div>

              {/* Estimated Time Per Question */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Time Per Question (minutes)
                </label>
                <input
                  type="number"
                  value={quizConfig.estimatedTimePerQuestion}
                  onChange={(e) => setQuizConfig(prev => ({
                    ...prev,
                    estimatedTimePerQuestion: parseInt(e.target.value) || 2
                  }))}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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
            disabled={!quizConfig.quizTitle?.trim()}
            className="px-8 py-3 text-lg"
          >
            🚀 Upload Document & Start Quiz Generation
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
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Tips for Best Results:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
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

export default DocumentUploadWithQuizPage; 