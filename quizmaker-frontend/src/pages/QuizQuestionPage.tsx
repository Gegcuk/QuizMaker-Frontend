import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Button, Modal, Alert } from '../components/ui';
import { Breadcrumb, PageHeader } from '../components/layout';
import {
  QuestionDto,
  QuizDto,
} from '../types/api';
import { QuestionType } from '../types/question.types';
import {
  getQuizById,
} from '../api/quiz.service';
import {
  getQuizQuestions,
  addQuestionToQuiz,
  removeQuestionFromQuiz,
  createQuestion,
  getAllQuestions,
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

const QuizQuestionsPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [allQuestions, setAllQuestions] = useState<QuestionDto[]>([]);
  const [qPage, setQPage] = useState(0);
  const [qTotalPages, setQTotalPages] = useState(1);
  const [loadingAll, setLoadingAll] = useState(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Form state for question creation
  const [questionText, setQuestionText] = useState<string>('');
  const [selectedType, setSelectedType] = useState<QuestionType>('TRUE_FALSE');
  const [difficulty, setDifficulty] = useState<QuestionDto['difficulty']>('EASY');
  const [hint, setHint] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
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

  const loadData = async () => {
    if (!quizId) return;
    setLoading(true);
    setError(null);
    try {
      const [quizRes, qRes] = await Promise.all([
        getQuizById(quizId),
        getQuizQuestions(quizId),
        getQuizQuestions(quizId).catch((e) => {
          if (e.response?.status === 404) return { content: [] };
          throw e;
        }),
      ]);
      setQuiz(quizRes);
      setQuestions(qRes.content);
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
    setQuestionText('');
    setSelectedType('TRUE_FALSE');
    setDifficulty('EASY');
    setHint('');
    setExplanation('');
    setContent({ answer: true });
    setFormError(null);
    setShowForm(true);
    setPreviewMode(false);
  };

  const handleSubmit = async () => {
    if (!quizId) return;
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
      const newQuestion = await createQuestion(payload);
      await addQuestionToQuiz(quizId, newQuestion.questionId);
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create question.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const fetchAllQuestions = async () => {
    setLoadingAll(true);
    try {
      const response = await getAllQuestions({ pageNumber: qPage, size: 20 });
      setAllQuestions(response.content || []);
      setQTotalPages(response.pageable?.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to fetch all questions:', err);
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    fetchAllQuestions();
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
    { label: 'Home', path: '/' },
    { label: 'Quizzes', path: '/quizzes' },
    { label: quiz?.title || 'Quiz', path: `/quizzes/${quizId}` },
    { label: 'Questions', path: `/quizzes/${quizId}/questions`, isCurrent: true },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h2>
          <p className="text-gray-600 mb-4">The quiz you're looking for doesn't exist.</p>
          <Button variant="primary" onClick={() => navigate('/quizzes')}>
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb customItems={breadcrumbItems} />

        {/* Page Header */}
        <PageHeader
          title={`Questions - ${quiz.title}`}
          subtitle="Manage questions for this quiz"
          actions={[
            {
              label: 'Add Question',
              type: 'create',
              variant: 'primary',
              onClick: openCreate,
              icon: () => (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )
            }
          ]}
        />

        {/* Error Display */}
        {error && (
          <Alert type="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Current Questions */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Current Questions ({questions.length})</h3>
          </div>
          <div className="p-6">
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No questions</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding questions to this quiz.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <QuestionRenderer
                          question={question as QuestionDto & { createdAt: string; updatedAt: string }}
                          showCorrectAnswer={false}
                          disabled={true}
                          className="border-0 shadow-none"
                        />
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {question.type.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            question.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                            question.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {question.difficulty}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(question.id)}
                        className="ml-4"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Existing Questions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Add Existing Questions</h3>
          </div>
          <div className="p-6">
            {loadingAll ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-4">
                {allQuestions
                  .filter((q) => !questions.find((qq) => qq.id === q.id))
                  .map((q) => (
                    <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <QuestionRenderer
                            question={q as QuestionDto & { createdAt: string; updatedAt: string }}
                            showCorrectAnswer={false}
                            disabled={true}
                            className="border-0 shadow-none"
                          />
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {q.type.replace('_', ' ')}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              q.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                              q.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {q.difficulty}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddExisting(q.id)}
                          className="ml-4"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                
                {/* Pagination */}
                {qTotalPages > 1 && (
                  <div className="flex justify-center items-center space-x-4 mt-6">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setQPage((p) => Math.max(p - 1, 0))}
                      disabled={qPage === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {qPage + 1} of {qTotalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setQPage((p) => Math.min(p + 1, qTotalPages - 1))}
                      disabled={qPage + 1 === qTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Question Creation Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title={previewMode ? 'Preview Question' : 'Create New Question'}
          size="xl"
        >
          <div className="space-y-6">
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

            {/* Form Error */}
            {formError && (
              <Alert type="error" title="Error">
                {formError}
              </Alert>
            )}

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={formSubmitting || !questionText.trim()}
                  loading={formSubmitting}
                >
                  {formSubmitting ? 'Creating...' : 'Create Question'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default QuizQuestionsPage;
