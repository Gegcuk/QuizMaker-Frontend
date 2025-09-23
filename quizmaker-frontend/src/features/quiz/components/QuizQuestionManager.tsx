// src/features/quiz/components/QuizQuestionManager.tsx
// ---------------------------------------------------------------------------
// Component for managing questions in a created quiz.
// This is step 3 of the quiz creation wizard.
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionDifficulty } from '@/types';
import { Button, useToast } from '@/components';
import { QuestionService } from '@/services';
import { api } from '@/services';
import QuizQuestionInline from './QuizQuestionInline';
import QuizPreview from './QuizPreview';

interface QuizQuestionManagerProps {
  quizId: string;
  quizTitle: string;
  defaultDifficulty: QuestionDifficulty;
  onComplete: () => void;
}

export const QuizQuestionManager: React.FC<QuizQuestionManagerProps> = ({
  quizId,
  quizTitle,
  defaultDifficulty,
  onComplete
}) => {
  const { addToast } = useToast();
  const questionService = new QuestionService(api);
  
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'questions' | 'preview'>('questions');

  // Load existing questions for this quiz
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await questionService.getQuestions({ quizId });
        const existingIds = response.content.map(q => q.id);
        setSelectedQuestionIds(existingIds);
      } catch (error) {
        console.warn('No existing questions found for quiz:', error);
        // This is normal for new quizzes
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [quizId]);

  const handleQuestionsChange = (questionIds: string[]) => {
    setSelectedQuestionIds(questionIds);
  };

  const handleComplete = () => {
    if (selectedQuestionIds.length === 0) {
      addToast({
        type: 'warning',
        message: 'Please add at least one question before completing the quiz creation.'
      });
      return;
    }

    addToast({
      type: 'success',
      message: `Quiz "${quizTitle}" created successfully with ${selectedQuestionIds.length} questions!`
    });
    
    onComplete();
  };

  const handleSaveDraft = () => {
    addToast({
      type: 'info',
      message: 'Quiz saved as draft. You can continue editing later.'
    });
    onComplete();
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-300 rounded w-1/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 bg-gray-300 rounded"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
          <div className="h-96 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Add Questions to "{quizTitle}"
        </h3>
        <p className="text-gray-600">
          Create or select questions for your quiz. You can preview your quiz anytime.
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setActiveView('questions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'questions'
                ? 'bg-theme-bg-primary text-theme-text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ❓ Questions ({selectedQuestionIds.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView('preview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'preview'
                ? 'bg-theme-bg-primary text-theme-text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👁️ Preview
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'questions' && (
        <div className="space-y-6">
          <QuizQuestionInline
            quizId={quizId}
            questionIds={selectedQuestionIds}
            onChange={handleQuestionsChange}
            defaultDifficulty={defaultDifficulty}
          />
          
          {/* Action buttons */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-gray-900">
                  {selectedQuestionIds.length > 0 ? 'Ready to Complete?' : 'Add Questions'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedQuestionIds.length > 0 
                    ? `${selectedQuestionIds.length} questions selected. Your quiz is ready!`
                    : 'Add at least one question to complete your quiz.'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Complete:</strong> Finish quiz creation and go to quiz list • <strong>Save Draft:</strong> Save for later editing
                </p>
              </div>
              <div className="ml-6 flex space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveDraft}
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleComplete}
                  disabled={selectedQuestionIds.length === 0}
                >
                  Complete Quiz Creation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'preview' && (
        <div className="space-y-6">
          <QuizPreview
            quizData={{
              id: quizId,
              title: quizTitle,
              description: '',
              visibility: 'PRIVATE',
              difficulty: defaultDifficulty,
              status: 'DRAFT',
              estimatedTime: 30,
              isRepetitionEnabled: false,
              timerEnabled: false,
              timerDuration: 30,
              tagIds: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              creatorId: '',
              categoryId: undefined
            }}
          />
          
          {/* Action buttons */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-gray-900">
                  Preview Complete
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Review your quiz above. Switch back to Questions to add more content.
                </p>
              </div>
              <div className="ml-6 flex space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setActiveView('questions')}
                >
                  Back to Questions
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleComplete}
                  disabled={selectedQuestionIds.length === 0}
                >
                  Complete Quiz Creation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};