// src/pages/QuizFromSelectedPagesPage.tsx
// Page for creating quizzes from selected document pages

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components';
import { DocumentQuizConfigurationFormWithPageSelector } from '@/features/quiz';
import { QuizWizardDraft } from '@/features/quiz/types/quizWizard.types';
import { QuizService, api } from '@/services';
import { useToast } from '@/components';
import { GenerationProgress } from '@/features/ai';
import { GenerateQuizFromDocumentRequest } from '@/types';

const isGenerateQuizFromDocumentRequest = (
  value: unknown
): value is GenerateQuizFromDocumentRequest => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.documentId === 'string' && typeof candidate.quizScope === 'string' && !!candidate.questionsPerType;
};

const QuizFromSelectedPagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const quizService = new QuizService(api);
  
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [activeGenerationJob, setActiveGenerationJob] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizWizardDraft>({
    title: '',
    description: '',
    difficulty: 'MEDIUM'
  });

  const handleDataChange = (data: QuizWizardDraft) => {
    setQuizData(data);
  };

  const handleCreateQuiz = async (data?: QuizWizardDraft) => {
    const submissionData = data || quizData;
    
    const newErrors: Record<string, string | undefined> = {};
    if (!submissionData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsCreating(true);
    setErrors({});

    try {
      const generationRequest = submissionData.generationRequest;
      if (!generationRequest) {
        addToast({ type: 'error', message: 'Generation request data is missing. Please try again.' });
        return;
      }
      
      if (!isGenerateQuizFromDocumentRequest(generationRequest)) {
        addToast({ type: 'error', message: 'Document generation request is invalid. Please re-upload your file.' });
        return;
      }

      const response = await quizService.generateQuizFromDocument(generationRequest);

      addToast({ 
        type: 'success', 
        message: response.message || 'Quiz generation started! Please wait while AI creates your quiz.' 
      });

      setActiveGenerationJob(response.jobId);
    } catch (error: any) {
      if (error.message?.includes('insufficient') || error.message?.includes('balance')) {
        addToast({ 
          type: 'error', 
          message: error.message 
        });
      } else {
        addToast({ 
          type: 'error', 
          message: error.message || 'Failed to start quiz generation' 
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerationComplete = (quizId: string) => {
    addToast({ 
      type: 'success', 
      message: 'Quiz generated successfully!' 
    });
    navigate(`/quizzes/${quizId}/questions`);
  };

  const handleGenerationError = (error: string) => {
    addToast({ 
      type: 'error', 
      message: error 
    });
    setActiveGenerationJob(null);
  };

  return (
    <PageContainer
      title="Create Quiz from Selected Pages"
      subtitle="Upload a document, select specific pages, and generate a quiz"
      showBreadcrumb={true}
      showBackButton={true}
      backTo="/quizzes/new"
    >
      <div className="max-w-7xl mx-auto py-8">
        {activeGenerationJob ? (
          <div className="max-w-4xl mx-auto">
            <GenerationProgress
              jobId={activeGenerationJob}
              onGenerationComplete={handleGenerationComplete}
              onGenerationError={handleGenerationError}
            />
          </div>
        ) : (
          <DocumentQuizConfigurationFormWithPageSelector
            quizData={quizData}
            onDataChange={handleDataChange}
            errors={errors}
            onCreateQuiz={handleCreateQuiz}
            isCreating={isCreating}
          />
        )}
      </div>
    </PageContainer>
  );
};

export default QuizFromSelectedPagesPage;

