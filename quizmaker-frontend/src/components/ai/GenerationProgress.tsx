import React, { useState, useEffect, useRef } from 'react';
import { QuizService } from '../../api/quiz.service';
import api from '../../api/axiosInstance';
import { 
  QuizGenerationStatus,
  GenerationStatus
} from '../../types/quiz.types';

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
      case 'COMPLETED': return 'text-green-600 bg-green-50';
      case 'PROCESSING': return 'text-blue-600 bg-blue-50';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'FAILED': return 'text-red-600 bg-red-50';
      case 'CANCELLED': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
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
      <div className={`bg-white border rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!generationStatus) {
    return (
      <div className={`bg-white border rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p>Generation status not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quiz Generation Progress</h3>
          <p className="text-sm text-gray-600 mt-1">
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
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
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
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">
              {generationStatus.processedChunks} / {generationStatus.totalChunks} chunks ({generationStatus.progressPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationStatus.progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Time Information */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Time Elapsed</p>
          <p className="text-lg font-semibold text-gray-900">{formatTime(timeElapsed)}</p>
        </div>
        {generationStatus.estimatedTimeRemainingSeconds !== undefined && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Estimated Time Remaining</p>
            <p className="text-lg font-semibold text-gray-900">{formatTime(generationStatus.estimatedTimeRemainingSeconds)}</p>
          </div>
        )}
        {generationStatus.elapsedTimeSeconds !== undefined && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Total Elapsed Time</p>
            <p className="text-lg font-semibold text-gray-900">{formatTime(generationStatus.elapsedTimeSeconds)}</p>
          </div>
        )}
      </div>

      {/* Processing Stages */}
      {generationStatus.status === 'PROCESSING' && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Processing Stages</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">Document analysis completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-700">AI question generation in progress</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
              <span className="text-sm text-gray-500">Quiz compilation</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
              <span className="text-sm text-gray-500">Final validation</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={manualRefresh}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
        {generationStatus.status === 'PROCESSING' && (
          <button
            type="button"
            onClick={handleCancelGeneration}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Cancelling...' : 'Cancel Generation'}
          </button>
        )}
        {generationStatus.status === 'COMPLETED' && (
          <button
            type="button"
            onClick={() => window.location.href = '/quizzes'}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            View Generated Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default GenerationProgress; 