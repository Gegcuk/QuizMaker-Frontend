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
import { Button, Alert, Input, Dropdown, Hint } from '@/components';

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
          <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
            <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Text Content</h3>
            
            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Enter your text content <span className="text-theme-interactive-danger">*</span>
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type your text content here... (1-300,000 characters)"
                rows={12}
                className="w-full px-3 py-2 border border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary resize-vertical bg-theme-bg-primary text-theme-text-primary sm:text-sm"
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
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-theme-text-secondary">
                    Language
                  </label>
                  <Hint
                    position="right"
                    size="sm"
                    content="Language for generated quiz content. AI will generate questions and answers in the selected language (ISO 639-1 code)."
                  />
                </div>
                <Dropdown
                  value={quizConfig.language}
                  onChange={(value) => setQuizConfig(prev => ({
                    ...prev,
                    language: typeof value === 'string' ? value : value[0]
                  }))}
                  options={[
                    { label: 'English', value: 'en' },
                    { label: 'Spanish', value: 'es' },
                    { label: 'French', value: 'fr' },
                    { label: 'German', value: 'de' },
                    { label: 'Italian', value: 'it' },
                    { label: 'Portuguese', value: 'pt' }
                  ]}
                />
              </div>

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
                        <p className="font-medium">How to split your text:</p>
                        <ul className="text-xs space-y-1">
                          <li><strong>Chapter:</strong> Splits by chapter headings</li>
                          <li><strong>Section:</strong> Splits by section headings</li>
                          <li><strong>Size:</strong> Splits by character count</li>
                          <li><strong>Page:</strong> Splits by page breaks</li>
                        </ul>
                      </div>
                    }
                  />
                </div>
                <Dropdown
                  value={quizConfig.chunkingStrategy}
                  onChange={(value) => setQuizConfig(prev => ({
                    ...prev,
                    chunkingStrategy: (typeof value === 'string' ? value : value[0]) as 'CHAPTER_BASED' | 'SECTION_BASED' | 'SIZE_BASED' | 'PAGE_BASED'
                  }))}
                  options={[
                    { label: 'Chapter Based', value: 'CHAPTER_BASED' },
                    { label: 'Section Based', value: 'SECTION_BASED' },
                    { label: 'Size Based', value: 'SIZE_BASED' },
                    { label: 'Page Based', value: 'PAGE_BASED' }
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
                    content="Maximum number of characters per chunk. Recommended: 30,000-50,000 for optimal quiz generation. Range: 1,000-300,000."
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
                  max="300000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Quiz Configuration */}
        <div className="space-y-6">
          <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
            <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Quiz Configuration</h3>
            
            <div className="space-y-4">
              {/* Quiz Title */}
              <div>
                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                  Quiz Title
                </label>
                <Input
                  type="text"
                  value={quizConfig.quizTitle}
                  onChange={(e) => setQuizConfig(prev => ({
                    ...prev,
                    quizTitle: e.target.value
                  }))}
                  placeholder="Enter quiz title (optional - AI will generate if empty)"
                  maxLength={100}
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
                  className="w-full px-3 py-2 border border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary sm:text-sm"
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
                    Questions Per Type <span className="text-theme-interactive-danger">*</span>
                  </label>
                  <Hint
                    position="right"
                    size="sm"
                    content="Specify how many questions of each type to generate. At least one type must have a value ≥ 1."
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
                          MCQ_SINGLE: Math.max(0, Math.min(parseInt(e.target.value) || 0, 10))
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
                          MCQ_MULTI: Math.max(0, Math.min(parseInt(e.target.value) || 0, 5))
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
                          TRUE_FALSE: Math.max(0, Math.min(parseInt(e.target.value) || 0, 10))
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
                          OPEN: Math.max(0, Math.min(parseInt(e.target.value) || 0, 5))
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
                          FILL_GAP: Math.max(0, Math.min(parseInt(e.target.value) || 0, 5))
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
                          ORDERING: Math.max(0, Math.min(parseInt(e.target.value) || 0, 3))
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
        <h3 className="text-sm font-medium text-theme-text-primary mb-2">Tips for Best Results:</h3>
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
