// src/components/attempt/AttemptSaveProgress.tsx
// ---------------------------------------------------------------------------
// Component for saving quiz attempt progress
// Handles auto-save functionality and manual save options
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';
import { AttemptService } from '../services/attempt.service';
import { AnswerSubmissionRequest } from '../types/attempt.types';
import api from '../../../api/axiosInstance';

interface AttemptSaveProgressProps {
  attemptId: string;
  answers: Record<string, any>;
  onSaveSuccess?: () => void;
  onSaveError?: (error: string) => void;
  autoSaveInterval?: number; // in seconds
  className?: string;
}

const AttemptSaveProgress: React.FC<AttemptSaveProgressProps> = ({
  attemptId,
  answers,
  onSaveSuccess,
  onSaveError,
  autoSaveInterval = 30, // 30 seconds default
  className = ''
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const attemptService = new AttemptService(api);

  const saveProgress = useCallback(async (isAutoSave = false) => {
    if (Object.keys(answers).length === 0) return;

    setIsSaving(true);
    setSaveStatus('saving');
    setError(null);

    try {
      // Convert answers to batch submission format
      const batchAnswers: AnswerSubmissionRequest[] = Object.entries(answers).map(([questionId, response]) => ({
        questionId,
        response
      }));

      await attemptService.submitBatchAnswers(attemptId, { answers: batchAnswers });
      
      setLastSaved(new Date());
      setSaveStatus('saved');
      setUnsavedChanges(false);
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }

      // Reset save status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save progress';
      setError(errorMessage);
      setSaveStatus('error');
      
      if (onSaveError) {
        onSaveError(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  }, [attemptId, answers, attemptService, onSaveSuccess, onSaveError]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveInterval <= 0 || Object.keys(answers).length === 0) return;

    const interval = setInterval(() => {
      if (unsavedChanges && !isSaving) {
        saveProgress(true);
      }
    }, autoSaveInterval * 1000);

    return () => clearInterval(interval);
  }, [autoSaveInterval, unsavedChanges, isSaving, saveProgress, answers]);

  // Track unsaved changes
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      setUnsavedChanges(true);
    }
  }, [answers]);

  const handleManualSave = () => {
    saveProgress(false);
  };

  const getSaveStatusText = (): string => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return unsavedChanges ? 'Unsaved changes' : 'All saved';
    }
  };

  const getSaveStatusColor = (): string => {
    switch (saveStatus) {
      case 'saving':
        return 'text-blue-600';
      case 'saved':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return unsavedChanges ? 'text-yellow-600' : 'text-gray-600';
    }
  };

  const getSaveStatusIcon = (): string => {
    switch (saveStatus) {
      case 'saving':
        return '⏳';
      case 'saved':
        return '✅';
      case 'error':
        return '❌';
      default:
        return unsavedChanges ? '⚠️' : '💾';
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getSaveStatusIcon()}</span>
          <div>
            <div className={`text-sm font-medium ${getSaveStatusColor()}`}>
              {getSaveStatusText()}
            </div>
            {lastSaved && (
              <div className="text-xs text-gray-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {autoSaveInterval > 0 && (
            <div className="text-xs text-gray-500">
              Auto-save: {autoSaveInterval}s
            </div>
          )}
          
          <button
            onClick={handleManualSave}
            disabled={isSaving || Object.keys(answers).length === 0}
            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isSaving ? 'Saving...' : 'Save Now'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-600">
            <strong>Save Error:</strong> {error}
          </div>
          <button
            onClick={handleManualSave}
            className="mt-2 text-xs text-red-700 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Auto-save info */}
      {autoSaveInterval > 0 && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-xs text-blue-700">
            <strong>Auto-save enabled:</strong> Your progress is automatically saved every {autoSaveInterval} seconds.
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {isSaving && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AttemptSaveProgress; 
