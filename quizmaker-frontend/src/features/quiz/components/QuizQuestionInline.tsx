// src/components/quiz/QuizQuestionInline.tsx
// ---------------------------------------------------------------------------
// Inline questions manager for a specific quiz (or a new quiz draft).
// - Lists only the quiz's questions
// - Add/Edit via modal reusing QuestionForm
// - Remove association (or from local selection for new quiz)
// ---------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from 'react';
import { QuestionDto, QuestionDifficulty } from '@/types';
import { QuestionService, QuizService } from '@/services';
import { Button, Modal, Spinner, Alert, useToast, Badge, ConfirmationModal } from '@/components';
import { QuestionForm } from '@/features/question';
import { api } from '@/services';
import { PencilSquareIcon, TrashIcon, PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

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
  const quizService = new QuizService(api);
  const { addToast } = useToast();
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [working, setWorking] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  const isEditingExistingQuiz = Boolean(quizId);
  // Pagination state for existing quiz questions
  const [qPage, setQPage] = useState<number>(0);
  const [qSize, setQSize] = useState<number>(20);
  const [qTotalPages, setQTotalPages] = useState<number>(1);
  const [qTotalElements, setQTotalElements] = useState<number>(0);
  const [showAll, setShowAll] = useState<boolean>(true);

  // Format question text for FILL_GAP questions - replace {N} with underscores
  const formatQuestionText = (questionText: string, questionType: string): string => {
    if (questionType === 'FILL_GAP') {
      // Replace {1}, {2}, {3}, etc. with ______
      return questionText.replace(/\{\d+\}/g, '___');
    }
    return questionText;
  };

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

  const handleRemove = (id: string) => {
    setQuestionToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmRemove = async () => {
    if (!questionToDelete) return;
    
    setWorking(true);
    setError(null);
    setShowDeleteModal(false);
    
    try {
      if (quizId) {
        // Call backend API to remove question from quiz
        await quizService.removeQuestionFromQuiz(quizId, questionToDelete);
      }
      const updatedIds = questionIds.filter((qid) => qid !== questionToDelete);
      onChange(updatedIds);
      setQuestions((prev) => prev.filter((q) => q.id !== questionToDelete));
      addToast({ type: 'success', message: 'Question removed from quiz.' });
    } catch (e: any) {
      setError(e?.message || 'Failed to remove question');
      addToast({ type: 'error', message: 'Failed to remove question.' });
    } finally {
      setWorking(false);
      setQuestionToDelete(null);
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
        <h3 className="text-lg font-medium text-theme-text-primary">
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
      <div className="bg-theme-bg-primary shadow-theme rounded-lg border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-theme-text-tertiary" />
            <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No questions yet</h3>
            <p className="mt-1 text-sm text-theme-text-tertiary">Get started by adding your first question.</p>
            <div className="mt-6">
              <Button type="button" variant="primary" onClick={openCreate} disabled={working}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-theme-border-primary">
            {questions.map((q) => {
              const text = formatQuestionText(q.questionText || '', q.type);
              const truncated = text.length > 160 ? text.slice(0, 160) + '…' : text;
              const typeLabel = (q.type || '').replace(/_/g, ' ');
              return (
                <div key={q.id} className="p-3 group hover:bg-theme-bg-secondary transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm text-theme-text-primary group-hover:text-theme-interactive-primary-hover" title={text}>{truncated}</p>
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
                        className="p-2 text-theme-interactive-danger hover:text-theme-interactive-danger"
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setQuestionToDelete(null);
        }}
        onConfirm={confirmRemove}
        title="Remove Question"
        message="Are you sure you want to remove this question from the quiz? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default QuizQuestionInline;
