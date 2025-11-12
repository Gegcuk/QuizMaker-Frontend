// src/components/QuizPublishModal.tsx
// ---------------------------------------------------------------------------
// Confirmation modal for publishing based on QuizStatus
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { QuizStatus, QuizDto } from '@/types';
import { Badge, Button, Alert } from '@/components';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface QuizPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: QuizStatus) => Promise<void>;
  quiz: QuizDto;
  className?: string;
}

const QuizPublishModal: React.FC<QuizPublishModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  quiz,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onConfirm('PUBLISHED');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onConfirm('ARCHIVED');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDraft = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onConfirm('DRAFT');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save as draft');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-theme-bg-tertiary bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className={`inline-block align-bottom bg-theme-bg-primary rounded-lg text-left overflow-hidden shadow-theme-lg transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${className}`}>
          <div className="bg-theme-bg-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-theme-bg-tertiary sm:mx-0 sm:h-10 sm:w-10">
                <CheckCircleIcon className="h-6 w-6 text-theme-interactive-primary" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-theme-text-primary">
                  Quiz Status Management
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-theme-text-tertiary">
                    Choose what you want to do with <strong>"{quiz.title}"</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4">
                <Alert type="error" className="text-sm">
                  {error}
                </Alert>
              </div>
            )}

            {/* Current status */}
            <div className="mt-4 bg-theme-bg-secondary p-4 rounded-md">
              <h4 className="text-sm font-medium text-theme-text-secondary mb-2">Current Status</h4>
              <div className="flex items-center space-x-2">
                <Badge variant={
                  quiz.status === 'PUBLISHED' ? 'success' :
                  quiz.status === 'DRAFT' ? 'warning' :
                  'neutral'
                } size="sm">
                  {quiz.status}
                </Badge>
                <span className="text-sm text-theme-text-secondary">
                  {quiz.status === 'PUBLISHED' && 'This quiz is live and visible to users'}
                  {quiz.status === 'DRAFT' && 'This quiz is saved but not published'}
                  {quiz.status === 'ARCHIVED' && 'This quiz is archived and not visible'}
                </span>
              </div>
            </div>

            {/* Action options */}
            <div className="mt-4 space-y-3">
              {quiz.status !== 'PUBLISHED' && (
                <Button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  loading={isLoading}
                  variant="primary"
                  className="!w-full !bg-theme-interactive-success hover:!bg-theme-interactive-success-hover focus-visible:!ring-theme-interactive-success"
                >
                  Publish Quiz
                </Button>
              )}
              
              {quiz.status !== 'DRAFT' && (
                <Button
                  onClick={handleDraft}
                  disabled={isLoading}
                  loading={isLoading}
                  variant="primary"
                  className="!w-full !bg-theme-interactive-warning hover:!bg-theme-interactive-warning-hover focus-visible:!ring-theme-interactive-warning"
                >
                  Save as Draft
                </Button>
              )}
              
              {quiz.status !== 'ARCHIVED' && (
                <Button
                  onClick={handleArchive}
                  disabled={isLoading}
                  loading={isLoading}
                  variant="ghost"
                  className="!w-full"
                >
                  Archive Quiz
                </Button>
              )}
            </div>

            {/* Status descriptions */}
            <div className="mt-4 text-xs text-theme-text-tertiary space-y-1">
              <p><strong>Published:</strong> Quiz is live and visible to users</p>
              <p><strong>Draft:</strong> Quiz is saved but not visible to users</p>
              <p><strong>Archived:</strong> Quiz is hidden and not accessible</p>
            </div>
          </div>

          <div className="bg-theme-bg-secondary px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              variant="secondary"
              className="w-full sm:ml-3 sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPublishModal; 