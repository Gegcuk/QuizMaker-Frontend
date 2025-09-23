// src/components/attempt/UserAttempts.tsx
// ---------------------------------------------------------------------------
// Component to display user's attempts that can be resumed
// Shows paused and in-progress attempts with ability to continue them
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth';
import { AttemptService } from '@/services';
import { Badge } from '@/components';
import { QuizService, api } from '@/services';
import { AttemptDto, AttemptStatsDto, CurrentQuestionDto, QuizDto } from '@/types';
import { Spinner, ConfirmationModal, Button } from '@/components';

interface UserAttemptsProps {
  className?: string;
}

interface AttemptWithStats extends AttemptDto {
  stats?: AttemptStatsDto;
  quizTitle?: string;
  quiz?: QuizDto;
  currentQuestion?: CurrentQuestionDto;
}

const UserAttempts: React.FC<UserAttemptsProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const attemptService = new AttemptService(api);
  const quizService = new QuizService(api);

  const [attempts, setAttempts] = useState<AttemptWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumingAttempt, setResumingAttempt] = useState<string | null>(null);
  const [deletingAttempt, setDeletingAttempt] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attemptToDelete, setAttemptToDelete] = useState<AttemptWithStats | null>(null);
  const [displayedCount, setDisplayedCount] = useState(3);

  // Load user attempts
  useEffect(() => {
    const loadAttempts = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get all attempts for the current user
        const response = await attemptService.getAttempts({
          userId: user.id,
          page: 0,
          size: 50
        });

        // Filter for resumable attempts (PAUSED or IN_PROGRESS)
        const resumableAttempts = response.content.filter(
          attempt => attempt.status === 'PAUSED' || attempt.status === 'IN_PROGRESS'
        );

        // Get stats and quiz info for each attempt
        const attemptsWithStats = await Promise.all(
          resumableAttempts.map(async (attempt) => {
            try {
              const [stats, quiz, currentQuestion] = await Promise.all([
                attemptService.getAttemptStats(attempt.attemptId),
                quizService.getQuizById(attempt.quizId),
                attemptService.getCurrentQuestion(attempt.attemptId).catch(() => undefined)
              ]);
              return {
                ...attempt,
                stats,
                quiz,
                currentQuestion
              };
            } catch (error) {
              console.warn(`Could not fetch data for attempt ${attempt.attemptId}:`, error);
              return {
                ...attempt,
                stats: undefined,
                quiz: undefined,
                currentQuestion: undefined
              };
            }
          })
        );

        setAttempts(attemptsWithStats);
      } catch (error) {
        console.error('Failed to load attempts:', error);
        setError('Failed to load your attempts. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAttempts();
  }, [user?.id]);

  const handleResumeAttempt = async (attempt: AttemptWithStats) => {
    setResumingAttempt(attempt.attemptId);
    
    try {
      console.log(`Resuming attempt ${attempt.attemptId} with status: ${attempt.status}`);
      
      if (attempt.status === 'PAUSED') {
        // Resume the paused attempt first
        console.log('Attempt is paused, calling resume API...');
        await attemptService.resumeAttempt(attempt.attemptId);
        console.log('Attempt resumed successfully');
      } else {
        console.log('Attempt is in progress, navigating directly...');
      }
      
      // For both PAUSED and IN_PROGRESS, navigate to the quiz attempt page
      // Pass the attempt ID as a query parameter so the quiz page can resume properly
      const navigateUrl = `/quizzes/${attempt.quizId}/attempt?attemptId=${attempt.attemptId}`;
      console.log(`Navigating to: ${navigateUrl}`);
      navigate(navigateUrl);
    } catch (error) {
      console.error('Failed to resume attempt:', error);
      alert('Failed to resume attempt. Please try again.');
    } finally {
      setResumingAttempt(null);
    }
  };

  const handleDeleteAttempt = async (attempt: AttemptWithStats) => {
    setAttemptToDelete(attempt);
    setShowDeleteModal(true);
  };

  const confirmDeleteAttempt = async () => {
    if (!attemptToDelete) return;

    setDeletingAttempt(attemptToDelete.attemptId);
    try {
      await attemptService.deleteAttempt(attemptToDelete.attemptId);
      setAttempts(attempts.filter(attempt => attempt.attemptId !== attemptToDelete.attemptId));
    } catch (error) {
      console.error('Failed to delete attempt:', error);
      alert('Failed to delete attempt. Please try again.');
    } finally {
      setDeletingAttempt(null);
      setAttemptToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'primary';
      case 'PAUSED':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'ABANDONED':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'PAUSED':
        return 'Paused';
      case 'COMPLETED':
        return 'Completed';
      case 'ABANDONED':
        return 'Abandoned';
      default:
        return status;
    }
  };

  const getModeText = (mode: string) => {
    switch (mode) {
      case 'ONE_BY_ONE':
        return 'One by One';
      case 'ALL_AT_ONCE':
        return 'All at Once';
      case 'TIMED':
        return 'Timed';
      default:
        return mode;
    }
  };

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-theme-bg-danger border border-theme-border-danger rounded-md p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-theme-interactive-danger" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-theme-interactive-danger">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Get attempts to display (based on displayedCount)
  const displayedAttempts = attempts.slice(0, displayedCount);
  const hasMoreAttempts = attempts.length > displayedCount;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Resumable Attempts Section */}
      {attempts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-theme-text-primary">Active Attempts</h3>
            <span className="text-sm text-theme-text-secondary">
              {hasMoreAttempts 
                ? `Showing ${displayedAttempts.length} of ${attempts.length} attempts`
                : `${attempts.length} attempt${attempts.length !== 1 ? 's' : ''} available`
              }
            </span>
          </div>

          <div className="grid gap-4">
            {displayedAttempts.map((attempt) => (
              <div
                key={attempt.attemptId}
                className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-4 hover:shadow-md transition-shadow bg-theme-bg-primary text-theme-text-primary"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge variant={getStatusColor(attempt.status)} size="sm">
                        {getStatusText(attempt.status)}
                      </Badge>
                      <span className="text-sm text-theme-text-tertiary">
                        {getModeText(attempt.mode)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {attempt.quiz && (
                        <h4 className="font-medium text-theme-text-primary">
                          {attempt.quiz.title}
                        </h4>
                      )}
                      <p className="text-sm text-theme-text-secondary">
                        Started: {formatDate(attempt.startedAt)}
                      </p>
                      


                                             {attempt.currentQuestion && (
                         <div className="flex items-center space-x-4 text-sm text-theme-text-secondary">
                           <span className="font-medium text-theme-interactive-primary">
                             Current: Question {attempt.currentQuestion.questionNumber} of {attempt.currentQuestion.totalQuestions}
                           </span>
                         </div>
                       )}

                      {attempt.stats && attempt.stats.completionPercentage > 0 && (
                        <div className="w-full bg-theme-bg-tertiary rounded-full h-2 mt-2">
                          <div
                            className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${attempt.stats.completionPercentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex-shrink-0">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResumeAttempt(attempt)}
                        disabled={resumingAttempt === attempt.attemptId}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-theme-text-inverse bg-theme-interactive-primary hover:bg-theme-interactive-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resumingAttempt === attempt.attemptId ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            {attempt.status === 'PAUSED' ? 'Resuming...' : 'Loading...'}
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {attempt.status === 'PAUSED' ? 'Resume' : 'Continue'}
                          </>
                        )}
                      </button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteAttempt(attempt)}
                        disabled={deletingAttempt === attempt.attemptId}
                        loading={deletingAttempt === attempt.attemptId}
                        leftIcon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasMoreAttempts && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setDisplayedCount(prev => prev + 3)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-theme-interactive-primary bg-theme-bg-primary border border-theme-border-primary rounded-md hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary transition-colors bg-theme-bg-primary text-theme-text-primary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Show 3 More
              </button>
            </div>
          )}
          
          {displayedCount > 3 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setDisplayedCount(3)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-theme-text-secondary bg-theme-bg-primary border border-theme-border-primary rounded-md hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-border-primary transition-colors bg-theme-bg-primary text-theme-text-primary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Hide
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {attempts.length === 0 && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No active attempts</h3>
          <p className="mt-1 text-sm text-theme-text-secondary">
            You don't have any paused or in-progress quiz attempts.
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAttemptToDelete(null);
        }}
        onConfirm={confirmDeleteAttempt}
        title="Delete Attempt"
        message={`Are you sure you want to delete your attempt for "${attemptToDelete?.quiz?.title || 'this quiz'}"? This action cannot be undone.`}
        confirmText="Delete Attempt"
        variant="danger"
        isLoading={deletingAttempt !== null}
      />
    </div>
  );
};

export default UserAttempts; 
