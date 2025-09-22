// src/pages/QuizAttemptFlowPage.tsx
// ---------------------------------------------------------------------------
// Quiz attempt flow page - handles the complete attempt lifecycle
// Checks for existing attempts, starts new attempts, and manages different modes
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { QuizService } from '../api/quiz.service';
import { QuizDto } from '@/types';
import api from '../api/axiosInstance';
import { Spinner } from '../components/ui';
import { AttemptContinuation, AttemptStart } from '../features/attempt';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading quiz details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Quiz not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The quiz you're looking for doesn't exist or you don't have access to it.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/quizzes')}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Browse Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Quiz Header */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
                {quiz.description && (
                  <p className="mt-2 text-gray-600">{quiz.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  <div>Difficulty: <span className="font-medium text-gray-900">{quiz.difficulty}</span></div>
                  <div>Estimated Time: <span className="font-medium text-gray-900">{quiz.estimatedTime} min</span></div>
                  {quiz.timerEnabled && quiz.timerDuration && (
                    <div>Timer: <span className="font-medium text-gray-900">{quiz.timerDuration} min</span></div>
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
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            ← Back to Quiz Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizAttemptFlowPage; 