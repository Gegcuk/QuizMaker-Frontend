// src/pages/QuizResultsSummaryPage.tsx
// ---------------------------------------------------------------------------
// Aggregated statistics for a single quiz.
// Route: /quizzes/:quizId/results-summary   (wrapped by <ProtectedRoute />)
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Spinner, Button, Alert } from '@/components';
import { getQuizResults } from '@/services';

import type { QuizResultSummaryDto } from '@/types';

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
        const results = await getQuizResults(quizId);
        setResults(results);
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
      <div className="max-w-4xl mx-auto py-8 text-center space-y-4">
        <Alert type="error">
          Quiz ID is missing from URL.
        </Alert>
        <Button
          variant="secondary"
          onClick={() => navigate('/my-quizzes')}
        >
          Back to My Quizzes
        </Button>
      </div>
    );
  }

  if (loading) return <Spinner />;

  if (error)
    return (
      <div className="max-w-4xl mx-auto py-8 text-center space-y-4">
        <Alert type="error">
          {error}
        </Alert>
        <Button
          variant="secondary"
          onClick={() => navigate(0)}
        >
          Retry
        </Button>
      </div>
    );

  if (!results)
    return (
      <div className="max-w-4xl mx-auto py-8 text-center space-y-4">
        <p className="text-theme-text-secondary">No results available for this quiz yet.</p>
        <Button
          variant="secondary"
          onClick={() => navigate('/my-quizzes')}
        >
          Back to My Quizzes
        </Button>
      </div>
    );

  /* ------------------------- happy path ----------------------------- */
  // Calculate total number of questions from questionStats
  const totalQuestions = results.questionStats?.length || 0;

  // Calculate percentages from raw scores
  // Backend returns:
  // - averageScore: total sum of correct answers across all attempts (need to divide by attemptsCount to get average per attempt)
  // - bestScore: best number of correct answers in a single attempt
  // - worstScore: worst number of correct answers in a single attempt
  // For averageScore: (totalCorrect / attemptsCount) / totalQuestions * 100
  // For bestScore/worstScore: correctAnswers / totalQuestions * 100
  const calculateAveragePercentage = (totalCorrect: number): number => {
    if (totalQuestions === 0 || results.attemptsCount === 0) return 0;
    const averageCorrectPerAttempt = totalCorrect / results.attemptsCount;
    return (averageCorrectPerAttempt / totalQuestions) * 100;
  };

  const calculateSingleAttemptPercentage = (correctAnswers: number): number => {
    if (totalQuestions === 0) return 0;
    return (correctAnswers / totalQuestions) * 100;
  };

  const averageScorePercentage = calculateAveragePercentage(results.averageScore);
  const bestScorePercentage = calculateSingleAttemptPercentage(results.bestScore);
  const worstScorePercentage = calculateSingleAttemptPercentage(results.worstScore);

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
            <strong>Average Score:</strong> {averageScorePercentage.toFixed(1)}%
          </p>
          <p>
            <strong>Best Score:</strong> {bestScorePercentage.toFixed(1)}%
          </p>
          <p>
            <strong>Worst Score:</strong> {worstScorePercentage.toFixed(1)}%
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
              <tr className="bg-theme-bg-tertiary">
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
      <div className="flex justify-center">
        <Button
          variant="secondary"
          onClick={() => navigate('/my-quizzes')}
        >
          Back to My Quizzes
        </Button>
      </div>
    </div>
  );
};

export default QuizResultsSummaryPage;
