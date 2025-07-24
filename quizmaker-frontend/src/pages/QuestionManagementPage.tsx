import React, { useEffect, useState, useCallback } from 'react';
import { Spinner } from '../components/ui';
import { Breadcrumb, PageHeader } from '../components/layout';
import { QuestionDto, QuestionType } from '../types/question.types';
import {
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../api/question.service';
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
} from '../components/question';

const QuestionManagementPage: React.FC = () => {
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
      const response = await getAllQuestions({ pageNumber: page, size: 20 });
      setQuestions(response.content || []);
      setTotalPages(response.pageable?.totalPages || 1);
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
  }, [questionText, selectedType, difficulty, hint, explanation, editing, fetchQuestions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteQuestion(id);
      await fetchQuestions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete question.');
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb />
        
        <PageHeader
          title="Question Management"
          subtitle="Create, edit, and manage quiz questions"
          actions={[
            {
              label: 'Create Question',
              type: 'create',
              variant: 'primary',
              onClick: openCreate
            }
          ]}
        />

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
              <button
                onClick={openCreate}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Question
              </button>
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
                        
                        {/* Question Metadata */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {question.type.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              question.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                              question.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {question.difficulty}
                            </span>
                          </div>
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
                        <button
                          onClick={() => openEdit(question)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(question.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
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
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={page === 0}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={page + 1 === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
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
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editing ? 'Edit Question' : 'Create New Question'}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {previewMode ? 'Edit' : 'Preview'}
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {previewMode ? (
                  <div className="space-y-4">
                                         <div className="mb-4">
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Question Type
                       </label>
                       <QuestionTypeSelector
                         selectedType={selectedType}
                         onTypeChange={handleTypeChange}
                       />
                     </div>
                    
                    {/* Preview the question */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                      <QuestionRenderer
                                                 question={{
                           id: 'preview',
                           type: selectedType,
                           difficulty,
                           questionText,
                           content: (selectedType === 'TRUE_FALSE' ? { answer: true } :
                                   selectedType === 'OPEN' ? { answer: '' } :
                                   selectedType === 'MCQ_SINGLE' || selectedType === 'MCQ_MULTI' ? { options: [] } :
                                   selectedType === 'FILL_GAP' ? { text: '', gaps: [] } :
                                   selectedType === 'COMPLIANCE' ? { statements: [] } :
                                   selectedType === 'ORDERING' ? { items: [] } :
                                   selectedType === 'HOTSPOT' ? { imageUrl: '', regions: [] } : {}) as any,
                           hint,
                           explanation,
                           quizIds: [],
                           tagIds: [],
                           createdAt: new Date().toISOString(),
                           updatedAt: new Date().toISOString(),
                         }}
                        showCorrectAnswer={false}
                        disabled={true}
                      />
                    </div>
                  </div>
                                  ) : (
                    <div className="space-y-6">
                      {/* Question Type Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question Type
                        </label>
                        <QuestionTypeSelector
                          selectedType={selectedType}
                          onTypeChange={handleTypeChange}
                        />
                      </div>

                      {/* Question Text */}
                      <div>
                        <label htmlFor="questionText" className="block text-sm font-medium text-gray-700 mb-2">
                          Question Text <span className="text-red-600">*</span>
                        </label>
                        <textarea
                          id="questionText"
                          required
                          minLength={3}
                          maxLength={1000}
                          className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          rows={4}
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          placeholder="Enter your question here..."
                        />
                      </div>

                      {/* Difficulty */}
                      <div>
                        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                          Difficulty
                        </label>
                        <select
                          id="difficulty"
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as QuestionDto['difficulty'])}
                          className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="EASY">Easy</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                      </div>

                      {/* Hint */}
                      <div>
                        <label htmlFor="hint" className="block text-sm font-medium text-gray-700 mb-2">
                          Hint (Optional)
                        </label>
                        <textarea
                          id="hint"
                          maxLength={500}
                          className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          rows={2}
                          value={hint}
                          onChange={(e) => setHint(e.target.value)}
                          placeholder="Provide a hint for students..."
                        />
                      </div>

                      {/* Explanation */}
                      <div>
                        <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-2">
                          Explanation (Optional)
                        </label>
                        <textarea
                          id="explanation"
                          maxLength={2000}
                          className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          rows={3}
                          value={explanation}
                          onChange={(e) => setExplanation(e.target.value)}
                          placeholder="Provide an explanation for the correct answer..."
                        />
                      </div>
                      
                      {/* Question Type Specific Content Editor */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {selectedType.replace('_', ' ')} Content
                        </label>
                        {renderTypeSpecificEditor()}
                      </div>
                    </div>
                  )}
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={formSubmitting || !questionText.trim()}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editing ? 'Save Changes' : 'Create Question'}
                </button>
              </div>

              {/* Form Error */}
              {formError && (
                <div className="text-red-600 text-sm mt-2">{formError}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionManagementPage;