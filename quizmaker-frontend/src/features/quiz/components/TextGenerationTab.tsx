// src/components/quiz/TextGenerationTab.tsx
// ---------------------------------------------------------------------------
// Text-based quiz generation tab
// Allows users to input plain text and generate quizzes using AI
// ---------------------------------------------------------------------------

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizService, api, tokenEstimationService } from '@/services';
import { GenerateQuizFromTextRequest, QuizQuestionType, Difficulty, QuizScope, QuestionType } from '@/types';
import { GenerationProgress, TokenEstimationDisplay } from '@/features/ai';
import { Button, Alert, Input, Dropdown, Hint, Textarea } from '@/components';

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
    language: 'en'
  });

  const validateText = (text: string): string | null => {
    if (!text.trim()) {
      return 'Text content is required';
    }
    if (text.trim().length < 300) {
      const currentLength = text.trim().length;
      return `Text content must be at least 300 characters long (currently ${currentLength} characters, missing ${300 - currentLength} characters)`;
    }
    if (text.length > 100000) {
      return 'Text content must not exceed 100,000 characters';
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
        chunkingStrategy: 'SIZE_BASED',
        maxChunkSize: 100000,
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


  // Calculate token estimation
  const tokenEstimation = useMemo(() => {
    if (!text.trim() || text.trim().length < 300) {
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
      return tokenEstimationService.estimateFromText(
        text.trim(),
        filteredQuestionTypes,
        quizConfig.difficulty
      );
    } catch (error) {
      console.error('Token estimation error:', error);
      return null;
    }
  }, [text, quizConfig.questionTypes, quizConfig.difficulty]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Text Input */}
        <div className="space-y-6">
          <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
            <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Text Content</h3>
            
            {/* Text Input */}
            <Textarea
              label={
                <>
                  Enter your text content <span className="text-theme-interactive-danger">*</span>
                </>
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type your text content here... (300-100,000 characters)"
              rows={12}
              maxLength={100000}
              showCharCount
              helperText="Minimum: 10 characters"
            />

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
              <Textarea
                label="Quiz Description"
                value={quizConfig.quizDescription}
                onChange={(e) => setQuizConfig(prev => ({
                  ...prev,
                  quizDescription: e.target.value
                }))}
                placeholder="Enter quiz description (optional - AI will generate if empty)"
                rows={3}
                maxLength={500}
                showCharCount
              />

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

              {/* Token Estimation */}
              <div className="mt-6" data-testid="token-estimation-section">
                <h4 className="text-sm font-medium text-theme-text-secondary mb-3">Token Usage Estimation</h4>
                <TokenEstimationDisplay 
                  estimation={tokenEstimation} 
                  key="token-estimation"
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
