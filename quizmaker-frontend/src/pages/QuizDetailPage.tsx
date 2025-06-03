// src/pages/QuizDetailPage.tsx
// ---------------------------------------------------------------------------
// Displays a single quiz with “Take”, “Edit”, “Delete” actions.
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

/* ---------------------------  Types  ------------------------------------ */
interface QuizDto {
  id: string;
  title: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedTime: number;
  timerEnabled: boolean;
  timerDuration: number;
  categoryId?: string;
  tagIds: string[];
}

/* --------------------------  Spinner  ----------------------------------- */
const Spinner: React.FC = () => (
  <div className="flex justify-center items-center py-20">
    <svg
      className="animate-spin h-8 w-8 text-indigo-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  </div>
);

/* -----------------------  Main component  ------------------------------- */
const QuizDetailPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* Fetch quiz on mount / when quizId changes */
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<QuizDto>(`/quizzes/${quizId}`);
        setQuiz(data);
      } catch {
        setError('Quiz not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  /* Delete handler */
  const handleDelete = async () => {
    if (!quizId) return;
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    setLoading(true);
    try {
      await api.delete(`/quizzes/${quizId}`);
      navigate('/quizzes', { replace: true });
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to delete quiz.');
      setLoading(false);
    }
  };

  /* -----------------------------  JSX  --------------------------------- */
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {loading && <Spinner />}

      {error && !loading && <p className="text-red-600">{error}</p>}

      {quiz && !loading && (
        <>
          {/* Title + description */}
          <h2 className="text-3xl font-bold mb-4">{quiz.title}</h2>
          {quiz.description && (
            <p className="text-gray-700 mb-4">{quiz.description}</p>
          )}

          {/* Metadata */}
          <p className="text-sm text-gray-500 mb-6">
            Visibility: {quiz.visibility} • Difficulty: {quiz.difficulty} •
            Estimated Time: {quiz.estimatedTime} min
            {quiz.timerEnabled && ` • Timer: ${quiz.timerDuration} min`}
          </p>

          {/* Actions */}
          <div className="flex space-x-2">
            <Link
              to={`/quizzes/${quiz.id}/attempt`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Take Quiz
            </Link>
            <Link
              to={`/quizzes/${quiz.id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default QuizDetailPage;
