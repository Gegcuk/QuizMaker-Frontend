// src/pages/QuizResultsSummaryPage.tsx
// ---------------------------------------------------------------------------
// Aggregated statistics for a single quiz.
// Route: /quizzes/:quizId/results-summary   (wrapped by <ProtectedRoute />)
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Spinner from '../components/Spinner';
import { getQuizResults } from '../api/quiz.service';

import type { QuizResultSummaryDto } from '../types/api';

const QuizResultsSummaryPage: React.FC = () => {
  /* --------------------------- routing helpers ---------------------- */
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  /* ------------------------------- state ---------------------------- */
  const [results, setResults] = useState<QuizResultSummaryDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------- data fetch -------------------------- */
  useEffect(() => {
    if (!quizId) return;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getQuizResults(quizId);
        setResults(data);
      } catch (e: any) {
        setError(
          e?.response?.data?.error ||
            'Failed to load results. Please try again later.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [quizId]);

  /* --------------------------- render ------------------------------- */
  if (!quizId) {
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <p className="text-red-500">Quiz ID is missing from URL.</p>
        <button
          onClick={() => navigate('/quizzes')}
          className="mt-4 px-4 py-2 border rounded"
        >
          Back to All Quizzes
        </button>
      </div>
    );
  }

  if (loading) return <Spinner />;

  if (error)
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => navigate(0)}
          className="mt-4 px-4 py-2 border rounded"
        >
          Retry
        </button>
      </div>
    );

  if (!results)
    return (
      <div className="max-w-4xl mx-auto py-8 text-center">
        <p>No results available for this quiz yet.</p>
        <button
          onClick={() => navigate('/quizzes')}
          className="mt-4 px-4 py-2 border rounded"
        >
          Back to All Quizzes
        </button>
      </div>
    );

  /* ------------------------- happy path ----------------------------- */
  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-8">
      <h2 className="text-2xl font-semibold">Quiz Results Summary</h2>

      {/* summary card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4 shadow-sm">
          <p>
            <strong>Attempts Count:</strong> {results.attemptsCount}
          </p>
          <p>
            <strong>Average Score:</strong> {results.averageScore.toFixed(2)}
          </p>
          <p>
            <strong>Best Score:</strong> {results.bestScore}
          </p>
          <p>
            <strong>Worst Score:</strong> {results.worstScore}
          </p>
          <p>
            <strong>Pass Rate:</strong> {results.passRate.toFixed(1)}%
          </p>
        </div>
        {/* placeholder for future charts */}
      </div>

      {/* per-question stats */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Per-Question Stats</h3>
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Question ID</th>
                <th className="p-2">Times Asked</th>
                <th className="p-2">Times Correct</th>
                <th className="p-2">Correct Rate (%)</th>
              </tr>
            </thead>
            <tbody>
              {results.questionStats.map((qs) => (
                <tr key={qs.questionId}>
                  <td className="border px-2 py-1">{qs.questionId}</td>
                  <td className="border px-2 py-1">{qs.timesAsked}</td>
                  <td className="border px-2 py-1">{qs.timesCorrect}</td>
                  <td className="border px-2 py-1">
                    {(qs.correctRate * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* back button */}
      <button
        className="mt-4 px-4 py-2 border rounded"
        onClick={() => navigate('/quizzes')}
      >
        Back to All Quizzes
      </button>
    </div>
  );
};

export default QuizResultsSummaryPage;
