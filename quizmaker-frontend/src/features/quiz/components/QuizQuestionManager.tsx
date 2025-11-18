// src/features/quiz/components/QuizQuestionManager.tsx
// ---------------------------------------------------------------------------
// Component for managing questions in a created quiz.
// This is step 3 of the quiz creation wizard.
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionDifficulty } from '@/types';
import { Button, useToast } from '@/components';
import { QuestionService, updateQuizStatus } from '@/services';
import { api } from '@/services';
import QuizQuestionInline from './QuizQuestionInline';
import QuizPreview from './QuizPreview';
import { QuestionMarkCircleIcon, EyeIcon } from '@heroicons/react/24/outline';

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
  const [isCompleting, setIsCompleting] = useState(false);
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

  const handleComplete = async () => {
    if (selectedQuestionIds.length === 0) {
      addToast({
        type: 'warning',
        message: 'Please add at least one question before completing the quiz creation.'
      });
      return;
    }

    setIsCompleting(true);
    try {
      // Update quiz status to PUBLISHED when completing quiz creation
      await updateQuizStatus(quizId, { status: 'PUBLISHED' });
      
      addToast({
        type: 'success',
        message: `Quiz "${quizTitle}" created and published successfully with ${selectedQuestionIds.length} questions!`
      });
      
      onComplete();
    } catch (error: any) {
      console.error('Failed to publish quiz:', error);
      addToast({
        type: 'error',
        message: error?.response?.data?.message || 'Failed to publish quiz. Please try again.'
      });
    } finally {
      setIsCompleting(false);
    }
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
        <div className="h-8 bg-theme-bg-tertiary rounded w-1/4"></div>
        <div className="h-4 bg-theme-bg-tertiary rounded w-1/2"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 bg-theme-bg-tertiary rounded"></div>
            <div className="h-64 bg-theme-bg-tertiary rounded"></div>
          </div>
          <div className="h-96 bg-theme-bg-tertiary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-theme-text-primary mb-2">
          Add Questions to "{quizTitle}"
        </h3>
        <p className="text-theme-text-secondary">
          Create or select questions for your quiz. You can preview your quiz anytime.
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="bg-theme-bg-tertiary rounded-lg p-1">
          <Button
            type="button"
            onClick={() => setActiveView('questions')}
            variant={activeView === 'questions' ? 'primary' : 'ghost'}
            size="md"
            leftIcon={<QuestionMarkCircleIcon className="w-4 h-4" />}
            className="!rounded-md"
          >
            Questions ({selectedQuestionIds.length})
          </Button>
          <Button
            type="button"
            onClick={() => setActiveView('preview')}
            variant={activeView === 'preview' ? 'primary' : 'ghost'}
            size="md"
            leftIcon={<EyeIcon className="w-4 h-4" />}
            className="!rounded-md"
          >
            Preview
          </Button>
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
          <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-medium text-theme-text-primary">
                  {selectedQuestionIds.length > 0 ? 'Ready to Complete?' : 'Add Questions'}
                </h4>
                <p className="text-sm text-theme-text-secondary mt-1">
                  {selectedQuestionIds.length > 0 
                    ? `${selectedQuestionIds.length} questions selected. Your quiz is ready!`
                    : 'Add at least one question to complete your quiz.'
                  }
                </p>
                <p className="text-xs text-theme-text-tertiary mt-2">
                  <strong>Complete:</strong> Finish quiz creation and go to quiz list • <strong>Save Draft:</strong> Save for later editing
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveDraft}
                  className="w-full sm:w-auto"
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleComplete}
                  disabled={selectedQuestionIds.length === 0 || isCompleting}
                  loading={isCompleting}
                  className="w-full sm:w-auto"
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
          <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-medium text-theme-text-primary">
                  Preview Complete
                </h4>
                <p className="text-sm text-theme-text-secondary mt-1">
                  Review your quiz above. Switch back to Questions to add more content.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setActiveView('questions')}
                  className="w-full sm:w-auto"
                >
                  Back to Questions
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleComplete}
                  disabled={selectedQuestionIds.length === 0 || isCompleting}
                  loading={isCompleting}
                  className="w-full sm:w-auto"
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