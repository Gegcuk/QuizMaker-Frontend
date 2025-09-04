// src/pages/QuizFormPage.tsx
// ---------------------------------------------------------------------------
// Enhanced quiz form page with multiple creation methods:
// 1. Manual quiz creation (existing QuizForm)
// 2. Generate from text (new textarea-based generation)
// 3. Generate from document upload (moved from DocumentUploadWithQuizPage)
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PageContainer } from '../components/layout';
import { QuizForm } from '../components/quiz';
import { QuizCreationTabs } from '../components/quiz/QuizCreationTabs';

const QuizFormPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [params] = useSearchParams();
  const defaultTab = (params.get('tab') as 'management' | 'questions' | 'preview' | null) || undefined;
  const isEditing = Boolean(quizId);

  // If editing, show only the manual form
  if (isEditing) {
    return (
      <PageContainer
        title="Edit Quiz"
        subtitle="Modify your quiz settings and content"
        showBreadcrumb={true}
        showBackButton={true}
        backTo="/my-quizzes"
      >
        <QuizForm defaultTab={defaultTab} />
      </PageContainer>
    );
  }

  // For new quiz creation, show the enhanced tabs interface
  return (
    <PageContainer
      title="Create Quiz"
      subtitle="Choose your preferred method to create a new quiz"
      showBreadcrumb={true}
      showBackButton={true}
      backTo="/my-quizzes"
    >
      <QuizCreationTabs />
    </PageContainer>
  );
};

export default QuizFormPage; 
