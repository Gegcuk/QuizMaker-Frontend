// src/components/attempt/UserAttempts.tsx
// ---------------------------------------------------------------------------
// Component to display user's attempts that can be resumed
// Shows paused and in-progress attempts with ability to continue them
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth';
import { AttemptService } from '@/services';
import { QuizService, api } from '@/services';
import { AttemptDto, AttemptStatsDto, CurrentQuestionDto, QuizDto } from '@/types';
import { ConfirmationModal, Spinner } from '@/components';
import AttemptCard, { AttemptWithDetails } from './AttemptCard';

interface UserAttemptsProps {
  className?: string;
  onAttemptsLoaded?: (hasAttempts: boolean) => void;
}

const UserAttempts: React.FC<UserAttemptsProps> = ({ className = '', onAttemptsLoaded }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const attemptService = new AttemptService(api);
  const quizService = new QuizService(api);

  const [attempts, setAttempts] = useState<AttemptWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumingAttempt, setResumingAttempt] = useState<string | null>(null);
  const [deletingAttempt, setDeletingAttempt] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attemptToDelete, setAttemptToDelete] = useState<AttemptWithDetails | null>(null);
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

  // Notify parent component about attempts
  useEffect(() => {
    if (!isLoading && onAttemptsLoaded) {
      onAttemptsLoaded(attempts.length > 0);
    }
  }, [attempts.length, isLoading, onAttemptsLoaded]);

  const handleResumeAttempt = async (attempt: AttemptWithDetails) => {
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

  const handleDeleteAttempt = async (attempt: AttemptWithDetails) => {
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

  // Don't render anything if there are no attempts and not loading
  if (!isLoading && attempts.length === 0) {
    return null;
  }

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
              <AttemptCard
                key={attempt.attemptId}
                attempt={attempt}
                onResume={handleResumeAttempt}
                onDelete={handleDeleteAttempt}
                isResuming={resumingAttempt === attempt.attemptId}
                isDeleting={deletingAttempt === attempt.attemptId}
              />
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
