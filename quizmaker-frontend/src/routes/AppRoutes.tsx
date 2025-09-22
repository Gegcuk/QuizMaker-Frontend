// src/routes/AppRoutes.tsx
// ---------------------------------------------------------------------------
// Centralised route-map for the entire application.
// • Public pages render directly.
// • Private pages are wrapped in <ProtectedRoute> so they require auth.
// • Visiting /login or /register while *already* logged in forwards the
//   user to /quizzes to avoid showing an auth form unnecessarily.
// ---------------------------------------------------------------------------

import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout, ProtectedRoute, ErrorBoundary } from '../components';

import { useAuth } from '../features/auth';

/* ----------  Public pages  ------------------------------------------------ */
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

/* ----------  Quiz browsing / attempt pages  ------------------------------ */
import { QuizListPage } from '../components';
import QuizDetailPage from '../pages/QuizDetailPage';
import QuizAttemptPage from '../pages/QuizAttemptPage';
import QuizAttemptFlowPage from '../pages/QuizAttemptFlowPage';
import { QuizResultPage, QuizResultsSummaryPage } from '@/features/result';

/* ----------  Quiz CRUD / owner pages  ------------------------------------ */
import { MyQuizzesPage } from '../components';
import QuizFormPage from '../pages/QuizFormPage';

/* ----------  Management pages  ------------------------------------------ */
import { TagManagementPage } from '@/features/tag';
import CategoryManagementPage from '../pages/CategoryManagementPage';
import QuestionManagementPage from '../pages/QuestionManagementPage';
import QuizQuestionsPage from '../pages/QuizQuestionPage';
import QuizGenerationJobsPage from '../pages/QuizGenerationJobsPage';

/* ----------  Document management pages  --------------------------------------- */
import DocumentListPage from '../pages/DocumentListPage';
import DocumentUploadPage from '../pages/DocumentUploadPage';
import { DocumentViewer } from '../features/document';

/* ----------  User profile pages  ----------------------------------------- */
import { ProfilePage, SettingsPage } from '@/features/user';

/* ----------  Misc  ------------------------------------------------------- */
import NotFoundPage from '../pages/NotFoundPage';
import AiAnalysisPage from '../pages/AiAnalysisPage';

// Wrapper component to extract documentId from URL params
const DocumentViewerWrapper: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  return <DocumentViewer documentId={documentId!} />;
};

const AppRoutes: React.FC = () => {
  const { isLoggedIn } = useAuth();

  /* Helper: if an authenticated user hits /login or /register, bounce them
     to /quizzes instead of showing the auth form again. */
  const authRedirect = (page: 'login' | 'register') =>
    isLoggedIn ? (
      <Navigate to="/quizzes" replace />
    ) : page === 'login' ? (
      <LoginPage />
    ) : (
      <RegisterPage />
    );

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
        {/* --------------------------  Public  ------------------------------ */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={authRedirect('login')} />
        <Route path="/register" element={authRedirect('register')} />

        {/* -------------------------  Private  ------------------------------ */}
        <Route
          path="/quizzes"
          element={
            <ProtectedRoute>
              <QuizListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:quizId"
          element={
            <ProtectedRoute>
              <QuizDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:quizId/attempt"
          element={
            <ProtectedRoute>
              <QuizAttemptPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:quizId/attempt/start"
          element={
            <ProtectedRoute>
              <QuizAttemptFlowPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:quizId/results"
          element={
            <ProtectedRoute>
              <QuizResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-quizzes"
          element={
            <ProtectedRoute>
              <MyQuizzesPage />
            </ProtectedRoute>
          }
        />
        {/* Quiz creation & editing share the same form component */}
        <Route
          path="/quizzes/create"
          element={
            <ProtectedRoute>
              <QuizFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:quizId/edit"
          element={
            <ProtectedRoute>
              <QuizFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:quizId/results-summary"
          element={
            <ProtectedRoute>
              <QuizResultsSummaryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:quizId/questions"
          element={<Navigate to="/quizzes/:quizId/edit?tab=questions" replace />}
        />
        <Route
          path="/quizzes/:quizId/generation"
          element={
            <ProtectedRoute>
              <QuizGenerationJobsPage />
            </ProtectedRoute>
          }
        />
        
        {/* Management sections */}
        <Route
          path="/tags"
          element={
            <ProtectedRoute>
              <TagManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <CategoryManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/questions"
          element={
            <ProtectedRoute>
              <QuestionManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Document Management Routes */}
        <Route
          path="/documents"
          element={
            <ProtectedRoute requiredRoles={['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
              <DocumentListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/upload"
          element={
            <ProtectedRoute requiredRoles={['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
              <DocumentUploadPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents/:documentId"
          element={
            <ProtectedRoute requiredRoles={['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
              <DocumentViewerWrapper />
            </ProtectedRoute>
          }
        />

        

        {/* AI Analysis Route */}
        <Route
          path="/ai-analysis"
          element={
            <ProtectedRoute>
              <div>
                <h1>AI Analysis Test Page</h1>
                <p>If you can see this, the route is working!</p>
                <AiAnalysisPage />
              </div>
            </ProtectedRoute>
          }
        />

        {/* User Profile Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* ---------------  Fallback: 404 Not-Found  ------------------------- */}
        <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
};

export default AppRoutes;
