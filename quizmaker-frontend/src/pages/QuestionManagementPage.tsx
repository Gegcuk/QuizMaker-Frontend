import React, { useEffect, useState } from 'react';
import Spinner from '../components/Spinner';
import { QuestionDto } from '../types/api';
import {
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../api/question.service';

const QuestionManagementPage: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editing, setEditing] = useState<QuestionDto | null>(null);
  const [text, setText] = useState<string>('');
  const [type, setType] = useState<QuestionDto['type']>('TRUE_FALSE');
  const [difficulty, setDifficulty] = useState<QuestionDto['difficulty']>('EASY');
  const [content, setContent] = useState<string>('{}');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getAllQuestions({ page, size: 20 });
      setQuestions(data.content);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openCreate = () => {
    setEditing(null);
    setText('');
    setType('TRUE_FALSE');
    setDifficulty('EASY');
    setContent('{}');
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (q: QuestionDto) => {
    setEditing(q);
    setText(q.questionText);
    setType(q.type);
    setDifficulty(q.difficulty);
    setContent(JSON.stringify(q.content, null, 2));
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    if (text.trim().length < 3 || text.trim().length > 1000) {
      setFormError('Question text must be between 3 and 1000 characters.');
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

    const payload = {
      type,
      difficulty,
      questionText: text.trim(),
      content: parsed,
    };

    try {
      if (editing) {
        await updateQuestion(editing.id, payload);
      } else {
        await createQuestion(payload);
      }
      setShowForm(false);
      await fetchQuestions();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save question.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteQuestion(id);
      await fetchQuestions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete question.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Manage Questions</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded">
          + New Question
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : questions.length === 0 ? (
        <p>No questions found.</p>
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
                <td className="border px-2 py-1 text-center space-x-2">
                  <button onClick={() => openEdit(q)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex justify-center items-center mt-4 space-x-4">
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

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">{editing ? 'Edit Question' : 'New Question'}</h3>
            {formError && <div className="text-red-500 mb-2">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="qText" className="block mb-1">
                  Question Text <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="qText"
                  required
                  minLength={3}
                  maxLength={1000}
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
                  {formSubmitting ? 'Saving...' : editing ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagementPage;