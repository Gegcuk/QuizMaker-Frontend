// src/components/QuizGenerationJobs.tsx
// ---------------------------------------------------------------------------
// Manage AI generation jobs based on QUIZ_ENDPOINTS
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuizGenerationResponse, GenerationStatus } from '@/types';
import { Badge, Button } from '@/components';
import { getGenerationStatusVariant } from '@/utils/statusHelpers';
import type { AxiosError } from 'axios';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  BoltIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface QuizGenerationJobsProps {
  quizId?: string;
  className?: string;
}

interface GenerationJob {
  id: string;
  quizId: string;
  status: GenerationStatus;
  message: string;
  estimatedTimeSeconds: number;
  createdAt: string;
  updatedAt: string;
  progress?: number;
  documentId?: string;
  documentTitle?: string;
}

const QuizGenerationJobs: React.FC<QuizGenerationJobsProps> = ({ quizId, className = '' }) => {
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<GenerationJob | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const loadJobs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Implement actual API call
        // const response = await getQuizGenerationJobs(quizId);
        
        // Mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockJobs: GenerationJob[] = [
          {
            id: 'job-1',
            quizId: quizId || 'quiz-1',
            status: 'COMPLETED',
            message: 'Quiz generated successfully with 15 questions',
            estimatedTimeSeconds: 120,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 3000000).toISOString(),
            progress: 100,
            documentId: 'doc-1',
            documentTitle: 'Introduction to React'
          },
          {
            id: 'job-2',
            quizId: quizId || 'quiz-2',
            status: 'PROCESSING',
            message: 'Generating questions from document chunks...',
            estimatedTimeSeconds: 180,
            createdAt: new Date(Date.now() - 600000).toISOString(),
            updatedAt: new Date(Date.now() - 300000).toISOString(),
            progress: 65,
            documentId: 'doc-2',
            documentTitle: 'Advanced JavaScript Concepts'
          },
          {
            id: 'job-3',
            quizId: quizId || 'quiz-3',
            status: 'PENDING',
            message: 'Waiting in queue...',
            estimatedTimeSeconds: 90,
            createdAt: new Date(Date.now() - 120000).toISOString(),
            updatedAt: new Date(Date.now() - 120000).toISOString(),
            progress: 0,
            documentId: 'doc-3',
            documentTitle: 'TypeScript Fundamentals'
          },
          {
            id: 'job-4',
            quizId: quizId || 'quiz-4',
            status: 'FAILED',
            message: 'Failed to process document: Invalid format',
            estimatedTimeSeconds: 60,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            updatedAt: new Date(Date.now() - 6900000).toISOString(),
            progress: 0,
            documentId: 'doc-4',
            documentTitle: 'Corrupted Document'
          }
        ];

        setJobs(mockJobs);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        setError(axiosError.response?.data?.message || 'Failed to load generation jobs');
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();
  }, [quizId]);

  // Helper function to get status color

  // Helper function to get status icon
  const getStatusIcon = (status: GenerationStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'PROCESSING':
        return <ArrowPathIcon className="w-5 h-5 animate-spin" />;
      case 'PENDING':
        return <ClockIcon className="w-5 h-5" />;
      case 'FAILED':
        return <ExclamationCircleIcon className="w-5 h-5" />;
      case 'CANCELLED':
        return <XCircleIcon className="w-5 h-5" />;
      default:
        return <ExclamationCircleIcon className="w-5 h-5" />;
    }
  };

  // Helper function to format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Handle job actions
  const handleCancelJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to cancel this generation job?')) return;

    try {
      // TODO: Implement actual API call
      // await cancelQuizGeneration(jobId);
      
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'CANCELLED' as GenerationStatus, message: 'Job cancelled by user' }
          : job
      ));
    } catch (error) {
      console.error('Failed to cancel job:', error);
      alert('Failed to cancel job. Please try again.');
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      // TODO: Implement actual API call
      // await retryQuizGeneration(jobId);
      
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'PENDING' as GenerationStatus, message: 'Job queued for retry' }
          : job
      ));
    } catch (error) {
      console.error('Failed to retry job:', error);
      alert('Failed to retry job. Please try again.');
    }
  };

  const handleViewDetails = (job: GenerationJob) => {
    setSelectedJob(job);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <div className={`bg-theme-bg-primary shadow-theme rounded-lg border border-theme-border-primary ${className}`}>
        <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary">
          <div className="flex items-center">
            <BoltIcon className="w-5 h-5 text-theme-text-tertiary mr-2" />
            <h3 className="text-lg font-medium text-theme-text-primary">Generation Jobs</h3>
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse flex items-center space-x-4">
                <div className="w-8 h-8 bg-theme-bg-tertiary rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-theme-bg-tertiary rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-theme-bg-tertiary rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-theme-bg-tertiary rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-theme-bg-primary shadow-theme rounded-lg border border-theme-border-primary ${className}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BoltIcon className="w-5 h-5 text-theme-text-tertiary mr-2" />
              <h3 className="text-lg font-medium text-theme-text-primary">Generation Jobs</h3>
            </div>
            <span className="text-sm text-theme-text-tertiary">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Jobs List */}
        <div className="px-6 py-4">
          {error ? (
            <div className="text-center py-8">
              <p className="text-theme-interactive-danger">{error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <BoltIcon className="mx-auto h-12 w-12 text-theme-text-tertiary" />
              <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No generation jobs</h3>
              <p className="mt-1 text-sm text-theme-text-tertiary">
                Start generating quizzes from documents to see jobs here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border border-theme-border-primary rounded-lg p-4 hover:bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getStatusIcon(job.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-theme-text-primary truncate">
                            {job.documentTitle || `Job ${job.id}`}
                          </p>
                          <Badge variant={getGenerationStatusVariant(job.status)} size="sm">
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-theme-text-tertiary mt-1">{job.message}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-theme-text-tertiary">
                          <span>Created: {formatDate(job.createdAt)}</span>
                          <span>Est. time: {formatTime(job.estimatedTimeSeconds)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Progress Bar for Processing Jobs */}
                      {job.status === 'PROCESSING' && job.progress !== undefined && (
                        <div className="w-20 bg-theme-bg-tertiary rounded-full h-2 mr-2">
                          <div
                            className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(job)}
                          title="View Details"
                          className="!p-1 !min-w-0"
                          leftIcon={<EyeIcon className="w-4 h-4" />}
                        />

                        {job.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelJob(job.id)}
                            title="Cancel Job"
                            className="!p-1 !min-w-0 hover:!text-theme-interactive-danger"
                            leftIcon={<XMarkIcon className="w-4 h-4" />}
                          />
                        )}

                        {job.status === 'FAILED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetryJob(job.id)}
                            title="Retry Job"
                            className="!p-1 !min-w-0 hover:!text-theme-interactive-success"
                            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      {showDetails && selectedJob && (
        <div className="fixed inset-0 bg-theme-bg-overlay bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-theme-bg-primary">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-theme-text-primary">Job Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                  leftIcon={<XMarkIcon className="w-6 h-6" />}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-theme-text-primary">Job Information</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-theme-text-tertiary">Job ID</p>
                      <p className="font-medium">{selectedJob.id}</p>
                    </div>
                    <div>
                      <p className="text-theme-text-tertiary">Status</p>
                      <Badge variant={getGenerationStatusVariant(selectedJob.status)} size="sm">
                        {selectedJob.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-theme-text-tertiary">Document</p>
                      <p className="font-medium">{selectedJob.documentTitle || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-theme-text-tertiary">Estimated Time</p>
                      <p className="font-medium">{formatTime(selectedJob.estimatedTimeSeconds)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-theme-text-primary">Timeline</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-theme-text-tertiary">Created</span>
                      <span>{formatDate(selectedJob.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-text-tertiary">Last Updated</span>
                      <span>{formatDate(selectedJob.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-theme-text-primary">Message</h4>
                  <p className="mt-2 text-sm text-theme-text-secondary">{selectedJob.message}</p>
                </div>

                {selectedJob.progress !== undefined && (
                  <div>
                    <h4 className="text-sm font-medium text-theme-text-primary">Progress</h4>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-theme-text-secondary mb-1">
                        <span>Completion</span>
                        <span>{selectedJob.progress}%</span>
                      </div>
                      <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
                        <div
                          className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedJob.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuizGenerationJobs; 