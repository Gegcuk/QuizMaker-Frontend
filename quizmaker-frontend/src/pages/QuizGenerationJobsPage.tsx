// ---------------------------------------------------------------------------
// Quiz Generation Jobs Management Page
// Route: /quizzes/:quizId/generation
// Dedicated page for managing AI quiz generation jobs
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { getQuizById } from '../api/quiz.service';
import { QuizDto } from '@/types';
import { Spinner } from '../components/ui';
import { QuizGenerationJobs } from '../components/quiz';
import { PageHeader } from '../components/layout';

const QuizGenerationJobsPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch quiz on mount
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      setLoading(true);
      setError(null);
      try {
        const quizData = await getQuizById(quizId);
        setQuiz(quizData);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Quiz not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  const handleBackToQuiz = () => {
    navigate(`/quizzes/${quizId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error || 'Quiz not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <PageHeader
        title="AI Quiz Generation Jobs"
        subtitle={`Manage AI generation jobs for "${quiz.title}"`}
        showBreadcrumb={true}
        showBackButton={true}
        backTo={`/quizzes/${quizId}`}
        actions={[
          {
            label: 'Back to Quiz',
            variant: 'secondary',
            onClick: handleBackToQuiz
          }
        ]}
      />

      {/* Generation Jobs Component */}
      <div className="mt-8">
        <QuizGenerationJobs quizId={quizId!} />
      </div>
    </div>
  );
};

export default QuizGenerationJobsPage; 