// src/components/QuizPreview.tsx
// ---------------------------------------------------------------------------
// Live preview of quiz component
// ---------------------------------------------------------------------------

import React from 'react';
import { CreateQuizRequest, UpdateQuizRequest, QuizDto } from '@/types';
import { Badge } from '@/components';

interface QuizPreviewProps {
  quizData: Partial<CreateQuizRequest | UpdateQuizRequest> | QuizDto;
  className?: string;
}

const QuizPreview: React.FC<QuizPreviewProps> = ({
  quizData,
  className = ''
}) => {
  // Helper function to get difficulty color
  const getDifficultyVariant = (difficulty: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (difficulty) {
      case 'EASY':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HARD':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  // Helper function to format time
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className={`bg-theme-bg-primary shadow-theme rounded-lg ${className}`}>
      <div className="px-6 py-4 border-b border-theme-border-primary">
        <h3 className="text-lg font-medium text-theme-text-primary">Quiz Preview</h3>
        <p className="mt-1 text-sm text-theme-text-tertiary">
          How your quiz will appear to users
        </p>
      </div>

      <div className="px-6 py-4">
        {!quizData.title ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No quiz data</h3>
            <p className="mt-1 text-sm text-theme-text-tertiary">
              Start by adding a title and description to see the preview
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quiz Header */}
            <div className="border-b border-theme-border-primary pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-theme-text-primary mb-2">
                    {quizData.title}
                  </h1>
                  {quizData.description && (
                    <p className="text-theme-text-secondary mb-4">
                      {quizData.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getDifficultyVariant(quizData.difficulty || 'MEDIUM')} size="sm">
                    {quizData.difficulty || 'MEDIUM'}
                  </Badge>
                  <Badge variant={quizData.visibility === 'PUBLIC' ? 'primary' : 'neutral'} size="sm">
                    {quizData.visibility || 'PRIVATE'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quiz Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-theme-bg-secondary p-4 rounded-lg">
                <h4 className="text-sm font-medium text-theme-text-secondary mb-3">Quiz Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-theme-text-secondary">Estimated Time:</span>
                    <span className="font-medium">
                      {quizData.estimatedTime ? formatTime(quizData.estimatedTime) : 'Not set'}
                    </span>
                  </div>
                  {quizData.timerEnabled && (
                    <div className="flex justify-between">
                      <span className="text-theme-text-secondary">Time Limit:</span>
                      <span className="font-medium">
                        {quizData.timerDuration ? formatTime(quizData.timerDuration) : 'Not set'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-theme-text-secondary">Multiple Attempts:</span>
                    <span className="font-medium">
                      {quizData.isRepetitionEnabled ? 'Allowed' : 'Not allowed'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-theme-bg-secondary p-4 rounded-lg">
                <h4 className="text-sm font-medium text-theme-text-secondary mb-3">Quiz Status</h4>
                <div className="space-y-2 text-sm">
                                     <div className="flex justify-between">
                     <span className="text-theme-text-secondary">Status:</span>
                     <span className={`font-medium ${
                       'status' in quizData && quizData.status === 'PUBLISHED' ? 'text-theme-interactive-success' :
                       'status' in quizData && quizData.status === 'DRAFT' ? 'text-theme-interactive-warning' :
                       'text-theme-text-secondary'
                     }`}>
                       {'status' in quizData ? quizData.status : 'DRAFT'}
                     </span>
                   </div>
                  <div className="flex justify-between">
                    <span className="text-theme-text-secondary">Visibility:</span>
                    <span className="font-medium">
                      {quizData.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-text-secondary">Difficulty:</span>
                    <span className="font-medium">
                      {quizData.difficulty || 'MEDIUM'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timer Warning */}
            {quizData.timerEnabled && !quizData.timerDuration && (
              <div className="bg-theme-bg-warning border border-theme-border-warning rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-theme-interactive-warning">
                      Timer is enabled but no duration is set. Please set a timer duration.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Start Quiz Button */}
            <div className="border-t border-theme-border-primary pt-4">
              <button
                type="button"
                className="w-full bg-theme-interactive-primary text-theme-text-inverse py-3 px-4 rounded-md hover:bg-theme-interactive-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary transition-colors"
              >
                Start Quiz
              </button>
              <p className="mt-2 text-xs text-theme-text-tertiary text-center">
                This is a preview. The actual quiz will be available when published.
              </p>
            </div>

            {/* Quiz Instructions */}
            <div className="bg-theme-bg-info border border-theme-border-info rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Quiz Instructions</h4>
              <ul className="text-sm text-theme-interactive-info space-y-1">
                <li>• Read each question carefully before answering</li>
                {quizData.timerEnabled && (
                  <li>• You have {quizData.timerDuration ? formatTime(quizData.timerDuration) : 'a time limit'} to complete this quiz</li>
                )}
                <li>• You can review your answers before submitting</li>
                {quizData.isRepetitionEnabled && (
                  <li>• You can retake this quiz multiple times</li>
                )}
                <li>• Your score will be displayed after completion</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPreview; 