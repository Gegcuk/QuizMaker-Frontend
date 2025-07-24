// src/pages/QuizFormPage.tsx
// ---------------------------------------------------------------------------
// Quiz form page that wraps QuizForm component with standardized layout
// ---------------------------------------------------------------------------

import React from 'react';
import { useParams } from 'react-router-dom';
import { PageContainer } from '../components/layout';
import { QuizForm } from '../components/quiz';

const QuizFormPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const isEditing = Boolean(quizId);

  return (
    <PageContainer
      title={isEditing ? 'Edit Quiz' : 'Create Quiz'}
      subtitle={isEditing ? 'Modify your quiz settings and content' : 'Create a new quiz with questions and settings'}
      showBreadcrumb={true}
      showBackButton={true}
      backTo="/my-quizzes"
    >
      <QuizForm />
    </PageContainer>
  );
};

export default QuizFormPage; 