// src/routes/AppRoutes.tsx
// ---------------------------------------------------------------------------
// Centralised route-map for the entire application.
// • Public pages render directly.
// • Private pages are wrapped in <ProtectedRoute> so they require auth.
// • Visiting /login or /register while *already* logged in forwards the
//   user to /quizzes to avoid showing an auth form unnecessarily.
// ---------------------------------------------------------------------------

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';

import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

/* ----------  Public pages  ------------------------------------------------ */
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

/* ----------  Quiz browsing / attempt pages  ------------------------------ */
import QuizListPage from '../pages/QuizListPage';
import QuizDetailPage from '../pages/QuizDetailPage';
import QuizAttemptPage from '../pages/QuizAttemptPage';
import QuizResultPage from '../pages/QuizResultPage';
import QuizResultsSummaryPage from '../pages/QuizResultsSummaryPage';

/* ----------  Quiz CRUD / owner pages  ------------------------------------ */
import MyQuizzesPage from '../pages/MyQuizzesPage';
import QuizFormPage from '../pages/QuizFormPage';

/* ----------  Management pages  ------------------------------------------ */
import TagManagementPage from '../pages/TagManagementPage';
import CategoryManagementPage from '../pages/CategoryManagementPage';
import QuestionManagementPage from '../pages/QuestionManagementPage';
import QuizQuestionsPage from '../pages/QuizQuestionPage';


/* ----------  Misc  ------------------------------------------------------- */
import NotFoundPage from '../pages/NotFoundPage';

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
              <QuizFormPage mode="create" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/:quizId/edit"
          element={
            <ProtectedRoute>
              <QuizFormPage mode="edit" />
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
          element={
            <ProtectedRoute>
              <QuizQuestionsPage />
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

        {/* ---------------  Fallback: 404 Not-Found  ------------------------- */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
