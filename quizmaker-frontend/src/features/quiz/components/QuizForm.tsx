// src/components/QuizForm.tsx
// ---------------------------------------------------------------------------
// Main quiz creation/editing form based on CreateQuizRequest/UpdateQuizRequest
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreateQuizRequest, UpdateQuizRequest, QuizStatus } from '@/types';
import { createQuiz, updateQuizStatus } from '@/services';
import { QuizManagementTab } from './';
import { useToast, Alert } from '@/components';
import type { AxiosError } from 'axios';

interface QuizFormProps {
  className?: string;
  defaultTab?: 'management';
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
  
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Redirect to quiz detail page if trying to edit
  useEffect(() => {
    if (isEditing && quizId) {
      navigate(`/quizzes/${quizId}`);
    }
  }, [isEditing, quizId, navigate]);

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

  // Handle quiz creation - only for new quizzes (editing is now in QuizDetailPage)
  const handleCreateQuiz = async (status: QuizStatus = 'DRAFT') => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      const result = await createQuiz(quizData as CreateQuizRequest);
      const resultQuizId = result.quizId;

      // Update quiz status if not draft
      if (status !== 'DRAFT') {
        await updateQuizStatus(resultQuizId, { status });
      }

      // Success toast
      addToast({ type: 'success', message: status === 'PUBLISHED' ? 'Quiz created and published.' : 'Quiz draft created.' });

      // Navigate to the quiz detail page Settings tab
      navigate(`/quizzes/${resultQuizId}?tab=management`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to create quiz';
      setErrors({ general: errorMessage });
      addToast({ type: 'error', message: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  // Validation helpers
  const isQuizMetaValid = () => {
    const title = quizData.title?.trim() || '';
    const hasTitle = title.length >= 3 && title.length <= 100;
    const hasEstimatedTime = quizData.estimatedTime && quizData.estimatedTime >= 1 && quizData.estimatedTime <= 180;
    const hasTimerDuration = !quizData.timerEnabled || (quizData.timerDuration && quizData.timerDuration >= 1 && quizData.timerDuration <= 180);
    return hasTitle && hasEstimatedTime && hasTimerDuration;
  };

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
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg shadow-theme p-6">
          <QuizManagementTab
            quizId={quizId}
            quizData={quizData}
            onDataChange={handleDataChange}
            errors={errors as Record<string, string>}
            isEditing={false}
          />
        </div>
      </form>
    </div>
  );
};

export default QuizForm; 
