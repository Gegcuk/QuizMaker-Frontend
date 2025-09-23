// src/components/QuizGenerationJobs.tsx
// ---------------------------------------------------------------------------
// Manage AI generation jobs based on QUIZ_ENDPOINTS
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuizGenerationResponse, GenerationStatus } from '@/types';
import type { AxiosError } from 'axios';

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
  const getStatusVariant = (status: GenerationStatus): 'success' | 'primary' | 'warning' | 'danger' | 'neutral' => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PROCESSING':
        return 'primary';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'danger';
      case 'CANCELLED':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status: GenerationStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'PROCESSING':
        return (
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'PENDING':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'FAILED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'CANCELLED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
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
      <div className={`bg-white shadow rounded-lg border border-gray-200 ${className}`}>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Generation Jobs</h3>
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-300 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white shadow rounded-lg border border-gray-200 ${className}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">Generation Jobs</h3>
            </div>
            <span className="text-sm text-gray-500">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Jobs List */}
        <div className="px-6 py-4">
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No generation jobs</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start generating quizzes from documents to see jobs here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getStatusIcon(job.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {job.documentTitle || `Job ${job.id}`}
                          </p>
                          <Badge variant={getStatusVariant(job.status)} size="sm">
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{job.message}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                          <span>Created: {formatDate(job.createdAt)}</span>
                          <span>Est. time: {formatTime(job.estimatedTimeSeconds)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Progress Bar for Processing Jobs */}
                      {job.status === 'PROCESSING' && job.progress !== undefined && (
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleViewDetails(job)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {job.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancelJob(job.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Cancel Job"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}

                        {job.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetryJob(job.id)}
                            className="p-1 text-gray-400 hover:text-green-600"
                            title="Retry Job"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Job Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Job Information</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Job ID</p>
                      <p className="font-medium">{selectedJob.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <Badge variant={getStatusVariant(selectedJob.status)} size="sm">
                        {selectedJob.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-500">Document</p>
                      <p className="font-medium">{selectedJob.documentTitle || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Estimated Time</p>
                      <p className="font-medium">{formatTime(selectedJob.estimatedTimeSeconds)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Timeline</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created</span>
                      <span>{formatDate(selectedJob.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Updated</span>
                      <span>{formatDate(selectedJob.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Message</h4>
                  <p className="mt-2 text-sm text-gray-600">{selectedJob.message}</p>
                </div>

                {selectedJob.progress !== undefined && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Progress</h4>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Completion</span>
                        <span>{selectedJob.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedJob.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuizGenerationJobs; 