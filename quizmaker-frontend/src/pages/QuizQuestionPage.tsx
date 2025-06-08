import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import {
  QuestionDto,
  QuizDto,
} from '../types/api';
import {
  getQuizById,
} from '../api/quiz.service';
import {
  getQuizQuestions,
  addQuestionToQuiz,
  removeQuestionFromQuiz,
  createQuestion,
  QuestionPayload,
  getAllQuestions,
} from '../api/question.service';

const QuizQuestionsPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [text, setText] = useState('');
  const [type, setType] = useState<QuestionDto['type']>('TRUE_FALSE');
  const [difficulty, setDifficulty] = useState<QuestionDto['difficulty']>('EASY');
  const [content, setContent] = useState('{}');
  const [formError, setFormError] = useState<string | null>(null);
  const [allQuestions, setAllQuestions] = useState<QuestionDto[]>([]);
  const [qPage, setQPage] = useState(0);
  const [qTotalPages, setQTotalPages] = useState(1);
  const [loadingAll, setLoadingAll] = useState(false);

  
  const loadData = async () => {
    if (!quizId) return;
    setLoading(true);
    setError(null);
    try {
      const [quizRes, qRes] = await Promise.all([
        getQuizById<QuizDto>(quizId),
        getQuizQuestions(quizId),
        getQuizQuestions(quizId).catch((e) => {
          if (e.response?.status === 404) return { data: { content: [] } };
          throw e;
        }),
      ]);
      setQuiz(quizRes.data);
      setQuestions(qRes.data.content);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [quizId]);

  const handleDelete = async (qid: string) => {
    if (!quizId) return;
    if (!window.confirm('Remove this question from the quiz?')) return;
    try {
      await removeQuestionFromQuiz(quizId, qid);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove question.');
    }
  };

  const openCreate = () => {
    setText('');
    setType('TRUE_FALSE');
    setDifficulty('EASY');
    setContent('{}');
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizId) return;
    setFormError(null);
    setFormSubmitting(true);

    if (text.trim().length < 3) {
      setFormError('Question text too short.');
      setFormSubmitting(false);
      return;
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(content || '{}');
    } catch {
      setFormError('Content must be valid JSON.');
      setFormSubmitting(false);
      return;
    }

    const payload: QuestionPayload = {
      type,
      difficulty,
      questionText: text.trim(),
      content: parsed,
      quizIds: [quizId],
    };

    try {
      await createQuestion(payload);
      setShowForm(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create question.');
    } finally {
      setFormSubmitting(false);
    }
  };

    const fetchAllQuestions = async () => {
    setLoadingAll(true);
    try {
      const { data } = await getAllQuestions({ page: qPage, size: 20 });
      setAllQuestions(data.content);
      setQTotalPages(data.totalPages);
    } catch {
      // ignore errors here
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    fetchAllQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qPage]);

  const handleAddExisting = async (qid: string) => {
    if (!quizId) return;
    try {
      await addQuestionToQuiz(quizId, qid);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add question.');
    }
  };

  if (loading) return <Spinner />;

  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-4">
        Manage Questions for {quiz?.title}
      </h2>
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={() => navigate('/quizzes')}
          className="px-4 py-2 border rounded"
        >
          Back to Quizzes
        </button>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          + New Question
        </button>
      </div>
      {questions.length === 0 ? (
        <p>No questions added yet.</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Text</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Difficulty</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id}>
                <td className="border px-2 py-1 max-w-xs truncate">{q.questionText}</td>
                <td className="border px-2 py-1">{q.type}</td>
                <td className="border px-2 py-1">{q.difficulty}</td>
                <td className="border px-2 py-1 text-center">
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 className="text-xl font-semibold mt-8 mb-2">Add Existing Question</h3>
      {loadingAll ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Text</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Difficulty</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allQuestions
                .filter((q) => !questions.find((qq) => qq.id === q.id))
                .map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="border px-2 py-1 max-w-xs truncate">{q.questionText}</td>
                    <td className="border px-2 py-1">{q.type}</td>
                    <td className="border px-2 py-1">{q.difficulty}</td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        onClick={() => handleAddExisting(q.id)}
                        className="text-indigo-600 hover:underline"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={() => setQPage((p) => Math.max(p - 1, 0))}
              disabled={qPage === 0}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {qPage + 1} of {qTotalPages}
            </span>
            <button
              onClick={() => setQPage((p) => Math.min(p + 1, qTotalPages - 1))}
              disabled={qPage + 1 === qTotalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">New Question</h3>
            {formError && <div className="text-red-500 mb-2">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="qText" className="block mb-1">
                  Question Text
                </label>
                <textarea
                  id="qText"
                  required
                  minLength={3}
                  className="w-full border px-3 py-2 rounded"
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label htmlFor="qType" className="block mb-1">Type</label>
                  <select
                    id="qType"
                    value={type}
                    onChange={(e) => setType(e.target.value as QuestionDto['type'])}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value="TRUE_FALSE">TRUE_FALSE</option>
                    <option value="MCQ_SINGLE">MCQ_SINGLE</option>
                    <option value="MCQ_MULTI">MCQ_MULTI</option>
                    <option value="OPEN">OPEN</option>
                    <option value="FILL_GAP">FILL_GAP</option>
                    <option value="COMPLIANCE">COMPLIANCE</option>
                    <option value="ORDERING">ORDERING</option>
                    <option value="HOTSPOT">HOTSPOT</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor="qDiff" className="block mb-1">Difficulty</label>
                  <select
                    id="qDiff"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as QuestionDto['difficulty'])}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="qContent" className="block mb-1">Content (JSON)</label>
                <textarea
                  id="qContent"
                  className="w-full border px-3 py-2 rounded font-mono"
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizQuestionsPage;
