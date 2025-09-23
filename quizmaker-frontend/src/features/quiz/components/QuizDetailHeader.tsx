// src/components/QuizDetailHeader.tsx
// ---------------------------------------------------------------------------
// Quiz title, stats, actions based on QuizDto
// ---------------------------------------------------------------------------

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QuizDto } from '@/types';
import { PageHeader, Badge } from '@/components';
import { ActionType } from '@/components/layout/types';

interface QuizDetailHeaderProps {
  quiz: QuizDto;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  onStart?: () => void;
  onManageQuestions?: () => void;
  onManageGeneration?: () => void;
  className?: string;
}

const QuizDetailHeader: React.FC<QuizDetailHeaderProps> = ({
  quiz,
  onEdit,
  onDelete,
  onShare,
  onExport,
  onStart,
  onManageQuestions,
  onManageGeneration,
  className = ''
}) => {
  const navigate = useNavigate();

  const difficultyToBadge = (d: string) => (d === 'EASY' ? 'success' : d === 'MEDIUM' ? 'warning' : 'danger');
  const statusToBadge = (s: string) => (s === 'PUBLISHED' ? 'success' : s === 'DRAFT' ? 'warning' : 'secondary');
  const visibilityToBadge = (v: string) => (v === 'PUBLIC' ? 'info' : 'secondary');

  // Helper function to format time
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Build actions array for PageHeader
  const buildActions = () => {
    const actions = [];

    // Start Quiz action
    if (quiz.status === 'PUBLISHED' && onStart) {
      actions.push({
        label: 'Start Quiz',
        type: 'view' as ActionType,
        variant: 'primary' as const,
        onClick: onStart
      });
    }

    // Manage Questions action (prominent button)
    if (onManageQuestions) {
      actions.push({
        label: 'Questions',
        type: 'edit' as ActionType,
        variant: 'primary' as const,
        onClick: onManageQuestions
      });
    }

    // Edit action (only for creator or admin)
    if (onEdit) {
      actions.push({
        label: 'Edit Quiz',
        type: 'edit' as ActionType,
        variant: 'secondary' as const,
        onClick: onEdit
      });
    }

    // Manage Generation action
    if (onManageGeneration) {
      actions.push({
        label: 'AI Generation',
        type: 'view' as ActionType,
        variant: 'secondary' as const,
        onClick: onManageGeneration
      });
    }

    // Share action
    if (onShare) {
      actions.push({
        label: 'Share',
        type: 'share' as ActionType,
        variant: 'secondary' as const,
        onClick: onShare
      });
    }

    // Export action
    if (onExport) {
      actions.push({
        label: 'Export Results',
        type: 'download' as ActionType,
        variant: 'secondary' as const,
        onClick: onExport
      });
    }

    // Delete action (only for creator or admin)
    if (onDelete) {
      actions.push({
        label: 'Delete Quiz',
        type: 'delete' as ActionType,
        variant: 'danger' as const,
        onClick: onDelete,
        confirmMessage: 'Are you sure you want to delete this quiz? This action cannot be undone.'
      });
    }

    return actions;
  };

  return (
    <div className={className}>
      {/* Page Header */}
      <PageHeader
        title={quiz.title}
        subtitle={quiz.description}
        showBreadcrumb={true}
        showBackButton={true}
        backTo="/quizzes"
        actions={buildActions()}
      />

      {/* Quiz Stats Overview */}
      <div className="bg-theme-bg-primary border-b border-theme-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Quiz Status */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-theme-interactive-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-theme-text-tertiary">Status</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={statusToBadge(quiz.status)} size="sm">{quiz.status}</Badge>
                  <Badge variant={visibilityToBadge(quiz.visibility)} size="sm">{quiz.visibility}</Badge>
                </div>
              </div>
            </div>

            {/* Difficulty */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-theme-text-tertiary">Difficulty</p>
                <Badge variant={difficultyToBadge(quiz.difficulty)} size="sm">{quiz.difficulty}</Badge>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-theme-text-tertiary">Estimated Time</p>
                <p className="text-lg font-semibold text-theme-text-primary">{formatTime(quiz.estimatedTime)}</p>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-theme-text-tertiary">Timer</p>
                <p className="text-lg font-semibold text-theme-text-primary">
                  {quiz.timerEnabled ? formatTime(quiz.timerDuration) : 'No limit'}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Quiz Features */}
          <div className="mt-6 flex flex-wrap items-center space-x-4 text-sm text-theme-text-secondary">
            {quiz.isRepetitionEnabled && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Multiple attempts allowed</span>
              </div>
            )}
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Created: {new Date(quiz.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Updated: {new Date(quiz.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDetailHeader; 
