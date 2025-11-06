// src/features/quiz/components/QuizCreationWizard.tsx
// ---------------------------------------------------------------------------
// Multi-step wizard for quiz creation with the following flow:
// 1. Choose creation method (Manual, From Text, From Document)
// 2. Configure quiz settings (title, description, difficulty, etc.)
// 3. Add questions (using the new quiz ID)
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreateQuizRequest, QuizDto, QuestionDifficulty, GenerateQuizFromTextRequest } from '@/types';
import { createQuiz } from '@/services';
import { QuizService } from '../services/quiz.service';
import { api } from '@/services';
import { Button, useToast, InsufficientBalanceModal } from '@/components';
import { QuizCreationMethodSelector } from './QuizCreationMethodSelector';
import { ManualQuizConfigurationForm } from './ManualQuizConfigurationForm';
import { TextQuizConfigurationForm } from './TextQuizConfigurationForm';
import { DocumentQuizConfigurationForm } from './DocumentQuizConfigurationForm';
import { QuizQuestionManager } from './QuizQuestionManager';
import { QuizAIGenerationStep } from './QuizAIGenerationStep';
import { QuizGenerationStatus as QuizGenerationStatusComponent } from './QuizGenerationStatus';
import { QuizWizardDraft } from '@/features/quiz/types/quizWizard.types';
import type { AxiosError } from 'axios';

export type CreationMethod = 'manual' | 'text' | 'document';

