// src/components/attempt/AttemptPause.tsx
// ---------------------------------------------------------------------------
// Component for pausing and resuming quiz attempts
// Handles pause/resume functionality with confirmation dialogs
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { AttemptStatus } from '@/types';
import { Button, Alert } from '@/components';
import { getErrorMessage } from '@/utils/errorUtils';

interface AttemptPauseProps {
  currentStatus: AttemptStatus;
  onPause: () => Promise<boolean>;
  onResume: () => Promise<boolean>;
  disabled?: boolean;
  className?: string;
}

const AttemptPause: React.FC<AttemptPauseProps> = ({
  currentStatus,
  onPause,
  onResume,
  disabled = false,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [action, setAction] = useState<'pause' | 'resume' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runConfirmedAction = async () => {
    if (!action) return;
    setIsLoading(true);
    setError(null);

    try {
      const completed = await (action === 'pause' ? onPause() : onResume());
      if (!completed) {
        setError('Another attempt action is still finishing. Please try again.');
        return;
      }
      setShowConfirmDialog(false);
      setAction(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const openConfirmDialog = (actionType: 'pause' | 'resume') => {
    setAction(actionType);
    setShowConfirmDialog(true);
    setError(null);
  };

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    setAction(null);
    setError(null);
  };

  const isPaused = currentStatus === 'PAUSED';
  const canPause = currentStatus === 'IN_PROGRESS';
  const canResume = currentStatus === 'PAUSED';

  if (!canPause && !canResume) {
    return null; // Don't render if no pause/resume actions are available
  }

  return (
    <>
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              isPaused ? 'bg-theme-bg-tertiary' : 'bg-theme-bg-tertiary'
            }`} />
            <div>
              <div className="text-sm font-medium text-theme-text-primary">
                {isPaused ? 'Attempt Paused' : 'Attempt Active'}
              </div>
              <div className="text-xs text-theme-text-tertiary">
                {isPaused 
                  ? 'Your progress has been saved. You can resume anytime.'
                  : 'Your attempt is in progress.'
                }
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            {canPause && (
              <Button
                onClick={() => openConfirmDialog('pause')}
                disabled={isLoading || disabled}
                variant="secondary"
                size="sm"
                className="!bg-theme-bg-warning !text-theme-interactive-warning hover:!bg-theme-bg-tertiary"
              >
                ⏸️ Pause
              </Button>
            )}
            
            {canResume && (
              <Button
                onClick={() => openConfirmDialog('resume')}
                disabled={isLoading || disabled}
                variant="secondary"
                size="sm"
                className="!bg-theme-bg-success !text-theme-interactive-success hover:!bg-theme-bg-tertiary"
              >
                ▶️ Resume
              </Button>
            )}
          </div>
        </div>

        {/* Status-specific information */}
        {isPaused && (
          <div className="mt-3 p-3 bg-theme-bg-warning border border-theme-border-warning rounded-md">
            <div className="text-sm text-theme-interactive-warning">
              <strong>Paused:</strong> Your answers are saved. You can resume this attempt later.
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-theme-bg-overlay bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-theme-bg-primary rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-lg font-medium text-theme-text-primary mb-2">
                {action === 'pause' ? 'Pause Attempt?' : 'Resume Attempt?'}
              </div>
              
              <div className="text-sm text-theme-text-secondary mb-6">
                {action === 'pause' 
                  ? 'Your progress will be saved and you can resume later. Are you sure you want to pause?'
                  : 'Resume your quiz attempt from where you left off?'
                }
              </div>

              {error && (
                <div className="mb-4">
                  <Alert type="error" className="text-sm">
                    {error}
                  </Alert>
                </div>
              )}

              <div className="flex space-x-3 justify-center">
                <Button
                  onClick={closeConfirmDialog}
                  disabled={isLoading}
                  variant="secondary"
                  size="md"
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={runConfirmedAction}
                  disabled={isLoading}
                  loading={isLoading}
                  variant="primary"
                  size="md"
                >
                  {action === 'pause' ? 'Pause' : 'Resume'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttemptPause; 
