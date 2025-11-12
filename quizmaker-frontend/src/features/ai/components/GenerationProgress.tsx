import React, { useState, useEffect, useRef } from 'react';
import { QuizService, api } from '@/services';
import { 
  QuizGenerationStatus,
  GenerationStatus
} from '@/types';
import { Button, Alert } from '@/components';

interface GenerationProgressProps {
  jobId: string;
  onGenerationComplete?: (quizId: string) => void;
  onGenerationError?: (error: string) => void;
  onGenerationCancelled?: () => void;
  className?: string;
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({ 
  jobId, 
  onGenerationComplete, 
  onGenerationError, 
  onGenerationCancelled,
  className = '' 
}) => {
  const [generationStatus, setGenerationStatus] = useState<QuizGenerationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const quizService = new QuizService(api);
  const pollingIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (jobId) {
      startPolling();
      startTimeRef.current = Date.now();
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [jobId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const startPolling = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const status = await quizService.getGenerationStatus(jobId);
      setGenerationStatus(status);

      if (status.status === 'COMPLETED') {
        handleGenerationComplete();
      } else if (status.status === 'FAILED') {
        handleGenerationError(status.errorMessage || 'Generation failed');
      } else if (status.status === 'CANCELLED') {
        handleGenerationCancelled();
      }
      // Removed automatic polling - only manual refresh now
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get generation status';
      setError(errorMessage);
      onGenerationError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const manualRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const status = await quizService.getGenerationStatus(jobId);
      setGenerationStatus(status);

      if (status.status === 'COMPLETED') {
        handleGenerationComplete();
      } else if (status.status === 'FAILED') {
        handleGenerationError(status.errorMessage || 'Generation failed');
      } else if (status.status === 'CANCELLED') {
        handleGenerationCancelled();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get generation status';
      setError(errorMessage);
      onGenerationError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerationComplete = async () => {
    try {
      const generatedQuiz = await quizService.getGeneratedQuiz(jobId);
      onGenerationComplete?.(generatedQuiz.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retrieve generated quiz';
      setError(errorMessage);
      onGenerationError?.(errorMessage);
    }
  };

  const handleGenerationError = (errorMessage: string) => {
    setError(errorMessage);
    onGenerationError?.(errorMessage);
  };

  const handleGenerationCancelled = () => {
    onGenerationCancelled?.();
  };

  const handleCancelGeneration = async () => {
    try {
      setIsLoading(true);
      await quizService.cancelGenerationJob(jobId);
      handleGenerationCancelled();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel generation';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: GenerationStatus) => {
    switch (status) {
      case 'COMPLETED': return 'text-theme-interactive-success bg-theme-bg-success';
      case 'PROCESSING': return 'text-theme-interactive-primary bg-theme-bg-info';
      case 'PENDING': return 'text-theme-interactive-warning bg-theme-bg-warning';
      case 'FAILED': return 'text-theme-interactive-danger bg-theme-bg-danger';
      case 'CANCELLED': return 'text-theme-text-secondary bg-theme-bg-secondary';
      default: return 'text-theme-text-secondary bg-theme-bg-secondary';
    }
  };

  const getStatusIcon = (status: GenerationStatus) => {
    switch (status) {
      case 'COMPLETED': return '✓';
      case 'PROCESSING': return '⟳';
      case 'PENDING': return '⏳';
      case 'FAILED': return '✗';
      case 'CANCELLED': return '⊘';
      default: return '○';
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (isLoading && !generationStatus) {
    return (
      <div className={`bg-theme-bg-primary border rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-theme-bg-tertiary rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-theme-bg-tertiary rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-theme-bg-tertiary rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!generationStatus) {
    return (
      <div className={`bg-theme-bg-primary border rounded-lg p-6 ${className}`}>
        <div className="text-center text-theme-text-tertiary">
          <p>Generation status not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-theme-bg-primary border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-theme-text-primary">Quiz Generation Progress</h3>
          <p className="text-sm text-theme-text-secondary mt-1">
            Job ID: {jobId}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(generationStatus.status)}`}>
          <span className="mr-1">{getStatusIcon(generationStatus.status)}</span>
          {generationStatus.status}
        </div>
      </div>

      {/* Status Message */}
      <div className="mb-6">
        <div className="p-4 bg-theme-bg-info border border-theme-border-info rounded-lg">
          <p className="text-sm text-theme-interactive-info">
            {generationStatus.status === 'PROCESSING' && `Processing chunk ${generationStatus.processedChunks} of ${generationStatus.totalChunks}`}
            {generationStatus.status === 'PENDING' && 'Generation job is queued and will start shortly'}
            {generationStatus.status === 'COMPLETED' && 'Quiz generation completed successfully!'}
            {generationStatus.status === 'FAILED' && `Generation failed: ${generationStatus.errorMessage}`}
            {generationStatus.status === 'CANCELLED' && 'Generation was cancelled'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {generationStatus.status === 'PROCESSING' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-theme-text-secondary">Progress</span>
            <span className="text-sm text-theme-text-tertiary">
              {generationStatus.processedChunks} / {generationStatus.totalChunks} chunks ({generationStatus.progressPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
            <div 
              className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationStatus.progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Time Information */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 bg-theme-bg-secondary rounded-lg">
          <p className="text-xs text-theme-text-tertiary">Time Elapsed</p>
          <p className="text-lg font-semibold text-theme-text-primary">{formatTime(timeElapsed)}</p>
        </div>
        {generationStatus.estimatedTimeRemainingSeconds !== undefined && (
          <div className="p-3 bg-theme-bg-secondary rounded-lg">
            <p className="text-xs text-theme-text-tertiary">Estimated Time Remaining</p>
            <p className="text-lg font-semibold text-theme-text-primary">{formatTime(generationStatus.estimatedTimeRemainingSeconds)}</p>
          </div>
        )}
        {generationStatus.elapsedTimeSeconds !== undefined && (
          <div className="p-3 bg-theme-bg-secondary rounded-lg">
            <p className="text-xs text-theme-text-tertiary">Total Elapsed Time</p>
            <p className="text-lg font-semibold text-theme-text-primary">{formatTime(generationStatus.elapsedTimeSeconds)}</p>
          </div>
        )}
      </div>

      {/* Processing Stages */}
      {generationStatus.status === 'PROCESSING' && (
        <div className="mb-6">
          <h4 className="font-medium text-theme-text-primary mb-3">Processing Stages</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-theme-bg-success rounded-full mr-3"></div>
              <span className="text-sm text-theme-text-secondary">Document analysis completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-theme-bg-info rounded-full mr-3"></div>
              <span className="text-sm text-theme-text-secondary">AI question generation in progress</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-theme-bg-tertiary rounded-full mr-3"></div>
              <span className="text-sm text-theme-text-tertiary">Quiz compilation</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-theme-bg-tertiary rounded-full mr-3"></div>
              <span className="text-sm text-theme-text-tertiary">Final validation</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6">
          <Alert type="error" className="text-sm">
            {error}
          </Alert>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          onClick={manualRefresh}
          disabled={isLoading}
          loading={isLoading}
          variant="secondary"
          size="md"
        >
          Refresh
        </Button>
        {generationStatus.status === 'PROCESSING' && (
          <Button
            type="button"
            onClick={handleCancelGeneration}
            disabled={isLoading}
            loading={isLoading}
            variant="danger"
            size="md"
          >
            Cancel Generation
          </Button>
        )}
        {generationStatus.status === 'COMPLETED' && (
          <Button
            type="button"
            onClick={() => window.location.href = '/quizzes'}
            variant="primary"
            size="md"
          >
            View Generated Quiz
          </Button>
        )}
      </div>
    </div>
  );
};

export default GenerationProgress; 