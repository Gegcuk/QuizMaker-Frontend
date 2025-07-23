// src/components/attempt/AttemptPause.tsx
// ---------------------------------------------------------------------------
// Component for pausing and resuming quiz attempts
// Handles pause/resume functionality with confirmation dialogs
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { AttemptService } from '../../api/attempt.service';
import { AttemptStatus } from '../../types/attempt.types';
import api from '../../api/axiosInstance';

interface AttemptPauseProps {
  attemptId: string;
  currentStatus: AttemptStatus;
  onStatusChange: (status: AttemptStatus) => void;
  onPause?: () => void;
  onResume?: () => void;
  className?: string;
}

const AttemptPause: React.FC<AttemptPauseProps> = ({
  attemptId,
  currentStatus,
  onStatusChange,
  onPause,
  onResume,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [action, setAction] = useState<'pause' | 'resume' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const attemptService = new AttemptService(api);

  const handlePause = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedAttempt = await attemptService.pauseAttempt(attemptId);
      onStatusChange(updatedAttempt.status);
      if (onPause) onPause();
      setShowConfirmDialog(false);
    } catch (err: any) {
      setError(err.message || 'Failed to pause attempt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedAttempt = await attemptService.resumeAttempt(attemptId);
      onStatusChange(updatedAttempt.status);
      if (onResume) onResume();
      setShowConfirmDialog(false);
    } catch (err: any) {
      setError(err.message || 'Failed to resume attempt. Please try again.');
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
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              isPaused ? 'bg-yellow-400' : 'bg-green-400'
            }`} />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {isPaused ? 'Attempt Paused' : 'Attempt Active'}
              </div>
              <div className="text-xs text-gray-500">
                {isPaused 
                  ? 'Your progress has been saved. You can resume anytime.'
                  : 'Your attempt is in progress.'
                }
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            {canPause && (
              <button
                onClick={() => openConfirmDialog('pause')}
                disabled={isLoading}
                className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ⏸️ Pause
              </button>
            )}
            
            {canResume && (
              <button
                onClick={() => openConfirmDialog('resume')}
                disabled={isLoading}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ▶️ Resume
              </button>
            )}
          </div>
        </div>

        {/* Status-specific information */}
        {isPaused && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-sm text-yellow-800">
              <strong>Paused:</strong> Your answers are saved. You can resume this attempt later.
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-900 mb-2">
                {action === 'pause' ? 'Pause Attempt?' : 'Resume Attempt?'}
              </div>
              
              <div className="text-sm text-gray-600 mb-6">
                {action === 'pause' 
                  ? 'Your progress will be saved and you can resume later. Are you sure you want to pause?'
                  : 'Resume your quiz attempt from where you left off?'
                }
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex space-x-3 justify-center">
                <button
                  onClick={closeConfirmDialog}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={action === 'pause' ? handlePause : handleResume}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    action === 'pause'
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
                      : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {action === 'pause' ? 'Pausing...' : 'Resuming...'}
                    </div>
                  ) : (
                    action === 'pause' ? 'Pause' : 'Resume'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttemptPause; 