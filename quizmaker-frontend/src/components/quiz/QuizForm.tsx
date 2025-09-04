// src/components/QuizForm.tsx
// ---------------------------------------------------------------------------
// Main quiz creation/editing form based on CreateQuizRequest/UpdateQuizRequest
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreateQuizRequest, UpdateQuizRequest, QuizDto, QuizStatus } from '../../types/quiz.types';
import { QuestionDifficulty } from '../../types/question.types';
import { getQuizById, createQuiz, updateQuiz, updateQuizStatus, deleteQuiz } from '../../api/quiz.service';
import { addQuestionToQuiz, removeQuestionFromQuiz, getQuizQuestions } from '../../api/question.service';
import { QuizManagementTab, QuizPreview, QuizPublishModal, QuizQuestionInline } from './';
import ConfirmationModal from '../common/ConfirmationModal';
import { useToast } from '../ui';
import type { AxiosError } from 'axios';

interface QuizFormProps {
  className?: string;
  defaultTab?: 'management' | 'questions' | 'preview';
}

interface FormErrors {
  title?: string;
  description?: string;
  estimatedTime?: string;
  timerDuration?: string;
  general?: string;
  [key: string]: string | undefined;
}

const QuizForm: React.FC<QuizFormProps> = ({ className = '', defaultTab }) => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(quizId);
  const { addToast } = useToast();
  
  const [quizData, setQuizData] = useState<Partial<CreateQuizRequest | UpdateQuizRequest>>({
    title: '',
    description: '',
    visibility: 'PRIVATE',
    difficulty: 'MEDIUM',
    isRepetitionEnabled: false,
    timerEnabled: false,
    estimatedTime: 30,
    timerDuration: 30,
    categoryId: undefined,
    tagIds: []
  });
  
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [initialQuestionIds, setInitialQuestionIds] = useState<string[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<QuizDto | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [activeTab, setActiveTab] = useState<'management' | 'questions' | 'preview'>(defaultTab || 'management');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load existing quiz data if editing
  useEffect(() => {
    if (isEditing && quizId) {
      const loadQuiz = async () => {
        setIsLoading(true);
        try {
          const [quiz, questions] = await Promise.all([
            getQuizById(quizId),
            getQuizQuestions(quizId).catch(() => ({ content: [] })) // Handle case where quiz has no questions
          ]);
          
          setCurrentQuiz(quiz);
          setQuizData({
            title: quiz.title,
            description: quiz.description,
            visibility: quiz.visibility,
            difficulty: quiz.difficulty,
            isRepetitionEnabled: quiz.isRepetitionEnabled,
            timerEnabled: quiz.timerEnabled,
            estimatedTime: quiz.estimatedTime,
            timerDuration: quiz.timerDuration,
            categoryId: quiz.categoryId,
            tagIds: quiz.tagIds
          });
          
          // Set existing questions
          const existingIds = questions.content.map((q: any) => q.id);
          setSelectedQuestionIds(existingIds);
          setInitialQuestionIds(existingIds);
        } catch (error) {
          const axiosError = error as AxiosError<{ message?: string }>;
          const errorMessage = axiosError.response?.data?.message || 'Failed to load quiz';
          setErrors({ general: errorMessage });
        } finally {
          setIsLoading(false);
        }
      };

      loadQuiz();
    }
  }, [isEditing, quizId]);

  // Validation function
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!quizData.title?.trim()) {
      newErrors.title = 'Quiz title is required';
    } else if (quizData.title.trim().length < 3) {
      newErrors.title = 'Quiz title must be at least 3 characters';
    } else if (quizData.title.trim().length > 100) {
      newErrors.title = 'Quiz title must be no more than 100 characters';
    }

    if (quizData.description && quizData.description.trim().length > 1000) {
      newErrors.description = 'Description must be no more than 1000 characters';
    }

    if (!quizData.estimatedTime || quizData.estimatedTime < 1) {
      newErrors.estimatedTime = 'Estimated time must be at least 1 minute';
    } else if (quizData.estimatedTime > 180) {
      newErrors.estimatedTime = 'Estimated time must be no more than 180 minutes';
    }

    if (quizData.timerEnabled && (!quizData.timerDuration || quizData.timerDuration < 1)) {
      newErrors.timerDuration = 'Timer duration must be at least 1 minute when timer is enabled';
    } else if (quizData.timerEnabled && quizData.timerDuration && quizData.timerDuration > 180) {
      newErrors.timerDuration = 'Timer duration must be no more than 180 minutes';
    }

    return newErrors;
  };

  // Handle form data changes
  const handleDataChange = (newData: Partial<CreateQuizRequest | UpdateQuizRequest>) => {
    setQuizData(prev => ({ ...prev, ...newData }));
    
    // Clear errors for fields that are being updated
    const fieldsToClear = Object.keys(newData);
    if (fieldsToClear.length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        fieldsToClear.forEach(field => {
          if (newErrors[field]) {
            delete newErrors[field];
          }
        });
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    await handleCreateQuiz('DRAFT');
  };

  // Handle quiz creation with specific status
  const handleCreateQuiz = async (status: QuizStatus = 'DRAFT') => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      let resultQuizId: string;
      
      if (isEditing && quizId) {
        await updateQuiz(quizId, quizData as UpdateQuizRequest);
        resultQuizId = quizId;

        // Diff questions: add newly selected, remove deselected
        const toAdd = selectedQuestionIds.filter((id) => !initialQuestionIds.includes(id));
        const toRemove = initialQuestionIds.filter((id) => !selectedQuestionIds.includes(id));

        for (const questionId of toAdd) {
          try {
            await addQuestionToQuiz(resultQuizId, questionId);
          } catch (error) {
            console.warn(`Failed to add question ${questionId} to quiz:`, error);
          }
        }

        for (const questionId of toRemove) {
          try {
            await removeQuestionFromQuiz(resultQuizId, questionId);
          } catch (error) {
            console.warn(`Failed to remove question ${questionId} from quiz:`, error);
          }
        }
      } else {
        const result = await createQuiz(quizData as CreateQuizRequest);
        resultQuizId = result.quizId;

        // For new quizzes, attach all currently selected questions
        if (selectedQuestionIds.length > 0) {
          for (const questionId of selectedQuestionIds) {
            try {
              await addQuestionToQuiz(resultQuizId, questionId);
            } catch (error) {
              console.warn(`Failed to add question ${questionId} to quiz:`, error);
            }
          }
        }
      }

      // Update quiz status if creating new quiz
      if (!isEditing && status !== 'DRAFT') {
        await updateQuizStatus(resultQuizId, { status });
      }

      // Success toast
      if (isEditing) {
        addToast({ type: 'success', message: 'Quiz saved.' });
      } else {
        addToast({ type: 'success', message: status === 'PUBLISHED' ? 'Quiz created and published.' : 'Quiz draft created.' });
      }

      // Navigate to the quiz's edit page for new quizzes, or quiz list for existing ones
      if (isEditing) {
        navigate('/quizzes');
      } else {
        navigate(`/quizzes/${resultQuizId}/edit`);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to save quiz';
      setErrors({ general: errorMessage });
      addToast({ type: 'error', message: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (status: QuizStatus) => {
    if (!quizId) return;

    try {
      // Update quiz status on the backend
      const updatedQuiz = await updateQuizStatus(quizId, { status });
      
      // Update local state
      if (currentQuiz) {
        setCurrentQuiz(updatedQuiz);
      }
      
      // Navigate to quiz list after status change
      navigate('/quizzes');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to update quiz status';
      setErrors({ general: errorMessage });
    }
  };

  // Handle quiz deletion
  const handleDeleteQuiz = async () => {
    if (!quizId) return;
    setShowDeleteModal(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizId) return;

    setIsDeleting(true);
    try {
      await deleteQuiz(quizId);
      // Navigate to quiz list after successful deletion
      navigate('/quizzes');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to delete quiz';
      setErrors({ general: errorMessage });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Handle question changes
  const handleQuestionsChange = (questionIds: string[]) => {
    setSelectedQuestionIds(questionIds);
  };

  // Validation helpers
  const isQuizMetaValid = () => {
    const title = quizData.title?.trim() || '';
    const hasTitle = title.length >= 3 && title.length <= 100;
    const hasEstimatedTime = quizData.estimatedTime && quizData.estimatedTime >= 1 && quizData.estimatedTime <= 180;
    const hasTimerDuration = !quizData.timerEnabled || (quizData.timerDuration && quizData.timerDuration >= 1 && quizData.timerDuration <= 180);
    return hasTitle && hasEstimatedTime && hasTimerDuration;
  };

  const isReadyToPublish = () => isQuizMetaValid() && selectedQuestionIds.length > 0;

  const getMetaValidationMessages = () => {
    const messages: string[] = [];
    const title = quizData.title?.trim() || '';
    if (!title) {
      messages.push('Quiz title is required');
    } else if (title.length < 3) {
      messages.push('Quiz title must be at least 3 characters');
    } else if (title.length > 100) {
      messages.push('Quiz title must be no more than 100 characters');
    }

    if (!quizData.estimatedTime || quizData.estimatedTime < 1 || quizData.estimatedTime > 180) {
      messages.push('Estimated time is required (1-180 minutes)');
    }

    if (quizData.timerEnabled && (!quizData.timerDuration || quizData.timerDuration < 1 || quizData.timerDuration > 180)) {
      messages.push('Timer duration is required when timer is enabled (1-180 minutes)');
    }
    return messages;
  };

  const getPublishValidationMessages = () => {
    const messages: string[] = [];
    if (selectedQuestionIds.length === 0) {
      messages.push('At least one question must be selected');
    }
    return messages;
  };

  if (isLoading) {
    return (
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-300 rounded"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
            <div className="h-96 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'management', name: 'Management', icon: '⚙️', description: 'Basic info, settings, tags, and category' },
    { id: 'questions', name: 'Questions', icon: '❓', description: 'Add and manage quiz questions' },
    { id: 'preview', name: 'Preview', icon: '👁️', description: 'Preview your quiz' }
  ] as const;

  return (
    <div className={className}>
      {/* Error message */}
      {errors.general && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  title={tab.description}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
        {activeTab === 'management' && (
          <QuizManagementTab
            quizId={quizId}
            quizData={quizData}
            onDataChange={handleDataChange}
            errors={errors as Record<string, string>}
            isEditing={true}
          />
        )}

        {activeTab === 'questions' && (
          <div className="space-y-6">
            <QuizQuestionInline
              quizId={quizId || undefined}
              questionIds={selectedQuestionIds}
              onChange={handleQuestionsChange}
              defaultDifficulty={(quizData.difficulty as QuestionDifficulty) || 'MEDIUM'}
            />
            
            {/* Create Quiz Buttons for Questions Tab */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">{isEditing ? 'Ready to Save Quiz?' : 'Ready to Create Quiz?'}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedQuestionIds.length > 0 
                      ? `${selectedQuestionIds.length} questions selected` 
                      : 'No questions selected yet'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>Draft:</strong> Save as draft for later editing • <strong>Publish:</strong> Make quiz available immediately
                  </p>
                  
                  {/* Validation Messages */}
                  {(!isQuizMetaValid() || !isReadyToPublish()) && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-red-600 mb-2">Please complete the following:</p>
                      <ul className="text-sm text-red-600 space-y-1">
                        {(isQuizMetaValid() ? getPublishValidationMessages() : getMetaValidationMessages()).map((message, index) => (
                          <li key={index} className="flex items-center">
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="ml-6 flex space-x-3">
                  {/* Create Draft Button */}
                  <button
                    type="button"
                    onClick={() => handleCreateQuiz('DRAFT')}
                    disabled={isSaving || !isQuizMetaValid()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isEditing ? 'Saving...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {isEditing ? 'Save Draft' : 'Create Draft'}
                      </>
                    )}
                  </button>

                  {/* Create & Publish Button */}
                  <button
                    type="button"
                    onClick={() => handleCreateQuiz('PUBLISHED')}
                    disabled={isSaving || !isReadyToPublish()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isEditing ? 'Saving...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {isEditing ? 'Save & Publish' : 'Create & Publish'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-6">
            <QuizPreview
              quizData={currentQuiz || quizData}
            />
            
            {/* Create Quiz Buttons for Preview Tab */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">{isEditing ? 'Ready to Save Quiz?' : 'Ready to Create Quiz?'}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Review your quiz details above and create when ready
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>Draft:</strong> Save as draft for later editing • <strong>Publish:</strong> Make quiz available immediately
                  </p>
                  
                  {/* Validation Messages */}
                  {(!isQuizMetaValid() || !isReadyToPublish()) && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-red-600 mb-2">Please complete the following:</p>
                      <ul className="text-sm text-red-600 space-y-1">
                        {(isQuizMetaValid() ? getPublishValidationMessages() : getMetaValidationMessages()).map((message, index) => (
                          <li key={index} className="flex items-center">
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="ml-6 flex space-x-3">
                  {/* Create Draft Button */}
                  <button
                    type="button"
                    onClick={() => handleCreateQuiz('DRAFT')}
                    disabled={isSaving || !isQuizMetaValid()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isEditing ? 'Saving...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {isEditing ? 'Save Draft' : 'Create Draft'}
                      </>
                    )}
                  </button>

                  {/* Create & Publish Button */}
                  <button
                    type="button"
                    onClick={() => handleCreateQuiz('PUBLISHED')}
                    disabled={isSaving || !isReadyToPublish()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isEditing ? 'Saving...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {isEditing ? 'Save & Publish' : 'Create & Publish'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons for Editing Existing Quizzes */}
        {isEditing && currentQuiz && (
          <div className="flex justify-center space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setShowPublishModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Manage Status
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Quiz
            </button>
          </div>
        )}

          </div>
        </div>
      </form>

      {/* Publish modal */}
      {currentQuiz && (
        <QuizPublishModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onConfirm={handleStatusChange}
          quiz={currentQuiz}
        />
      )}

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteQuiz}
        title="Delete Quiz"
        message={`Are you sure you want to delete "${currentQuiz?.title}"? This action cannot be undone.`}
        confirmText="Delete Quiz"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default QuizForm; 
