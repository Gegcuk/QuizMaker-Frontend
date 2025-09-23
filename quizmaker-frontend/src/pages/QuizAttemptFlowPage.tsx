// src/pages/QuizAttemptFlowPage.tsx
// ---------------------------------------------------------------------------
// Quiz attempt flow page - handles the complete attempt lifecycle
// Checks for existing attempts, starts new attempts, and manages different modes
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { QuizService, api } from '@/services';
import { QuizDto } from '@/types';
import { Spinner } from '@/components';
import { AttemptContinuation, AttemptStart } from '@/features/attempt';

type AttemptFlowStep = 'checking' | 'continuation' | 'start' | 'attempting';

const QuizAttemptFlowPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quizService = new QuizService(api);
  
  const [currentStep, setCurrentStep] = useState<AttemptFlowStep>('checking');
  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load quiz details
  useEffect(() => {
    const loadQuizDetails = async () => {
      if (!quizId) return;

      try {
        setLoading(true);
        const quizData = await quizService.getQuizById(quizId);
        setQuiz(quizData);
        
        // Check if we're coming from a direct attempt link
        const attemptId = searchParams.get('attemptId');
        if (attemptId) {
          // Go directly to attempt
          setCurrentStep('attempting');
          navigate(`/quizzes/${quizId}/attempt?attemptId=${attemptId}`, { replace: true });
        } else {
          // Check for existing attempts
          setCurrentStep('continuation');
        }
      } catch (error) {
        console.error('Failed to load quiz details:', error);
        setError('Failed to load quiz details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadQuizDetails();
  }, [quizId, searchParams]);

  const handleAttemptResumed = (attemptId: string) => {
    // Navigate to attempt page
    navigate(`/quizzes/${quizId}/attempt?attemptId=${attemptId}`);
  };

  const handleNewAttempt = () => {
    setCurrentStep('start');
  };

  const handleAttemptStarted = (attemptId: string) => {
    // Navigate to attempt page
    navigate(`/quizzes/${quizId}/attempt?attemptId=${attemptId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg-secondary flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-theme-text-secondary">Loading quiz details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-theme-bg-secondary flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-theme-bg-danger border border-theme-border-danger rounded-lg p-6">
            <svg className="mx-auto h-12 w-12 text-theme-interactive-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-theme-interactive-danger">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-theme-bg-danger text-red-700 font-medium rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-theme-interactive-danger focus:ring-offset-2"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-theme-bg-secondary flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-theme-text-primary">Quiz not found</h3>
          <p className="mt-1 text-sm text-theme-text-tertiary">
            The quiz you're looking for doesn't exist or you don't have access to it.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/quizzes')}
              className="px-4 py-2 bg-theme-interactive-primary text-white font-medium rounded-md hover:bg-theme-interactive-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2"
            >
              Browse Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg-secondary py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Quiz Header */}
        <div className="mb-8">
          <div className="bg-theme-bg-primary rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-theme-text-primary">{quiz.title}</h1>
                {quiz.description && (
                  <p className="mt-2 text-theme-text-secondary">{quiz.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-theme-text-tertiary">
                  <div>Difficulty: <span className="font-medium text-theme-text-primary">{quiz.difficulty}</span></div>
                  <div>Estimated Time: <span className="font-medium text-theme-text-primary">{quiz.estimatedTime} min</span></div>
                  {quiz.timerEnabled && quiz.timerDuration && (
                    <div>Timer: <span className="font-medium text-theme-text-primary">{quiz.timerDuration} min</span></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flow Content */}
        <div className="flex justify-center">
          {currentStep === 'continuation' && (
            <AttemptContinuation
              quizId={quizId!}
              quizTitle={quiz.title}
              onAttemptResumed={handleAttemptResumed}
              onNewAttempt={handleNewAttempt}
              className="w-full max-w-2xl"
            />
          )}

          {currentStep === 'start' && (
            <AttemptStart
              quizId={quizId!}
              quizTitle={quiz.title}
              onAttemptStarted={handleAttemptStarted}
              className="w-full max-w-2xl"
            />
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate(`/quizzes/${quizId}`)}
            className="px-4 py-2 bg-theme-bg-tertiary text-theme-text-secondary font-medium rounded-md hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            ← Back to Quiz Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizAttemptFlowPage; 