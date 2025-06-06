// ---------------------------------------------------------------------------
// Shows all quizzes **created by the logged-in user** with CRUD actions.
// Route: /my-quizzes   (wrapped by <ProtectedRoute />)
// ---------------------------------------------------------------------------

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

import type { QuizDto, PageQuizDto } from '../types/api';
import { getAllQuizzes, deleteQuiz } from '../api/quiz.service';

const MyQuizzesPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const navigate = useNavigate();

  /* ------------------------------- state ----------------------------- */
  const [myQuizzes, setMyQuizzes] = useState<QuizDto[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /* --------------------------- data fetching ------------------------- */
  const fetchPage = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    setError(null);

    try {
      // ⚠️  NO generic type arg needed; getAllQuizzes already returns AxiosResponse<PageQuizDto>
      const { data } = await getAllQuizzes({ page, size: 20 });

      // client-side filter by creatorId
      const mine = data.content.filter((q) => q.creatorId === currentUserId);

      setMyQuizzes(mine);
      setTotalPages(data.totalPages);
    } catch (e: any) {
      setError(
        e?.response?.data?.error ||
          'Failed to load your quizzes. Please retry.',
      );
    } finally {
      setLoading(false);
    }
  }, [page, currentUserId]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  /* ----------------------------- delete ------------------------------ */
  const handleDelete = async (quizId: string) => {
    if (!window.confirm('Delete this quiz?')) return;
    try {
      await deleteQuiz(quizId);
      fetchPage(); // refresh list
    } catch (e: any) {
      alert(
        e?.response?.data?.error ||
          'Could not delete quiz. Please try again later.',
      );
    }
  };

  /* ------------------------------ render ----------------------------- */
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* header + create button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">My Quizzes</h2>
        <Link
          to="/quizzes/create"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Create New Quiz
        </Link>
      </div>

      {/* main content */}
      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : myQuizzes.length === 0 ? (
        <p className="text-gray-500">You haven’t created any quizzes yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Visibility</th>
                <th className="p-2 text-left">Difficulty</th>
                <th className="p-2 text-left">Created At</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myQuizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">
                    <Link
                      to={`/quizzes/${quiz.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {quiz.title}
                    </Link>
                  </td>
                  <td className="border px-2 py-1">{quiz.visibility}</td>
                  <td className="border px-2 py-1">{quiz.difficulty}</td>
                  <td className="border px-2 py-1">
                    {new Date(quiz.createdAt).toLocaleString()}
                  </td>
                  <td className="border px-2 py-1 text-center space-x-3">
                    <button
                      onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <Link
                      to={`/quizzes/${quiz.id}/questions`}
                      className="text-indigo-600 hover:underline"
                    >
                      Manage Questions
                    </Link>
                    <button
                      onClick={() => handleDelete(quiz.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                    <Link
                      to={`/quizzes/${quiz.id}/results-summary`}
                      className="text-green-600 hover:underline"
                    >
                      View Results
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* pagination */}
      {myQuizzes.length > 0 && (
        <div className="flex justify-center items-center mt-6 space-x-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={page + 1 === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MyQuizzesPage;
