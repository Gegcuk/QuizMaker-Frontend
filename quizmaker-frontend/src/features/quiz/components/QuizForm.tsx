// src/components/QuizForm.tsx
// ---------------------------------------------------------------------------
// Main quiz creation/editing form based on CreateQuizRequest/UpdateQuizRequest
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon, QuestionMarkCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useNavigate, useParams } from 'react-router-dom';
import { CreateQuizRequest, UpdateQuizRequest, QuizDto, QuizStatus } from '@/types';
import { QuestionDifficulty } from '@/types';
import { QuestionService } from '@/services';
import { getQuizById, createQuiz, updateQuiz, updateQuizStatus, deleteQuiz } from '@/services';
import { api } from '@/services';
import { QuizManagementTab, QuizPreview, QuizPublishModal, QuizQuestionInline } from './';
import { Button, useToast, ConfirmationModal, Alert, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components';
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
  const questionService = new QuestionService(api);
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
  
  const [initialQuizData, setInitialQuizData] = useState<Partial<CreateQuizRequest | UpdateQuizRequest>>();
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [initialQuestionIds, setInitialQuestionIds] = useState<string[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<QuizDto | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingManagement, setIsSavingManagement] = useState(false);
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
            questionService.getQuestions({ quizId }).catch(() => ({ content: [] })) // Handle case where quiz has no questions
          ]);
          
          setCurrentQuiz(quiz);
          const loadedData = {
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
          };
          setQuizData(loadedData);
          setInitialQuizData(loadedData);
          
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

  // Check if form has unsaved changes
  const isDirty = React.useMemo(() => {
    if (!quizData || !initialQuizData) return false;
    return JSON.stringify(quizData) !== JSON.stringify(initialQuizData);
  }, [quizData, initialQuizData]);

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

  // Handle saving management/settings data only
  const handleSaveManagement = async () => {
    if (!quizId || !quizData) return;
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSavingManagement(true);
    try {
      await updateQuiz(quizId, quizData as UpdateQuizRequest);
      addToast({ type: 'success', message: 'Quiz settings saved.' });
      // Reset initial data to mark form as pristine after successful save
      setInitialQuizData({ ...quizData });
      setErrors({}); // Clear any errors
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to save changes.' });
    } finally {
      setIsSavingManagement(false);
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
            // TODO: Implement addQuestionToQuiz in QuizService
            // await addQuestionToQuiz(resultQuizId, questionId);
          } catch (error) {
            console.warn(`Failed to add question ${questionId} to quiz:`, error);
          }
        }

        for (const questionId of toRemove) {
          try {
            // TODO: Implement removeQuestionFromQuiz in QuizService
            // await removeQuestionFromQuiz(resultQuizId, questionId);
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
              // TODO: Implement addQuestionToQuiz in QuizService
              // await addQuestionToQuiz(resultQuizId, questionId);
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
          <div className="h-8 bg-theme-bg-tertiary rounded w-1/4"></div>
          <div className="h-4 bg-theme-bg-tertiary rounded w-1/2"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-theme-bg-tertiary rounded"></div>
              <div className="h-64 bg-theme-bg-tertiary rounded"></div>
            </div>
            <div className="h-96 bg-theme-bg-tertiary rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Error message */}
      {errors.general && (
        <Alert 
          type="error" 
          dismissible 
          onDismiss={() => setErrors({ ...errors, general: undefined })}
          className="mb-6"
        >
          {errors.general}
        </Alert>
      )}

      {/* Form content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg shadow-theme">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            {/* Tabs header attached to form content */}
            <div className="px-4 sm:px-6 lg:px-8 border-b border-theme-border-primary">
              <TabsList>
                <TabsTrigger value="management" icon={<Cog6ToothIcon className="w-4 h-4" />}>
                  Settings
                </TabsTrigger>
                <TabsTrigger value="questions" icon={<QuestionMarkCircleIcon className="w-4 h-4" />}>
                  Questions
                </TabsTrigger>
                <TabsTrigger value="preview" icon={<EyeIcon className="w-4 h-4" />}>
                  Preview
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <TabsContent value="management">
                <>
                  <QuizManagementTab
                    quizId={quizId}
                    quizData={quizData}
                    onDataChange={handleDataChange}
                    errors={errors as Record<string, string>}
                    isEditing={true}
                  />
                  {isEditing && (
                    <div className="flex justify-center space-x-4 pt-6">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleSaveManagement}
                        disabled={isSavingManagement || !isDirty}
                        loading={isSavingManagement}
                      >
                        {isSavingManagement ? 'Saving…' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowPublishModal(true)}
                      >
                        Manage Status
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Delete Quiz
                      </Button>
                    </div>
                  )}
                </>
              </TabsContent>

              <TabsContent value="questions">
                <div className="space-y-6">
                  <QuizQuestionInline
                    quizId={quizId || undefined}
                    questionIds={selectedQuestionIds}
                    onChange={handleQuestionsChange}
                    defaultDifficulty={(quizData.difficulty as QuestionDifficulty) || 'MEDIUM'}
                  />
                  
                  {/* Create Quiz Buttons for Questions Tab */}
                  <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-theme-text-primary">{isEditing ? 'Ready to Save Quiz?' : 'Ready to Create Quiz?'}</h4>
                        <p className="text-sm text-theme-text-secondary mt-1">
                          {selectedQuestionIds.length > 0 
                            ? `${selectedQuestionIds.length} questions selected` 
                            : 'No questions selected yet'}
                        </p>
                        <p className="text-xs text-theme-text-tertiary mt-2">
                          <strong>Draft:</strong> Save as draft for later editing • <strong>Publish:</strong> Make quiz available immediately
                        </p>
                        
                        {/* Validation Messages */}
                        {(!isQuizMetaValid() || !isReadyToPublish()) && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-theme-interactive-danger mb-2">Please complete the following:</p>
                            <ul className="text-sm text-theme-interactive-danger space-y-1">
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
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCreateQuiz('DRAFT')}
                          disabled={isSaving || !isQuizMetaValid()}
                          loading={isSaving}
                        >
                          {isEditing ? 'Save Draft' : 'Create Draft'}
                        </Button>

                        {/* Create & Publish Button */}
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleCreateQuiz('PUBLISHED')}
                          disabled={isSaving || !isReadyToPublish()}
                          loading={isSaving}
                        >
                          {isEditing ? 'Save & Publish' : 'Create & Publish'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview">
                <div className="space-y-6">
                  <QuizPreview
                    quizData={currentQuiz || quizData}
                  />
                  
                  {/* Create Quiz Buttons for Preview Tab */}
                  <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-theme-text-primary">{isEditing ? 'Ready to Save Quiz?' : 'Ready to Create Quiz?'}</h4>
                        <p className="text-sm text-theme-text-secondary mt-1">
                          Review your quiz details above and create when ready
                        </p>
                        <p className="text-xs text-theme-text-tertiary mt-2">
                          <strong>Draft:</strong> Save as draft for later editing • <strong>Publish:</strong> Make quiz available immediately
                        </p>
                        
                        {/* Validation Messages */}
                        {(!isQuizMetaValid() || !isReadyToPublish()) && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-theme-interactive-danger mb-2">Please complete the following:</p>
                            <ul className="text-sm text-theme-interactive-danger space-y-1">
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
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCreateQuiz('DRAFT')}
                          disabled={isSaving || !isQuizMetaValid()}
                          loading={isSaving}
                        >
                          {isEditing ? 'Save Draft' : 'Create Draft'}
                        </Button>

                        {/* Create & Publish Button */}
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleCreateQuiz('PUBLISHED')}
                          disabled={isSaving || !isReadyToPublish()}
                          loading={isSaving}
                        >
                          {isEditing ? 'Save & Publish' : 'Create & Publish'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
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
