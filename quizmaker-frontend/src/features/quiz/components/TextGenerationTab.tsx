// src/components/quiz/TextGenerationTab.tsx
// ---------------------------------------------------------------------------
// Text-based quiz generation tab
// Allows users to input plain text and generate quizzes using AI
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizService, api } from '@/services';
import { GenerateQuizFromTextRequest, QuizQuestionType, Difficulty, QuizScope } from '@/types';
import { GenerationProgress } from '@/features/ai';
import { Button, Alert } from '@/components';

export const TextGenerationTab: React.FC = () => {
  const navigate = useNavigate();
  const quizService = new QuizService(api);
  
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeGenerationJob, setActiveGenerationJob] = useState<string | null>(null);
  
  // Quiz generation configuration
  const [quizConfig, setQuizConfig] = useState({
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
    chunkingStrategy: 'CHAPTER_BASED' as 'CHAPTER_BASED' | 'SECTION_BASED' | 'SIZE_BASED' | 'PAGE_BASED',
    maxChunkSize: 50000,
    language: 'en'
  });

  const validateText = (text: string): string | null => {
    if (!text.trim()) {
      return 'Text content is required';
    }
    if (text.length < 10) {
      return 'Text content must be at least 10 characters long';
    }
    if (text.length > 300000) {
      return 'Text content must not exceed 300,000 characters';
    }
    return null;
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

  const handleGenerateQuiz = async () => {
    const textValidation = validateText(text);
    if (textValidation) {
      setError(textValidation);
      return;
    }
    
    const questionValidation = validateQuestionTypes();
    if (questionValidation) {
      setError(questionValidation);
      return;
    }
    
    setError(null);
    
    try {
      // Filter out question types with 0 questions
      const filteredQuestionTypes = Object.entries(quizConfig.questionTypes)
        .filter(([_, count]) => count > 0)
        .reduce((acc, [type, count]) => {
          acc[type as QuizQuestionType] = count;
          return acc;
        }, {} as Record<QuizQuestionType, number>);
      
      const requestData: GenerateQuizFromTextRequest = {
        text: text.trim(),
        questionsPerType: filteredQuestionTypes,
        difficulty: quizConfig.difficulty,
        language: quizConfig.language,
        chunkingStrategy: quizConfig.chunkingStrategy,
        maxChunkSize: quizConfig.maxChunkSize,
        quizScope: 'ENTIRE_DOCUMENT' as QuizScope,
        estimatedTimePerQuestion: quizConfig.estimatedTimePerQuestion
      };
      
      if (quizConfig.quizTitle) {
        requestData.quizTitle = quizConfig.quizTitle;
      }
      if (quizConfig.quizDescription) {
        requestData.quizDescription = quizConfig.quizDescription;
      }

      const response = await quizService.generateQuizFromText(requestData);
      
      setActiveGenerationJob(response.jobId);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Quiz generation failed';
      setError(errorMessage);
    }
  };

  const getChunkingStrategyDescription = (strategy: string): string => {
    switch (strategy) {
      case 'CHAPTER_BASED':
        return 'Split text by chapters for better topic organization';
      case 'SECTION_BASED':
        return 'Split text by sections for detailed content breakdown';
      case 'SIZE_BASED':
        return 'Split text by size limits for consistent chunk sizes';
      case 'PAGE_BASED':
        return 'Split text by page boundaries for page-based organization';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Text Input */}
        <div className="space-y-6">
          <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-6">
            <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Text Content</h3>
            
            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Enter your text content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type your text content here... (1-300,000 characters)"
                rows={12}
                className="w-full px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary resize-vertical"
              />
              <div className="mt-2 flex justify-between text-xs text-theme-text-tertiary">
                <span>Minimum: 10 characters</span>
                <span>{text.length}/300,000 characters</span>
              </div>
            </div>

            {/* Text Processing Configuration */}
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-theme-text-primary">Text Processing</h4>
              
              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                  Language
                </label>
                <select
                  value={quizConfig.language}
                  onChange={(e) => setQuizConfig(prev => ({
                    ...prev,
                    language: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>

              {/* Chunking Strategy */}
              <div>
                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                  Chunking Strategy
                </label>
                <select
                  value={quizConfig.chunkingStrategy}
                  onChange={(e) => setQuizConfig(prev => ({
                    ...prev,
                    chunkingStrategy: e.target.value as any
                  }))}
                  className="w-full px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
                >
                  <option value="CHAPTER_BASED">Chapter Based</option>
                  <option value="SECTION_BASED">Section Based</option>
                  <option value="SIZE_BASED">Size Based</option>
                  <option value="PAGE_BASED">Page Based</option>
                </select>
                <p className="mt-1 text-xs text-theme-text-secondary">
                  {getChunkingStrategyDescription(quizConfig.chunkingStrategy)}
                </p>
              </div>

              {/* Max Chunk Size */}
              <div>
                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
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
                  max="300000"
                  className="w-full px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
                />
                <p className="mt-1 text-xs text-theme-text-secondary">
                  Recommended: 30,000-50,000 characters for optimal quiz generation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Quiz Configuration */}
        <div className="space-y-6">
          <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-6">
            <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Quiz Configuration</h3>
            
            <div className="space-y-4">
              {/* Quiz Title */}
              <div>
                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={quizConfig.quizTitle}
                  onChange={(e) => setQuizConfig(prev => ({
                    ...prev,
                    quizTitle: e.target.value
                  }))}
                  placeholder="Enter quiz title (optional - AI will generate if empty)"
                  maxLength={100}
                  className="w-full px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
                />
              </div>

              {/* Quiz Description */}
              <div>
                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                  Quiz Description
                </label>
                <textarea
                  value={quizConfig.quizDescription}
                  onChange={(e) => setQuizConfig(prev => ({
                    ...prev,
                    quizDescription: e.target.value
                  }))}
                  placeholder="Enter quiz description (optional - AI will generate if empty)"
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                  Difficulty Level
                </label>
                <select
                  value={quizConfig.difficulty}
                  onChange={(e) => setQuizConfig(prev => ({
                    ...prev,
                    difficulty: e.target.value as Difficulty
                  }))}
                  className="w-full px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              {/* Questions Per Type */}
              <div>
                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                  Questions Per Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-theme-text-secondary mb-1">Multiple Choice (Single)</label>
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
                      className="w-full px-2 py-1 text-sm border border-theme-border-primary rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-theme-text-secondary mb-1">Multiple Choice (Multi)</label>
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
                      className="w-full px-2 py-1 text-sm border border-theme-border-primary rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-theme-text-secondary mb-1">True/False</label>
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
                      className="w-full px-2 py-1 text-sm border border-theme-border-primary rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-theme-text-secondary mb-1">Open Questions</label>
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
                      className="w-full px-2 py-1 text-sm border border-theme-border-primary rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-theme-text-secondary mb-1">Fill in the Gap</label>
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
                      className="w-full px-2 py-1 text-sm border border-theme-border-primary rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-theme-text-secondary mb-1">Ordering</label>
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
                      className="w-full px-2 py-1 text-sm border border-theme-border-primary rounded-md"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-theme-text-secondary">
                  Select at least one question type with at least 1 question per type
                </p>
              </div>

              {/* Estimated Time Per Question */}
              <div>
                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
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
                  className="w-full px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
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

      {/* Generate Button */}
      {!activeGenerationJob && (
        <div className="mt-8 text-center">
          <Button
            variant="primary"
            onClick={handleGenerateQuiz}
            disabled={!text.trim()}
            className="px-8 py-3 text-lg"
          >
            🚀 Generate Quiz from Text
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
        <h3 className="text-sm font-medium text-blue-900 mb-2">Tips for Best Results:</h3>
        <ul className="text-sm text-theme-interactive-primary space-y-1">
          <li>• Provide at least 500 characters of meaningful content for better results</li>
          <li>• Use well-structured text with clear topics and concepts</li>
          <li>• Select question types that match your learning objectives</li>
          <li>• Consider the difficulty level based on your audience</li>
          <li>• You can monitor generation progress and cancel if needed</li>
          <li>• Generated quizzes will appear in your quiz list when complete</li>
        </ul>
      </div>
    </div>
  );
};
