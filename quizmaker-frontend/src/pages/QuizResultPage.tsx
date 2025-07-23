// src/pages/QuizResultPage.tsx
// ---------------------------------------------------------------------------
// Displays the outcome of a completed quiz attempt.
// Route: /quizzes/:quizId/results?attemptId=<uuid>   (wrapped by ProtectedRoute)
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import {
  useParams,
  useSearchParams,
  Link,
  useNavigate,
} from 'react-router-dom';
import api from '../api/axiosInstance';
import { Spinner } from '../components/ui';
import type { AttemptResultDto } from '../types/api';

const QuizResultPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>(); // kept & used for “Back” URL
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const attemptId = searchParams.get('attemptId');
  const backUrl = quizId ? `/quizzes/${quizId}` : '/quizzes';

  const [results, setResults] = useState<AttemptResultDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /*  Fetch attempt results                                             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!attemptId) return;

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<AttemptResultDto>(
          `/attempts/${attemptId}`,
        );
        setResults(data);
      } catch (e: any) {
        setError(
          e?.response?.data?.error || 'Failed to fetch results. Please retry.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [attemptId]);

  /* ------------------------------------------------------------------ */
  /*  Early exits                                                       */
  /* ------------------------------------------------------------------ */
  if (!attemptId) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 text-center">
        <p className="text-red-600">No attempt ID provided.</p>
        <Link to={backUrl} className="text-indigo-600 hover:underline mt-4">
          ← Back to Quizzes
        </Link>
      </div>
    );
  }

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => navigate(0)}
          className="mt-4 text-indigo-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 text-center">
        <p>No results found.</p>
        <Link to={backUrl} className="text-indigo-600 hover:underline mt-4">
          ← Back to Quizzes
        </Link>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render results                                                    */
  /* ------------------------------------------------------------------ */
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-semibold mb-4">Quiz Results</h2>

      {/* Summary ------------------------------------------------------- */}
      <div className="border rounded p-4 mb-6 bg-gray-50">
        <p>
          Total Score:{' '}
          <span className="font-bold">
            {results.totalScore} / {results.totalQuestions}
          </span>
        </p>
        <p>
          Correct Answers:{' '}
          <span className="font-bold">{results.correctCount}</span>
        </p>
        <p>Started At: {new Date(results.startedAt).toLocaleString()}</p>
        <p>Completed At: {new Date(results.completedAt).toLocaleString()}</p>
      </div>

      {/* Breakdown ----------------------------------------------------- */}
      <div>
        <h3 className="text-xl font-semibold mb-3">Question Breakdown</h3>
        <ul className="space-y-4">
          {results.answers.map((ans) => (
            <li key={ans.answerId} className="border rounded p-4">
              <p className="font-medium">
                {ans.nextQuestion?.questionText || ans.questionId}
              </p>
              <p>
                Your answer was{' '}
                {ans.isCorrect ? (
                  <span className="text-green-600 font-bold">Correct</span>
                ) : (
                  <span className="text-red-600 font-bold">Incorrect</span>
                )}
              </p>
              <p>Score Awarded: {ans.score}</p>
              {ans.nextQuestion?.explanation && (
                <p className="mt-2 text-gray-700">
                  Explanation: {ans.nextQuestion.explanation}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Back ---------------------------------------------------------- */}
      <Link
        to={backUrl}
        className="inline-block mt-6 text-indigo-600 hover:underline"
      >
        ← Back to Quizzes
      </Link>
    </div>
  );
};

export default QuizResultPage;
