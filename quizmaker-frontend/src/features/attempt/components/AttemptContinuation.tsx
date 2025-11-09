// src/components/attempt/AttemptContinuation.tsx
// ---------------------------------------------------------------------------
// Component for handling paused and in-progress attempts
// Detects existing attempts and provides options to resume or start fresh
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AttemptService } from '@/services';
import { QuizService, api } from '@/services';
import { AttemptDto, AttemptStatsDto, QuizDto } from '@/types';
import { Spinner, Button } from '@/components';
import AttemptCard, { AttemptWithDetails } from './AttemptCard';

interface AttemptContinuationProps {
  quizId: string;
  quizTitle?: string;
  onAttemptResumed?: (attemptId: string) => void;
  onNewAttempt?: () => void;
  className?: string;
}

const AttemptContinuation: React.FC<AttemptContinuationProps> = ({
  quizId,
  quizTitle = 'Quiz',
  onAttemptResumed,
  onNewAttempt,
  className = ''
}) => {
  const navigate = useNavigate();
  const [existingAttempts, setExistingAttempts] = useState<AttemptWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumingAttempt, setResumingAttempt] = useState<string | null>(null);

  const attemptService = new AttemptService(api);
  const quizService = new QuizService(api);

  // Load existing attempts
  useEffect(() => {
    const loadExistingAttempts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get attempts for this quiz
        const response = await attemptService.getAttempts({ quizId });
        
        // Filter for resumable attempts (PAUSED or IN_PROGRESS)
        const resumableAttempts = response.content.filter(
          attempt => attempt.status === 'PAUSED' || attempt.status === 'IN_PROGRESS'
        );

        // Get additional details for each attempt
        const attemptsWithDetails = await Promise.all(
          resumableAttempts.map(async (attempt) => {
            try {
              const [stats, quiz] = await Promise.all([
                attemptService.getAttemptStats(attempt.attemptId),
                quizService.getQuizById(attempt.quizId)
              ]);
              return {
                ...attempt,
                stats,
                quiz
              };
            } catch (error) {
              console.warn(`Could not fetch details for attempt ${attempt.attemptId}:`, error);
              return {
                ...attempt,
                stats: undefined,
                quiz: undefined
              };
            }
          })
        );

        setExistingAttempts(attemptsWithDetails);
      } catch (error) {
        console.error('Failed to load existing attempts:', error);
        setError('Failed to load existing attempts. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingAttempts();
  }, [quizId]);

  const handleResumeAttempt = async (attempt: AttemptWithDetails) => {
    setResumingAttempt(attempt.attemptId);
    
    try {
      // Resume the attempt if it's paused
      if (attempt.status === 'PAUSED') {
        await attemptService.resumeAttempt(attempt.attemptId);
      }
      
      // Call the callback if provided
      if (onAttemptResumed) {
        onAttemptResumed(attempt.attemptId);
      }

      // Navigate to the attempt page
      navigate(`/quizzes/${quizId}/attempt?attemptId=${attempt.attemptId}`);
    } catch (error) {
      console.error('Failed to resume attempt:', error);
      setError('Failed to resume attempt. Please try again.');
    } finally {
      setResumingAttempt(null);
    }
  };

  const handleStartFresh = () => {
    if (onNewAttempt) {
      onNewAttempt();
    } else {
      // Navigate to attempt start page
      navigate(`/quizzes/${quizId}/attempt/start`);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-theme-bg-primary rounded-lg shadow-theme p-6 ${className}`}>
        <div className="flex justify-center items-center py-8">
          <Spinner size="lg" />
          <span className="ml-3 text-theme-text-secondary">Checking for existing attempts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-theme-bg-primary rounded-lg shadow-theme p-6 ${className}`}>
        <div className="bg-theme-bg-tertiary border border-theme-border-primary rounded-md p-4 bg-theme-bg-primary text-theme-text-primary">
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
      </div>
    );
  }

  if (existingAttempts.length === 0) {
    return (
      <div className={`bg-theme-bg-primary rounded-lg shadow-theme p-6 ${className}`}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No existing attempts</h3>
          <p className="mt-1 text-sm text-theme-text-tertiary">
            You don't have any paused or in-progress attempts for this quiz.
          </p>
          <div className="mt-6">
            <button
              onClick={handleStartFresh}
              className="px-4 py-2 bg-theme-interactive-primary text-theme-bg-primary font-medium rounded-md hover:bg-theme-interactive-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2"
            >
              Start New Attempt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-theme-bg-primary rounded-lg shadow-md p-6 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-theme-text-primary mb-2">
          Continue {quizTitle}
        </h2>
        <p className="text-theme-text-secondary">
          You have existing attempts that can be resumed
        </p>
      </div>

      {/* Existing Attempts */}
      <div className="space-y-4 mb-6">
        {existingAttempts.map((attempt) => (
          <AttemptCard
            key={attempt.attemptId}
            attempt={attempt}
            onResume={handleResumeAttempt}
            isResuming={resumingAttempt === attempt.attemptId}
            showActions={true}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-theme-bg-primary text-theme-text-tertiary">Or</span>
        </div>
      </div>

      {/* Start Fresh Option */}
      <div className="text-center">
        <p className="text-sm text-theme-text-secondary mb-4">
          Want to start a completely new attempt?
        </p>
        <button
          onClick={handleStartFresh}
          className="px-6 py-2 bg-theme-bg-tertiary text-theme-text-secondary font-medium rounded-md hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-theme-border-primary focus:ring-offset-2 transition-colors"
        >
          Start Fresh Attempt
        </button>
      </div>

      {/* Important Notes */}
      <div className="mt-6 p-4 bg-theme-bg-info border border-theme-border-info rounded-lg">
        <h4 className="text-sm font-medium text-theme-text-primary mb-2">Important Notes</h4>
        <ul className="text-sm text-theme-interactive-primary space-y-1">
          <li>• Resuming will continue from where you left off</li>
          <li>• Your previous answers are saved</li>
          <li>• Starting fresh will create a new attempt</li>
          <li>• You can have multiple attempts for the same quiz</li>
        </ul>
      </div>
    </div>
  );
};

export default AttemptContinuation; 
