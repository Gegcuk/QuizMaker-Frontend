// src/components/attempt/UserAttempts.tsx
// ---------------------------------------------------------------------------
// Component to display user's attempts that can be resumed
// Shows paused and in-progress attempts with ability to continue them
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AttemptService } from '../../api/attempt.service';
import { QuizService } from '../../api/quiz.service';
import { AttemptDto, AttemptStatsDto } from '../../types/attempt.types';
import { QuizDto } from '../../types/quiz.types';
import api from '../../api/axiosInstance';
import { Spinner } from '../ui';

interface UserAttemptsProps {
  className?: string;
}

interface AttemptWithStats extends AttemptDto {
  stats?: AttemptStatsDto;
  quizTitle?: string;
  quiz?: QuizDto;
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
              console.warn(`Could not fetch data for attempt ${attempt.attemptId}:`, error);
              return {
                ...attempt,
                stats: undefined,
                quiz: undefined
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
      // Resume the attempt
      await attemptService.resumeAttempt(attempt.attemptId);
      
      // Navigate to the quiz attempt page using the quizId from the attempt
      navigate(`/quizzes/${attempt.quizId}/attempt`);
    } catch (error) {
      console.error('Failed to resume attempt:', error);
      alert('Failed to resume attempt. Please try again.');
    } finally {
      setResumingAttempt(null);
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
        return 'bg-blue-100 text-blue-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'PAUSED':
        return 'Paused';
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
      <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
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
    );
  }

  if (attempts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No active attempts</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have any paused or in-progress quiz attempts.
        </p>
      </div>
    );
  }

  // Get attempts to display (based on displayedCount)
  const displayedAttempts = attempts.slice(0, displayedCount);
  const hasMoreAttempts = attempts.length > displayedCount;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Continue Attempts</h3>
        <span className="text-sm text-gray-500">
          {hasMoreAttempts 
            ? `Showing ${displayedCount} of ${attempts.length} attempts`
            : `${attempts.length} attempt${attempts.length !== 1 ? 's' : ''} available`
          }
        </span>
      </div>

      <div className="grid gap-4">
        {displayedAttempts.map((attempt) => (
          <div
            key={attempt.attemptId}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(attempt.status)}`}>
                    {getStatusText(attempt.status)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {getModeText(attempt.mode)}
                  </span>
                </div>

                <div className="space-y-1">
                  {attempt.quiz && (
                    <h4 className="font-medium text-gray-900">
                      {attempt.quiz.title}
                    </h4>
                  )}
                  <p className="text-sm text-gray-600">
                    Started: {formatDate(attempt.startedAt)}
                  </p>
                  
                  {attempt.stats && (
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>
                        {attempt.stats.questionsAnswered} questions answered
                      </span>
                      <span>
                        {attempt.stats.correctAnswers} correct
                      </span>
                      <span>
                        {Math.round(attempt.stats.completionPercentage)}% complete
                      </span>
                    </div>
                  )}

                  {attempt.stats && attempt.stats.completionPercentage > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${attempt.stats.completionPercentage}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => handleResumeAttempt(attempt)}
                  disabled={resumingAttempt === attempt.attemptId}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resumingAttempt === attempt.attemptId ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Resuming...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Continue
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {hasMoreAttempts && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setDisplayedCount(prev => Math.min(prev + 5, attempts.length))}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Show 5 More
          </button>
        </div>
      )}
    </div>
  );
};

export default UserAttempts; 