interface QuizCreationWizardProps {
  className?: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const QuizCreationWizard: React.FC<QuizCreationWizardProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const quizService = new QuizService(api);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [creationMethod, setCreationMethod] = useState<CreationMethod | null>(null);
  const [quizData, setQuizData] = useState<QuizWizardDraft>({
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
  const [createdQuiz, setCreatedQuiz] = useState<QuizDto | null>(null);
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Insufficient balance modal state
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);
  const [balanceErrorData, setBalanceErrorData] = useState<{
    message?: string;
    requiredTokens?: number;
    currentBalance?: number;
  }>({});

  // Cleanup: Reset modal state on unmount or route change
  useEffect(() => {
    return () => {
      setShowInsufficientBalanceModal(false);
      setBalanceErrorData({});
      setErrors({});
    };
  }, [location.pathname]);

  const totalSteps = 4;
  const stepTitles = [
    'Choose Creation Method',
    'Configure Quiz Settings',
    creationMethod === 'manual' ? 'Add Questions' : 'Generate Questions',
    'Review & Complete'
  ];

  // Step 1: Choose creation method
  const handleMethodSelect = (method: CreationMethod) => {
    setCreationMethod(method);
    setCurrentStep(2);
  };

  // Step 2: Configure quiz
  const handleQuizConfigChange = (newData: QuizWizardDraft) => {
    setQuizData(prev => {
      const updated = { ...prev, ...newData };
      return updated;
    });
    
    // Clear errors for updated fields
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

  const validateQuizConfig = (data: QuizWizardDraft = quizData): FormErrors => {
    const newErrors: FormErrors = {};

    if (!data.title?.trim()) {
      newErrors.title = 'Quiz title is required';
    } else if (data.title.trim().length < 3) {
      newErrors.title = 'Quiz title must be at least 3 characters';
    } else if (data.title.trim().length > 100) {
      newErrors.title = 'Quiz title must be no more than 100 characters';
    }

    if (data.description && data.description.trim().length > 1000) {
      newErrors.description = 'Description must be no more than 1000 characters';
    }

    if (!data.estimatedTime || data.estimatedTime < 1) {
      newErrors.estimatedTime = 'Estimated time must be at least 1 minute';
    } else if (data.estimatedTime > 180) {
      newErrors.estimatedTime = 'Estimated time must be no more than 180 minutes';
    }

    if (data.timerEnabled && (!data.timerDuration || data.timerDuration < 1)) {
      newErrors.timerDuration = 'Timer duration must be at least 1 minute when timer is enabled';
    } else if (data.timerEnabled && data.timerDuration && data.timerDuration > 180) {
      newErrors.timerDuration = 'Timer duration must be no more than 180 minutes';
    }

    return newErrors;
  };

  const handleCreateQuiz = async (overrideData?: QuizWizardDraft) => {
    const submissionData: QuizWizardDraft = overrideData ? { ...quizData, ...overrideData } : quizData;

    const validationErrors = validateQuizConfig(submissionData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (overrideData) {
      setQuizData(prev => ({ ...prev, ...overrideData }));
    }

    setIsCreatingQuiz(true);
    try {
      if (creationMethod === 'manual') {
        // Manual creation - create quiz directly
        const result = await createQuiz(submissionData as CreateQuizRequest);
        setCreatedQuiz({ 
          id: result.quizId,
          ...submissionData,
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          creatorId: '', // Will be set by backend
          tagIds: submissionData.tagIds || []
        } as QuizDto);

        addToast({ 
          type: 'success', 
          message: 'Quiz created successfully! Now you can add questions.' 
        });

        setCurrentStep(3);
      } else if (creationMethod === 'text') {
        // AI generation from text - start generation job
        const generationRequest = submissionData.generationRequest as GenerateQuizFromTextRequest | undefined;
        if (!generationRequest) {
          addToast({ message: 'Generation request data is missing. Please try again.' });
          return;
        }
        const response = await quizService.generateQuizFromText(generationRequest);

        setCreatedQuiz({ 
          id: response.jobId!,
          title: submissionData.title || 'Generating Quiz...',
          description: 'AI is generating your quiz...',
          difficulty: submissionData.difficulty || 'MEDIUM',
          visibility: submissionData.visibility || 'PRIVATE',
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          creatorId: '',
          tagIds: submissionData.tagIds || []
        } as QuizDto);

        addToast({ 
          type: 'info', 
          message: response.message || 'Quiz generation started! Please wait while AI creates your quiz.' 
        });

        setCurrentStep(3);
      } else if (creationMethod === 'document') {
        // AI generation from document - start generation job
        const generationRequest = submissionData.generationRequest;
        if (!generationRequest) {
          addToast({ message: 'Generation request data is missing. Please try again.' });
          return;
        }
        if (!(generationRequest instanceof FormData)) {
          addToast({ message: 'Document generation request is invalid. Please re-upload your file.' });
          return;
        }
        const response = await quizService.generateQuizFromUpload(generationRequest);

        setCreatedQuiz({ 
          id: response.jobId!,
          title: submissionData.title || 'Generating Quiz...',
          description: 'AI is generating your quiz...',
          difficulty: submissionData.difficulty || 'MEDIUM',
          visibility: submissionData.visibility || 'PRIVATE',
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          creatorId: '',
          tagIds: submissionData.tagIds || []
        } as QuizDto);

        addToast({ 
          type: 'info', 
          message: response.message || 'Quiz generation started! Please wait while AI creates your quiz.' 
        });

        setCurrentStep(3);
      }
    } catch (error: any) {
      // Check if this is an insufficient balance error (enhanced by quiz service)
      const axiosError = error as AxiosError<any>;
      const status = axiosError.response?.status || error.status;
      const responseData = axiosError.response?.data || error.data || {};
      
      // Support RFC 7807 Problem Details format (detail, title) and standard format (message)
      const errorMessage = error.userMessage || 
                          responseData.detail || 
                          responseData.title || 
                          responseData.message || 
                          error.message || 
                          'Failed to create quiz';
      
      console.log('🔴 Quiz creation error - isBalanceError:', error.isBalanceError);
      console.log('🔴 Error message:', errorMessage);
      console.log('🔴 Response data:', responseData);

      // Check for insufficient balance - either via enhanced flag from service
      const isBalanceError = error.isBalanceError || error.code === 'INSUFFICIENT_BALANCE';

      if (isBalanceError) {
        console.log('✅ Showing insufficient balance modal');
        
        // Try to extract token counts from the detail message
        // Format: "required=6, available=0"
        let requiredTokens: number | undefined;
        let currentBalance: number | undefined;
        
        const detail = responseData.detail || '';
        const requiredMatch = detail.match(/required[=:]?\s*(\d+)/i);
        const availableMatch = detail.match(/available[=:]?\s*(\d+)/i);
        
        if (requiredMatch) requiredTokens = parseInt(requiredMatch[1]);
        if (availableMatch) currentBalance = parseInt(availableMatch[1]);
        
        // Also check if backend provides them directly
        requiredTokens = requiredTokens || responseData.requiredTokens || responseData.required;
        currentBalance = currentBalance || responseData.currentBalance || responseData.available;
        
        console.log('📊 Token data - required:', requiredTokens, 'available:', currentBalance);
        
        setBalanceErrorData({
          message: errorMessage,
          requiredTokens,
          currentBalance
        });
        setShowInsufficientBalanceModal(true);
      } else {
        // Handle other errors normally
        console.log('⚠️ Showing generic error');
        setErrors({ general: errorMessage });
        addToast({ type: 'error', message: errorMessage });
      }
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  // Navigation helpers
  const canGoBack = currentStep > 1;
  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <QuizCreationMethodSelector
            onMethodSelect={handleMethodSelect}
            selectedMethod={creationMethod}
          />
        );
      
            case 2:
              switch (creationMethod) {
                case 'manual':
                  return (
                    <ManualQuizConfigurationForm
                      quizData={quizData}
                      onDataChange={handleQuizConfigChange}
                      errors={errors}
                      onCreateQuiz={handleCreateQuiz}
                      isCreating={isCreatingQuiz}
                    />
                  );
                case 'text':
                  return (
                    <TextQuizConfigurationForm
                      key="text-quiz-form"
                      quizData={quizData}
                      onDataChange={handleQuizConfigChange}
                      errors={errors}
                      onCreateQuiz={handleCreateQuiz}
                      isCreating={isCreatingQuiz}
                    />
                  );
                case 'document':
                  return (
                    <DocumentQuizConfigurationForm
                      key="document-quiz-form"
                      quizData={quizData}
                      onDataChange={handleQuizConfigChange}
                      errors={errors}
                      onCreateQuiz={handleCreateQuiz}
                      isCreating={isCreatingQuiz}
                    />
                  );
                default:
                  return null;
              }
      
      case 3:
        if (!createdQuiz) return null;
        
        if (creationMethod === 'manual') {
          return (
            <QuizQuestionManager
              quizId={createdQuiz.id}
              quizTitle={createdQuiz.title}
              defaultDifficulty={quizData.difficulty as QuestionDifficulty || 'MEDIUM'}
              onComplete={() => setCurrentStep(4)}
            />
          );
        } else if (creationMethod === 'text' || creationMethod === 'document') {
          // Show generation status for AI methods
          return (
            <QuizGenerationStatusComponent
              jobId={createdQuiz.id}
              initialStatus="PENDING"
              estimatedTimeSeconds={60}
              onComplete={(quizId: string) => {
                // Update the created quiz with the real quiz ID
                setCreatedQuiz(prev => prev ? { ...prev, id: quizId } : null);
                setCurrentStep(4);
              }}
              onError={(error: string) => {
                addToast({ type: 'error', message: error });
              }}
              onCancel={() => {
                setCurrentStep(1);
                setCreationMethod(null);
                setCreatedQuiz(null);
              }}
            />
          );
        } else {
          return (
            <QuizAIGenerationStep
              quizId={createdQuiz.id}
              quizTitle={createdQuiz.title}
              creationMethod={creationMethod!}
              onComplete={() => setCurrentStep(4)}
            />
          );
        }
      
      case 4:
        return createdQuiz ? (
          <div className="text-center space-y-6">
            <div className="bg-theme-bg-success border border-theme-border-success rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <svg className="h-12 w-12 text-theme-interactive-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-theme-text-primary mb-2">
                Quiz Created Successfully!
              </h3>
              <p className="text-theme-interactive-success mb-4">
                Your quiz "{createdQuiz.title}" has been created and is ready to use.
              </p>
              <div className="flex justify-center space-x-4">
                <Button
                  variant="primary"
                  onClick={() => navigate(`/quizzes/${createdQuiz.id}/edit`)}
                >
                  Edit Quiz
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/my-quizzes')}
                >
                  View My Quizzes
                </Button>
              </div>
            </div>
          </div>
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-theme-text-primary">
            {stepTitles[currentStep - 1]}
          </h2>
          <span className="text-sm text-theme-text-tertiary">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
          <div 
            className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Error message */}
      {errors.general && (
        <div className="mb-6 bg-theme-bg-danger border border-theme-border-danger rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-theme-interactive-danger" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-theme-interactive-danger">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="bg-theme-bg-primary shadow rounded-lg">
        <div className="p-6">
          {renderStepContent()}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex justify-between">
        <div>
          {canGoBack && (
            <Button
              type="button"
              variant="secondary"
              onClick={goBack}
              disabled={isCreatingQuiz}
            >
              ← Back
            </Button>
          )}
        </div>
        
        <div className="text-sm text-theme-text-tertiary">
          {currentStep === 1 && creationMethod && (
            <span>Selected: {creationMethod === 'manual' ? 'Manual Creation' : creationMethod === 'text' ? 'Generate from Text' : 'Generate from Document'}</span>
          )}
          {currentStep === 2 && (
            <span>Configure your quiz settings</span>
          )}
          {currentStep === 3 && creationMethod === 'manual' && (
            <span>Add questions to your quiz</span>
          )}
          {currentStep === 3 && creationMethod !== 'manual' && (
            <span>Generate questions using AI</span>
          )}
          {currentStep === 4 && (
            <span>Quiz creation complete!</span>
          )}
        </div>
      </div>

      {/* Insufficient Balance Modal */}
      <InsufficientBalanceModal
        isOpen={showInsufficientBalanceModal}
        onClose={() => setShowInsufficientBalanceModal(false)}
        message={balanceErrorData.message}
        requiredTokens={balanceErrorData.requiredTokens}
        currentBalance={balanceErrorData.currentBalance}
      />
    </div>
  );
};

export default QuizCreationWizard;
