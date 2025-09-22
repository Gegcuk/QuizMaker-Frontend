// src/components/quiz/QuizQuestionInline.tsx
// ---------------------------------------------------------------------------
// Inline questions manager for a specific quiz (or a new quiz draft).
// - Lists only the quiz's questions
// - Add/Edit via modal reusing QuestionForm
// - Remove association (or from local selection for new quiz)
// ---------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from 'react';
import { QuestionDto, QuestionDifficulty } from '@/types';
import { QuestionService } from '@/services';
import { Button, Modal, Spinner, Alert, useToast, Badge } from '../ui';
import { QuestionForm } from '@/features/question';
import { api } from '@/services';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface QuizQuestionInlineProps {
  quizId?: string;
  questionIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
  defaultDifficulty?: QuestionDifficulty;
}

const QuizQuestionInline: React.FC<QuizQuestionInlineProps> = ({
  quizId,
  questionIds,
  onChange,
  className = '',
  defaultDifficulty,
}) => {
  const questionService = new QuestionService(api);
  const { addToast } = useToast();
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [working, setWorking] = useState<boolean>(false);

  const isEditingExistingQuiz = Boolean(quizId);
  // Pagination state for existing quiz questions
  const [qPage, setQPage] = useState<number>(0);
  const [qSize, setQSize] = useState<number>(20);
  const [qTotalPages, setQTotalPages] = useState<number>(1);
  const [qTotalElements, setQTotalElements] = useState<number>(0);
  const [showAll, setShowAll] = useState<boolean>(true);

  // Helpers
  const idsFromQuestions = useMemo(() => questions.map((q) => q.id), [questions]);

  const loadForExistingQuiz = async (id: string, page = 0, size = qSize) => {
    setLoading(true);
    setError(null);
    try {
      const res = await questionService.getQuestions({ quizId: id, pageNumber: page, size });
      const list = res?.content || [];
      setQuestions(list);
      setQTotalPages(res?.totalPages || 1);
      setQTotalElements(res?.totalElements || list.length);
      // Keep parent selection in sync with backend
      const serverIds = list.map((q) => q.id);
      if (serverIds.join(',') !== questionIds.join(',')) {
        onChange(serverIds);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load quiz questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllForExistingQuiz = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      let all: QuestionDto[] = [];
      let p = 0;
      const size = Math.max(qSize, 50);
      // Fetch until a page returns fewer than size items (or safety cap)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res = await questionService.getQuestions({ quizId: id, pageNumber: p, size });
        const batch = res?.content || [];
        all = all.concat(batch);
        if (!batch.length || batch.length < size || p > 200) break;
        p += 1;
      }
      setQuestions(all);
      setQTotalPages(p + 1);
      setQTotalElements(all.length);
      const serverIds = all.map((q) => q.id);
      if (serverIds.join(',') !== questionIds.join(',')) {
        onChange(serverIds);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load quiz questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadForNewQuiz = async (ids: string[]) => {
    if (!ids || ids.length === 0) {
      setQuestions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetched = await Promise.all(
        ids.map((id) => questionService.getQuestionById(id).catch(() => null))
      );
      setQuestions(fetched.filter(Boolean) as QuestionDto[]);
    } catch (e: any) {
      setError(e?.message || 'Failed to load selected questions');
    } finally {
      setLoading(false);
    }
  };

  // Initial and quizId changes
  useEffect(() => {
    if (quizId) {
      if (showAll) {
        loadAllForExistingQuiz(quizId);
      } else {
        loadForExistingQuiz(quizId, qPage, qSize);
      }
    } else {
      loadForNewQuiz(questionIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, qPage, qSize, showAll]);

  // No extra lookups needed for type/difficulty badges

  // Keep local questions in sync when parent selection changes in create mode
  useEffect(() => {
    if (!quizId) {
      loadForNewQuiz(questionIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIds.join(',')]);

  const openCreate = () => {
    setEditingQuestionId(null);
    setIsModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingQuestionId(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingQuestionId(null);
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('Remove this question from the quiz?')) return;
    setWorking(true);
    setError(null);
    try {
      if (quizId) {
        // TODO: Implement removeQuestionFromQuiz in QuizService
        // await removeQuestionFromQuiz(quizId, id);
      }
      const updatedIds = questionIds.filter((qid) => qid !== id);
      onChange(updatedIds);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      addToast({ type: 'success', message: 'Question removed from quiz.' });
    } catch (e: any) {
      setError(e?.message || 'Failed to remove question');
      addToast({ type: 'error', message: 'Failed to remove question.' });
    } finally {
      setWorking(false);
    }
  };

  const handleCreateSuccess = async (res?: { questionId?: string; keepOpen?: boolean }) => {
    const newId = res?.questionId;
    const keepOpen = Boolean(res?.keepOpen);
    try {
      if (!newId) {
        // Fallback: just reload from backend if we’re editing an existing quiz
        if (quizId) await loadForExistingQuiz(quizId);
        if (!keepOpen) closeModal();
        return;
      }
      if (quizId) {
        // TODO: Implement addQuestionToQuiz in QuizService
        // await addQuestionToQuiz(quizId, newId);
      }
      const q = await questionService.getQuestionById(newId);
      setQuestions((prev) => {
        const exists = prev.some((x) => x.id === q.id);
        return exists ? prev : [...prev, q];
      });
      const updatedIds = idsFromQuestions.includes(newId)
        ? questionIds
        : [...questionIds, newId];
      if (updatedIds.join(',') !== questionIds.join(',')) {
        onChange(updatedIds);
      }
      addToast({ type: 'success', message: 'Question added to quiz.' });
    } catch (e) {
      // Best-effort reload
      if (quizId) await loadForExistingQuiz(quizId);
      addToast({ type: 'error', message: 'Failed to add question to quiz.' });
    } finally {
      if (!keepOpen) closeModal();
    }
  };

  const handleEditSuccess = async () => {
    try {
      if (editingQuestionId) {
        const updated = await questionService.getQuestionById(editingQuestionId);
        setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      } else if (quizId) {
        await loadForExistingQuiz(quizId);
      }
      addToast({ type: 'success', message: 'Question updated.' });
    } finally {
      closeModal();
    }
  };

  return (
    <div className={className}>
      {/* Header and actions */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Current Questions ({questions.length})
        </h3>
        <div className="flex items-center space-x-2">
          <Button type="button" variant="primary" onClick={openCreate} disabled={working}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Question
          </Button>
          {/* Optional: Attach Existing can be added later */}
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error" title="Error">
            {error}
          </Alert>
        </div>
      )}

      {/* Content */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No questions yet</h3>
            <p className="mt-1 text-sm text-gray-500">Click "Add Question" to create one.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {questions.map((q) => {
              const text = q.questionText || '';
              const truncated = text.length > 160 ? text.slice(0, 160) + '…' : text;
              const typeLabel = (q.type || '').replace(/_/g, ' ');
              const diffClass = q.difficulty === 'EASY'
                ? 'bg-green-100 text-green-800'
                : q.difficulty === 'MEDIUM'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800';
              return (
                <div key={q.id} className="p-3 group hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm text-gray-900 group-hover:text-indigo-700" title={text}>{truncated}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      {/* Type and difficulty badges before actions (using shared Badge) */}
                      <span className="hidden sm:inline-flex">
                        <Badge variant="info" size="sm">{typeLabel}</Badge>
                      </span>
                      <span className="hidden sm:inline-flex">
                        <Badge
                          variant={q.difficulty === 'EASY' ? 'success' : q.difficulty === 'MEDIUM' ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {q.difficulty}
                        </Badge>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(q.id)}
                        title="Edit question"
                        className="p-2"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(q.id)}
                        title="Delete question"
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination/Toggle removed: always showing all questions for clarity */}

      {/* Modal for create/edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingQuestionId ? 'Edit Question' : 'Create New Question'}
        size="2xl"
      >
        <QuestionForm
          questionId={editingQuestionId || undefined}
          quizId={quizId}
          compact
          defaultDifficulty={defaultDifficulty}
          onSuccess={editingQuestionId ? () => handleEditSuccess() : handleCreateSuccess}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
};

export default QuizQuestionInline;
