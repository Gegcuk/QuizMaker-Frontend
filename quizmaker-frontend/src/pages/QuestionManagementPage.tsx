import React, { useEffect, useState, useCallback } from 'react';
import { Spinner, Button, Modal } from '../components/ui';
import { PageContainer } from '../components/layout';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { QuestionDto, QuestionType, QuestionService } from '../features/question';
import api from '../api/axiosInstance';
import {
  QuestionRenderer,
  QuestionTypeSelector,
  McqQuestionEditor,
  TrueFalseEditor,
  OpenQuestionEditor,
  FillGapEditor,
  ComplianceEditor,
  OrderingEditor,
  HotspotEditor,
  QuestionForm,
} from '../features/question';

const QuestionManagementPage: React.FC = () => {
  const questionService = new QuestionService(api);
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editing, setEditing] = useState<QuestionDto | null>(null);
  const [selectedType, setSelectedType] = useState<QuestionType>('TRUE_FALSE');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form state for different question types
  const [questionText, setQuestionText] = useState<string>('');
  const [difficulty, setDifficulty] = useState<QuestionDto['difficulty']>('EASY');
  const [hint, setHint] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');

  // Content state for question editors
  const [content, setContent] = useState<any>({});



  const handleContentChange = useCallback((newContent: any) => {
    setContent(newContent);
  }, []);

  const handleTypeChange = useCallback((newType: QuestionType) => {
    setSelectedType(newType);
    
    // Initialize content for the new type
    switch (newType) {
      case 'TRUE_FALSE':
        setContent({ answer: true });
        break;
      case 'OPEN':
        setContent({ answer: '' });
        break;
      case 'MCQ_SINGLE':
      case 'MCQ_MULTI':
        setContent({ options: [
          { id: 'a', text: '', correct: false },
          { id: 'b', text: '', correct: false },
          { id: 'c', text: '', correct: false },
          { id: 'd', text: '', correct: false }
        ]});
        break;
      case 'FILL_GAP':
        setContent({ text: '', gaps: [] });
        break;
      case 'COMPLIANCE':
        setContent({ statements: [] });
        break;
      case 'ORDERING':
        setContent({ items: [] });
        break;
      case 'HOTSPOT':
        setContent({ imageUrl: '', regions: [] });
        break;
      default:
        setContent({});
    }
  }, []);

  const handleFormSubmit = () => {
    handleSubmit(content);
  };

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await questionService.getQuestions({ pageNumber: page, size: 20 });
      setQuestions(response.content || []);
      setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch questions.');
      setQuestions([]); // Ensure questions is always an array
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const openCreate = () => {
    setEditing(null);
    setQuestionText('');
    setSelectedType('TRUE_FALSE');
    setDifficulty('EASY');
    setHint('');
    setExplanation('');
    setContent({ answer: true }); // Initialize with TRUE_FALSE content
    setFormError(null);
    setShowForm(true);
    setPreviewMode(false);
  };

  const openEdit = (q: QuestionDto) => {
    setEditing(q);
    setQuestionText(q.questionText);
    setSelectedType(q.type);
    setDifficulty(q.difficulty);
    setHint(q.hint || '');
    setExplanation(q.explanation || '');
    setContent(q.content); // Set the existing content
    setFormError(null);
    setShowForm(true);
    setPreviewMode(false);
  };

  const handleSubmit = useCallback(async (content: any) => {
    setFormError(null);
    setFormSubmitting(true);

    if (questionText.trim().length < 3 || questionText.trim().length > 1000) {
      setFormError('Question text must be between 3 and 1000 characters.');
      setFormSubmitting(false);
      return;
    }

    const payload = {
      type: selectedType,
      difficulty,
      questionText: questionText.trim(),
      content,
      hint: hint.trim() || undefined,
      explanation: explanation.trim() || undefined,
    };

    try {
      if (editing) {
        await questionService.updateQuestion(editing.id, payload);
      } else {
        await questionService.createQuestion(payload);
      }
      setShowForm(false);
      await fetchQuestions();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save question.');
    } finally {
      setFormSubmitting(false);
    }
  }, [questionText, selectedType, difficulty, hint, explanation, editing, fetchQuestions]);

  const handleDelete = async (id: string) => {
    setQuestionToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;
    
    setIsDeleting(true);
    try {
      await questionService.deleteQuestion(questionToDelete);
      await fetchQuestions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete question.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setQuestionToDelete(null);
    }
  };

  const renderTypeSpecificEditor = () => {
    switch (selectedType) {
      case 'MCQ_SINGLE':
        return (
          <McqQuestionEditor
            content={content as any}
            onChange={handleContentChange}
            isMultiSelect={false}
          />
        );
      case 'MCQ_MULTI':
        return (
          <McqQuestionEditor
            content={content as any}
            onChange={handleContentChange}
            isMultiSelect={true}
          />
        );
      case 'TRUE_FALSE':
        return (
          <TrueFalseEditor
            content={content as any}
            onChange={handleContentChange}
          />
        );
      case 'OPEN':
        return (
          <OpenQuestionEditor
            content={content as any}
            onChange={handleContentChange}
          />
        );
      case 'FILL_GAP':
        return (
          <FillGapEditor
            content={content as any}
            onChange={handleContentChange}
          />
        );
      case 'COMPLIANCE':
        return (
          <ComplianceEditor
            content={content as any}
            onChange={handleContentChange}
          />
        );
      case 'ORDERING':
        return (
          <OrderingEditor
            content={content as any}
            onChange={handleContentChange}
          />
        );
      case 'HOTSPOT':
        return (
          <HotspotEditor
            content={content as any}
            onChange={handleContentChange}
          />
        );
      default:
        return (
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <p className="text-sm text-gray-600">Select a question type to continue.</p>
          </div>
        );
    }
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Questions', href: '/questions', current: true },
  ];

  return (
    <PageContainer
      title="Question Management"
      subtitle="Create, edit, and manage quiz questions"
      showBreadcrumb={true}
      actions={[
        {
          label: 'Create Question',
          type: 'create',
          variant: 'primary',
          onClick: openCreate
        }
      ]}
    >

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : (questions || []).length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No questions</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new question.</p>
            <div className="mt-6">
              <Button onClick={openCreate} variant="primary" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Question
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {(questions || []).map((question) => (
                <li key={question.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Question Preview */}
                        <div className="mb-4">
                          <QuestionRenderer
                            question={question}
                            showCorrectAnswer={false}
                            disabled={true}
                            className="border-0 shadow-none"
                          />
                        </div>
                        
                        {/* Question Metadata (no duplicate chips; renderer already shows type/difficulty) */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(question.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => openEdit(question)}
                          variant="secondary"
                          size="sm"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(question.id)}
                          variant="danger"
                          size="sm"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pagination */}
        {(questions || []).length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={page === 0}
                variant="secondary"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={page + 1 === totalPages}
                variant="secondary"
                size="sm"
                className="ml-3"
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{page + 1}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 0))}
                    disabled={page === 0}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                    disabled={page + 1 === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Question Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          title={editing ? 'Edit Question' : 'Create New Question'}
          size="2xl"
        >
          <QuestionForm
            questionId={editing ? editing.id : undefined}
            onSuccess={(res) => {
              fetchQuestions();
              if (!res?.keepOpen) {
                setShowForm(false);
                setEditing(null);
              }
            }}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            compact
          />
        </Modal>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setQuestionToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Question"
          message="Are you sure you want to delete this question? This action cannot be undone."
          confirmText="Delete Question"
          variant="danger"
          isLoading={isDeleting}
        />
    </PageContainer>
  );
};

export default QuestionManagementPage;
