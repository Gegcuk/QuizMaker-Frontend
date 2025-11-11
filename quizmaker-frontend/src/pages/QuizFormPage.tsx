// src/pages/QuizFormPage.tsx
// ---------------------------------------------------------------------------
// Enhanced quiz form page with new wizard-based creation flow:
// - New quiz creation: Uses QuizCreationWizard (3-step process)
// - Editing existing quiz: Uses traditional QuizForm
// ---------------------------------------------------------------------------

import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PageContainer, QuizForm } from '@/components';
import QuizCreationWizard from '@/features/quiz/components/QuizCreationWizard';

const QuizFormPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [params] = useSearchParams();
  const defaultTab = (params.get('tab') as 'management' | null) || undefined;
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

  // For new quiz creation, show the wizard interface
  return (
    <PageContainer
      title="Create Quiz"
      subtitle="Follow the steps to create your new quiz"
      showBreadcrumb={true}
      showBackButton={true}
      backTo="/my-quizzes"
    >
      <QuizCreationWizard />
    </PageContainer>
  );
};

export default QuizFormPage; 
