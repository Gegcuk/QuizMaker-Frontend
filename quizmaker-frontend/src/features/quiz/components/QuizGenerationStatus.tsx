// ---------------------------------------------------------------------------
// QuizGenerationStatus.tsx - Component for tracking quiz generation job status
// Shows progress, allows cancellation, and links to completed quiz
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, useToast } from '@/components';
import { QuizService } from '../services/quiz.service';
import { QuizGenerationStatus as ApiGenerationStatus } from '@/types';
import { api } from '@/services';

interface QuizGenerationStatusProps {
  jobId: string;
  initialStatus?: string;
  estimatedTimeSeconds?: number;
  onComplete?: (quizId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}


export const QuizGenerationStatus: React.FC<QuizGenerationStatusProps> = ({
  jobId,
  initialStatus = 'PENDING',
  estimatedTimeSeconds,
  onComplete,
  onError,
  onCancel
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const quizService = new QuizService(api);
  
  const [status, setStatus] = useState<ApiGenerationStatus>({
    jobId,
    status: initialStatus as any,
    totalChunks: 0,
    processedChunks: 0,
    progressPercentage: 0,
    currentChunk: '',
    estimatedCompletion: '',
    errorMessage: null,
    totalQuestionsGenerated: 0,
    elapsedTimeSeconds: 0,
    estimatedTimeRemainingSeconds: 0,
    generatedQuizId: null,
    startedAt: new Date().toISOString(),
    completedAt: null
  });
  
  const [isPolling, setIsPolling] = useState(true);

  // Poll for status updates
  useEffect(() => {
    if (!isPolling || status.status === 'COMPLETED' || status.status === 'FAILED' || status.status === 'CANCELLED') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await quizService.getGenerationStatus(jobId);
        setStatus(response);

        if (response.status === 'COMPLETED' && response.generatedQuizId) {
          setIsPolling(false);
          onComplete?.(response.generatedQuizId);
          addToast({ message: 'Quiz generated successfully!' });
        } else if (response.status === 'FAILED') {
          setIsPolling(false);
          onError?.('Quiz generation failed');
          addToast({ message: 'Quiz generation failed' });
        }
      } catch (error: any) {
        console.error('Error polling generation status:', error);
        setIsPolling(false);
        onError?.(error.message || 'Failed to check generation status');
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [jobId, status.status, isPolling, onComplete, onError, estimatedTimeSeconds]);

  const handleCancel = async () => {
    try {
      await quizService.cancelGenerationJob(jobId);
      
      setIsPolling(false);
      setStatus(prev => ({ ...prev, status: 'CANCELLED', message: 'Generation cancelled' }));
      onCancel?.();
      addToast({ message: 'Generation cancelled' });
    } catch (error: any) {
      addToast({ message: 'Failed to cancel generation' });
    }
  };

  const handleViewQuiz = () => {
    if (status.generatedQuizId) {
      navigate(`/quizzes/${status.generatedQuizId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'PROCESSING': return 'text-blue-600 bg-blue-100';
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      case 'CANCELLED': return 'text-theme-text-secondary bg-theme-bg-tertiary';
      default: return 'text-theme-text-secondary bg-theme-bg-tertiary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'PROCESSING': return '⚙️';
      case 'COMPLETED': return '✅';
      case 'FAILED': return '❌';
      case 'CANCELLED': return '🚫';
      default: return '❓';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">{getStatusIcon(status.status)}</div>
          <h3 className="text-xl font-semibold text-theme-text-primary mb-2">
            Generating Your Quiz
          </h3>
          <p className="text-theme-text-secondary mb-4">
            Generating quiz content...
          </p>
          
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
            {status.status.replace('_', ' ')}
          </div>
        </div>

        {/* Progress Bar */}
        {status.status === 'PROCESSING' && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-theme-text-secondary mb-2">
              <span>Progress</span>
              <span>{status.progressPercentage || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(Math.max(status.progressPercentage || 0, 0), 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Time Information */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="text-center p-3 bg-theme-bg-secondary rounded-lg">
            <div className="font-medium text-theme-text-primary">Elapsed Time</div>
            <div className="text-theme-text-secondary">{formatTime(status.elapsedTimeSeconds || 0)}</div>
          </div>
          {status.estimatedTimeRemainingSeconds && (
            <div className="text-center p-3 bg-theme-bg-secondary rounded-lg">
              <div className="font-medium text-theme-text-primary">Estimated Remaining</div>
              <div className="text-theme-text-secondary">{formatTime(status.estimatedTimeRemainingSeconds)}</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {status.status === 'PROCESSING' && (
            <Button
              variant="secondary"
              onClick={handleCancel}
            >
              Cancel Generation
            </Button>
          )}
          
          {status.status === 'COMPLETED' && status.generatedQuizId && (
            <Button
              variant="primary"
              onClick={handleViewQuiz}
            >
              View Generated Quiz
            </Button>
          )}
          
          {status.status === 'FAILED' && (
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          )}
        </div>

        {/* Job ID for debugging */}
        <div className="mt-6 text-center">
          <p className="text-xs text-theme-text-tertiary">
            Job ID: {jobId}
          </p>
        </div>
      </div>
    </div>
  );
};
