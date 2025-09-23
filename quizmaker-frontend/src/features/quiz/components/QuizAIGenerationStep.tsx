// src/features/quiz/components/QuizAIGenerationStep.tsx
// ---------------------------------------------------------------------------
// Component for handling AI generation of questions after quiz creation.
// This is used in the wizard flow for text and document-based creation.
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizService, api } from '@/services';
import { GenerateQuizFromTextRequest, Difficulty, QuizScope } from '@/types';
import { Button, Input, useToast } from '@/components';
import { CreationMethod } from './QuizCreationWizard';

interface QuizAIGenerationStepProps {
  quizId: string;
  quizTitle: string;
  creationMethod: CreationMethod;
  onComplete: () => void;
}

export const QuizAIGenerationStep: React.FC<QuizAIGenerationStepProps> = ({
  quizId,
  quizTitle,
  creationMethod,
  onComplete
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const quizService = new QuizService(api);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationJobId, setGenerationJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Text generation state
  const [textContent, setTextContent] = useState('');
  
  // Generation configuration
  const [config, setConfig] = useState({
    questionsPerType: {
      MCQ_SINGLE: 3,
      MCQ_MULTI: 1,
      TRUE_FALSE: 2,
      OPEN: 1,
      FILL_GAP: 1,
      COMPLIANCE: 0,
      ORDERING: 0,
      HOTSPOT: 0,
      MATCHING: 0
    },
    difficulty: 'MEDIUM' as Difficulty,
    estimatedTimePerQuestion: 2,
    language: 'en'
  });

  const handleTextGeneration = async () => {
    if (!textContent.trim()) {
      setError('Please enter text content');
      return;
    }

    if (textContent.length < 50) {
      setError('Text content must be at least 50 characters long');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const request: GenerateQuizFromTextRequest = {
        text: textContent,
        language: config.language,
        quizTitle: quizTitle,
        quizDescription: `Generated from text content`,
        questionsPerType: config.questionsPerType,
        difficulty: config.difficulty,
        estimatedTimePerQuestion: config.estimatedTimePerQuestion,
        categoryId: undefined,
        tagIds: []
      };

      const response = await quizService.generateQuizFromText(request);
      setGenerationJobId(response.jobId);
      
      addToast({
        type: 'success',
        message: 'Quiz generation started! This may take a few minutes.'
      });

      // For now, we'll simulate completion after a delay
      // In a real implementation, you'd poll the job status
      setTimeout(() => {
        setIsGenerating(false);
        addToast({
          type: 'success',
          message: 'Quiz generation completed! Questions have been added to your quiz.'
        });
        onComplete();
      }, 3000);

    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to generate quiz from text');
      setIsGenerating(false);
    }
  };

  const handleDocumentGeneration = async () => {
    // This would integrate with document upload and generation
    addToast({
      type: 'info',
      message: 'Document generation feature will be implemented in the next step.'
    });
    onComplete();
  };

  const renderTextGenerationForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-2">
          Generate Questions from Text
        </h3>
        <p className="text-theme-text-secondary">
          Paste your text content below and AI will generate relevant questions.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-theme-text-secondary mb-2">
            Text Content *
          </label>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Paste your text content here... (minimum 50 characters)"
            rows={10}
            className="w-full px-3 py-2 border border-theme-border-primary rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
          />
          <div className="text-xs text-theme-text-tertiary mt-1">
            {textContent.length} characters (minimum 50)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-text-secondary mb-2">
              Difficulty
            </label>
            <select
              value={config.difficulty}
              onChange={(e) => setConfig(prev => ({ ...prev, difficulty: e.target.value as Difficulty }))}
              className="w-full px-3 py-2 border border-theme-border-primary rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text-secondary mb-2">
              Time per Question (minutes)
            </label>
            <Input
              type="number"
              value={config.estimatedTimePerQuestion}
              onChange={(e) => setConfig(prev => ({ ...prev, estimatedTimePerQuestion: parseInt(e.target.value) || 2 }))}
              min={1}
              max={10}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-text-secondary mb-2">
            Question Types & Counts
          </label>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(config.questionsPerType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-theme-text-secondary">{type.replace('_', ' ')}</span>
                <Input
                  type="number"
                  value={count}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    questionsPerType: {
                      ...prev.questionsPerType,
                      [type]: parseInt(e.target.value) || 0
                    }
                  }))}
                  min={0}
                  max={10}
                  className="w-20"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="primary"
          onClick={handleTextGeneration}
          loading={isGenerating}
          disabled={isGenerating || textContent.length < 50}
        >
          {isGenerating ? 'Generating Questions...' : 'Generate Questions from Text'}
        </Button>
      </div>
    </div>
  );

  const renderDocumentGenerationForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-2">
          Generate Questions from Document
        </h3>
        <p className="text-theme-text-secondary">
          Upload a document and AI will analyze it to generate relevant questions.
        </p>
      </div>

      <div className="border-2 border-dashed border-theme-border-primary rounded-lg p-8 text-center">
        <div className="space-y-4">
          <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-sm text-theme-text-secondary">
              <span className="font-medium text-theme-interactive-primary hover:text-blue-500 cursor-pointer">
                Click to upload
              </span>
              {' '}or drag and drop
            </p>
            <p className="text-xs text-theme-text-tertiary">PDF, DOC, DOCX up to 10MB</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="primary"
          onClick={handleDocumentGeneration}
        >
          Continue to Document Upload
        </Button>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-theme-bg-danger border border-red-200 rounded-md p-4">
          <p className="text-theme-interactive-danger">{error}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setError(null);
            setIsGenerating(false);
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {creationMethod === 'text' && renderTextGenerationForm()}
      {creationMethod === 'document' && renderDocumentGenerationForm()}
    </div>
  );
};
