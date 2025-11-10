// src/features/attempt/components/AttemptCard.tsx
// ---------------------------------------------------------------------------
// Reusable card component for displaying quiz attempts
// Uses base Card component for consistent styling
// ---------------------------------------------------------------------------

import React from 'react';
import { AttemptDto, AttemptStatsDto, CurrentQuestionDto, QuizDto } from '@/types';
import { Badge, Button, Card, CardBody } from '@/components';

export interface AttemptWithDetails extends AttemptDto {
  stats?: AttemptStatsDto;
  quiz?: QuizDto;
  currentQuestion?: CurrentQuestionDto;
}

interface AttemptCardProps {
  attempt: AttemptWithDetails;
  onResume?: (attempt: AttemptWithDetails) => void;
  onDelete?: (attempt: AttemptWithDetails) => void;
  isResuming?: boolean;
  isDeleting?: boolean;
  showActions?: boolean;
  className?: string;
}

const AttemptCard: React.FC<AttemptCardProps> = ({
  attempt,
  onResume,
  onDelete,
  isResuming = false,
  isDeleting = false,
  showActions = true,
  className = ''
}) => {
  // Helper function to get status color
  const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'neutral' => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'info';
      case 'PAUSED':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      default:
        return 'neutral';
    }
  };

  // Helper function to get status text
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'PAUSED':
        return 'Paused';
      case 'COMPLETED':
        return 'Completed';
      case 'ABANDONED':
        return 'Abandoned';
      default:
        return status;
    }
  };

  // Helper function to get mode text
  const getModeText = (mode: string): string => {
    switch (mode) {
      case 'ONE_BY_ONE':
        return 'One by One';
      case 'ALL_AT_ONCE':
        return 'All at Once';
      case 'TIMED':
        return 'Timed';
      default:
        return mode;
    }
  };

  // Helper function to format date
  const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return dateObj.toLocaleDateString();
  };

  return (
    <Card 
      variant="default" 
      padding="md" 
      hoverable
      className={className}
    >
      <CardBody>
        {/* Mobile Layout - Simple vertical stack */}
        <div className="md:hidden">
          {/* Quiz Title */}
          {attempt.quiz && (
            <h4 className="text-lg font-semibold text-theme-text-primary mb-1 truncate">
              {attempt.quiz.title}
            </h4>
          )}

          {/* Started Date */}
          <p className="text-sm text-theme-text-secondary mb-1">
            Started: {formatDate(attempt.startedAt)}
          </p>
          
          {/* Number of Questions */}
          {attempt.currentQuestion && (
            <p className="text-sm font-medium text-theme-interactive-primary mb-2">
              Question {attempt.currentQuestion.questionNumber} of {attempt.currentQuestion.totalQuestions}
            </p>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-theme-bg-tertiary rounded-full h-2 mb-3">
            <div
              className="bg-theme-interactive-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${attempt.stats?.completionPercentage || 0}%` }}
            />
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2">
              {onResume && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onResume(attempt)}
                  disabled={isResuming || isDeleting}
                  loading={isResuming}
                  leftIcon={
                    !isResuming && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )
                  }
                >
                  {isResuming 
                    ? (attempt.status === 'PAUSED' ? 'Resuming...' : 'Loading...')
                    : (attempt.status === 'PAUSED' ? 'Resume' : 'Continue')
                  }
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete(attempt)}
                  disabled={isResuming || isDeleting}
                  loading={isDeleting}
                  leftIcon={
                    !isDeleting && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )
                    }
                  >
                    Delete
                  </Button>
                )}
            </div>
          )}
        </div>

        {/* Desktop Layout - Detailed with badges and progress */}
        <div className="hidden md:block">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Status and Mode Badges */}
              <div className="flex items-center space-x-3 mb-2">
                <Badge variant={getStatusColor(attempt.status)} size="sm">
                  {getStatusText(attempt.status)}
                </Badge>
                <span className="text-sm text-theme-text-tertiary">
                  {getModeText(attempt.mode)}
                </span>
              </div>

              {/* Quiz Title and Details */}
              <div className="space-y-1">
                {attempt.quiz && (
                  <h4 className="font-medium text-theme-text-primary truncate">
                    {attempt.quiz.title}
                  </h4>
                )}
                <p className="text-sm text-theme-text-secondary">
                  Started: {formatDate(attempt.startedAt)}
                </p>
                
                {/* Current Question Info */}
                {attempt.currentQuestion && (
                  <div className="flex items-center space-x-4 text-sm text-theme-text-secondary">
                    <span className="font-medium text-theme-interactive-primary">
                      Current: Question {attempt.currentQuestion.questionNumber} of {attempt.currentQuestion.totalQuestions}
                    </span>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="w-full bg-theme-bg-tertiary rounded-full h-2 mt-2">
                  <div
                    className="bg-theme-interactive-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${attempt.stats?.completionPercentage || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="ml-4 flex-shrink-0">
                <div className="flex gap-2">
                  {onResume && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onResume(attempt)}
                      disabled={isResuming || isDeleting}
                      loading={isResuming}
                      leftIcon={
                        !isResuming && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )
                      }
                    >
                      {isResuming 
                        ? (attempt.status === 'PAUSED' ? 'Resuming...' : 'Loading...')
                        : (attempt.status === 'PAUSED' ? 'Resume' : 'Continue')
                      }
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(attempt)}
                      disabled={isResuming || isDeleting}
                      loading={isDeleting}
                      leftIcon={
                        !isDeleting && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )
                        }
                      >
                        Delete
                      </Button>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default AttemptCard;

