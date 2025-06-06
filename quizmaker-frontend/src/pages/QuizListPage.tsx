// src/pages/QuizListPage.tsx
// ---------------------------------------------------------------------------
// Lists quizzes with pagination + public/private filter.
// Requires the user to be logged-in (route wrapped by <ProtectedRoute/>).
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

/* -----------------------------  Types  ---------------------------------- */
export interface QuizDto {
  id: string;
  title: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedTime: number;
}

interface PageQuizDto {
  content: QuizDto[];
  totalPages: number;
  number: number; // current page (zero-based)
}

type VisibilityFilter = 'ALL' | 'PUBLIC' | 'PRIVATE';

/* ---------------------------  Spinner  ---------------------------------- */
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

/* -------------------------  Main component  ----------------------------- */
const QuizListPage: React.FC = () => {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState<QuizDto[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>('ALL');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /* Fetch quizzes whenever page or filter changes */
  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number> = {
          page,
          size: 20,
        };
        if (visibilityFilter !== 'ALL') params.visibility = visibilityFilter;
        const { data } = await api.get<PageQuizDto>('/quizzes', { params });
        setQuizzes(data.content);
        setTotalPages(data.totalPages);
      } catch {
        setError('Failed to load quizzes.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [page, visibilityFilter]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ): void => {
    setPage(0); // reset to first page when filter changes
    setVisibilityFilter(e.target.value as VisibilityFilter);
  };

  /* -----------------------  Render helpers  --------------------------- */
  const truncate = (text = '', len = 100) =>
    text.length > len ? `${text.slice(0, len)}…` : text;

  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  /* ----------------------------  JSX  --------------------------------- */
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header --------------------------------------------------------- */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">All Quizzes</h1>
        <div className="space-x-2">
          <button
            onClick={() => navigate('/quizzes/create')}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Create Quiz
          </button>
          <button
            onClick={() => navigate('/questions')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Create Question
          </button>
        </div>
      </div>

      {/* Filter --------------------------------------------------------- */}
      <div className="mb-4">
        <label className="mr-2 font-medium">Visibility:</label>
        <select
          value={visibilityFilter}
          onChange={handleFilterChange}
          className="border px-2 py-1 rounded"
        >
          <option value="ALL">All</option>
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Private</option>
        </select>
      </div>

      {/* Content -------------------------------------------------------- */}
      {loading && <Spinner />}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <>
          {/* Quiz cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((q) => (
              <div
                key={q.id}
                className="border rounded p-4 hover:shadow transition"
              >
                <h3 className="font-semibold text-lg mb-1">{q.title}</h3>
                {q.description && (
                  <p className="text-sm mb-2 text-gray-700">
                    {truncate(q.description)}
                  </p>
                )}
                <p className="text-xs text-gray-500 mb-3">
                  {q.visibility} • {q.difficulty} • {q.estimatedTime} min
                </p>
                <div className="flex space-x-2">
                  <Link
                    to={`/quizzes/${q.id}`}
                    className="text-indigo-600 hover:underline text-sm"
                  >
                    View
                  </Link>
                  <Link
                    to={`/quizzes/${q.id}/attempt`}
                    className="text-indigo-600 hover:underline text-sm"
                  >
                    Take Quiz
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination ------------------------------------------------- */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!canPrev}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default QuizListPage;
