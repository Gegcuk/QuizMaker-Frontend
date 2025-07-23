// src/components/QuizForm.tsx
// ---------------------------------------------------------------------------
// Main quiz creation/editing form based on CreateQuizRequest/UpdateQuizRequest
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreateQuizRequest, UpdateQuizRequest, QuizDto, QuizStatus } from '../../types/quiz.types';
import { createQuiz, updateQuiz, getQuizById } from '../../api/quiz.service';
import { QuizBasicInfo, QuizSettings, QuizPreview, QuizPublishModal, QuizQuestionManager, QuizTagManager, QuizCategoryManager } from './';
import { PageHeader } from '../layout';
import type { AxiosError } from 'axios';

interface QuizFormProps {
  className?: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  estimatedTime?: string;
  timerDuration?: string;
  general?: string;
  [key: string]: string | undefined;
}

const QuizForm: React.FC<QuizFormProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  const isEditing = !!quizId;

  // Form state
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

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<QuizDto | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'settings' | 'questions' | 'tags' | 'category' | 'preview'>('basic');

  // Load existing quiz data if editing
  useEffect(() => {
    if (isEditing && quizId) {
      const loadQuiz = async () => {
        setIsLoading(true);
        try {
          const quiz = await getQuizById(quizId);
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
    // Clear general errors when user makes changes
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && quizId) {
        await updateQuiz(quizId, quizData as UpdateQuizRequest);
      } else {
        const result = await createQuiz(quizData as CreateQuizRequest);
        // Navigate to the new quiz's edit page
        navigate(`/quizzes/${result.quizId}/edit`);
        return;
      }
      
      // Show success message or redirect
      navigate('/quizzes');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to save quiz';
      setErrors({ general: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (status: QuizStatus) => {
    if (!quizId) return;

    try {
      // TODO: Implement updateQuizStatus API call
      // await updateQuizStatus(quizId, { status });
      if (currentQuiz) {
        setCurrentQuiz({ ...currentQuiz, status });
      }
      // Navigate to quiz list after status change
      navigate('/quizzes');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to update quiz status';
      setErrors({ general: errorMessage });
    }
  };

  // Handle question changes
  const handleQuestionsChange = (questionIds: string[]) => {
    // TODO: Implement question management API calls
    console.log('Questions changed:', questionIds);
  };

  // Handle tag changes
  const handleTagsChange = (tagIds: string[]) => {
    setQuizData(prev => ({ ...prev, tagIds }));
  };

  // Handle category change
  const handleCategoryChange = (categoryId?: string) => {
    setQuizData(prev => ({ ...prev, categoryId }));
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
    { id: 'basic', name: 'Basic Info', icon: '📝' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
    { id: 'questions', name: 'Questions', icon: '❓' },
    { id: 'tags', name: 'Tags', icon: '🏷️' },
    { id: 'category', name: 'Category', icon: '📁' },
    { id: 'preview', name: 'Preview', icon: '👁️' }
  ] as const;

  return (
    <div className={className}>
      {/* Page Header */}
      <PageHeader
        title={isEditing ? 'Edit Quiz' : 'Create New Quiz'}
        subtitle={isEditing ? 'Update your quiz settings and content' : 'Build a new quiz from scratch'}
        showBreadcrumb={true}
        showBackButton={true}
        backTo="/quizzes"
        actions={[
          {
            label: 'Cancel',
            variant: 'secondary',
            href: '/quizzes'
          },
          {
            label: isEditing ? 'Update Quiz' : 'Create Quiz',
            type: 'create',
            variant: 'primary',
            onClick: () => handleSubmit({} as React.FormEvent),
            disabled: isSaving
          }
        ]}
      />

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

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Form content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'basic' && (
          <QuizBasicInfo
            quizData={quizData}
            onDataChange={handleDataChange}
            errors={errors as Record<string, string>}
            isEditing={true}
          />
        )}

        {activeTab === 'settings' && (
          <QuizSettings
            quizData={quizData}
            onDataChange={handleDataChange}
            errors={errors as Record<string, string>}
            isEditing={true}
          />
        )}

        {activeTab === 'questions' && (
          <QuizQuestionManager
            quizId={quizId || 'new'}
            currentQuestionIds={[]} // TODO: Get from quiz data
            onQuestionsChange={handleQuestionsChange}
          />
        )}

        {activeTab === 'tags' && (
          <QuizTagManager
            quizId={quizId || 'new'}
            currentTagIds={quizData.tagIds || []}
            onTagsChange={handleTagsChange}
          />
        )}

        {activeTab === 'category' && (
          <QuizCategoryManager
            quizId={quizId || 'new'}
            currentCategoryId={quizData.categoryId}
            onCategoryChange={handleCategoryChange}
          />
        )}

        {activeTab === 'preview' && (
          <QuizPreview
            quizData={currentQuiz || quizData}
          />
        )}

        {/* Manage Status Button for Editing */}
        {isEditing && currentQuiz && (
          <div className="flex justify-center pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowPublishModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Manage Status
            </button>
          </div>
        )}
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
    </div>
  );
};

export default QuizForm; 