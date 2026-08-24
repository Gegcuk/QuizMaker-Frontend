// src/routes/AppRoutes.tsx
// ---------------------------------------------------------------------------
// Centralised route-map for the entire application.
// • Public pages render directly.
// • Private pages are wrapped in <ProtectedRoute> so they require auth.
// • Visiting /login or /register while *already* logged in forwards the
//   user to /my-quizzes to avoid showing an auth form unnecessarily.
// ---------------------------------------------------------------------------

import React, { lazy } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import ErrorBoundary from '../components/common/ErrorBoundary';
import LazyRouteBoundary from './LazyRouteBoundary';

import { useAuth } from '../features/auth';

/* ----------  Public pages  ------------------------------------------------ */
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import EmailVerificationPage from '../pages/EmailVerificationPage';
import BlogIndexPage from '../pages/BlogIndexPage';
import BlogArticlePage from '../pages/BlogArticlePage';
import BlogArticleTemplatePage from '../pages/BlogArticleTemplatePage';
import OAuthCallbackPage from '../pages/OAuthCallbackPage';
import ThemeDemoPage from '../pages/ThemeDemoPage';
import SitemapArticlesPage from '../pages/SitemapArticlesPage';
import TermsPage from '../pages/TermsPage';
import PrivacyPage from '../pages/PrivacyPage';
import FaqPage from '../pages/FaqPage';
import ValuesPage from '../pages/ValuesPage';
import RoadmapPage from '../pages/RoadmapPage';
import {
  getAlternatePublicRoutePath,
  publicRouteManifest,
  resolvePublicRoutePath,
  type PublicRouteDefinition,
  type PublicRouteId,
} from './publicRouteManifest.mjs';

/* ----------  Deferred authenticated routes  ----------------------------- */
const QuizDetailPage = lazy(() => import('../pages/QuizDetailPage'));
const QuizAttemptPage = lazy(() => import('../pages/QuizAttemptPage'));
const QuizAttemptFlowPage = lazy(() => import('../pages/QuizAttemptFlowPage'));
const QuizResultPage = lazy(() => import('../features/result/components/QuizResultPage'));
const MyQuizzesPage = lazy(() => import('../features/quiz/components/MyQuizzesPage'));
const QuizFormPage = lazy(() => import('../pages/QuizFormPage'));
const QuizResultsSummaryPage = lazy(() => import('../features/result/components/QuizResultsSummaryPage'));
const QuizGenerationJobsPage = lazy(() => import('../pages/QuizGenerationJobsPage'));
const TagManagementPage = lazy(() => import('../features/tag/components/TagManagementPage'));
const CategoryManagementPage = lazy(() => import('../pages/CategoryManagementPage'));
const QuestionManagementPage = lazy(() => import('../pages/QuestionManagementPage'));
const BugReportManagementPage = lazy(() => import('../features/bug-report/components/BugReportManagementPage'));
const QuizQuestionsPage = lazy(() => import('../pages/QuizQuestionPage'));
const DocumentListPage = lazy(() => import('../pages/DocumentListPage'));
const DocumentUploadPage = lazy(() => import('../pages/DocumentUploadPage'));
const DocumentViewPage = lazy(() => import('../pages/DocumentViewPage'));
const AiAnalysisPage = lazy(() => import('../pages/AiAnalysisPage'));
const FormTestPage = lazy(() => import('../pages/FormTestPage'));
const ProfilePage = lazy(() => import('../features/user/components/ProfilePage'));
const SettingsPage = lazy(() => import('../features/user/components/SettingsPage'));
const BillingPage = lazy(() => import('../features/billing/components/BillingPage'));
const BillingSuccessPage = lazy(() => import('../features/billing/components/BillingSuccessPage'));
const BillingCancelPage = lazy(() => import('../features/billing/components/BillingCancelPage'));
const MyAttemptsPage = lazy(() => import('../pages/MyAttemptsPage'));
const AdminWorkspacePage = lazy(() => import('../pages/AdminWorkspacePage'));

/* ----------  Misc  ------------------------------------------------------- */
import NotFoundPage from '../pages/NotFoundPage';

const protectedRoute = (page: React.ReactElement, requiredRoles?: string[]) => (
  <ProtectedRoute requiredRoles={requiredRoles}>
    <LazyRouteBoundary>{page}</LazyRouteBoundary>
  </ProtectedRoute>
);

interface PublicRouteElementProps {
  route: PublicRouteDefinition;
  children: React.ReactElement;
}

const PublicRouteElement: React.FC<PublicRouteElementProps> = ({ route, children }) => {
  const location = useLocation();
  const params = useParams();

  if (route.trailingSlash === 'canonical') {
    const canonicalPath = resolvePublicRoutePath(route.path, params);
    if (location.pathname !== canonicalPath) {
      return <Navigate to={`${canonicalPath}${location.search}${location.hash}`} replace />;
    }
  }

  return children;
};

const AppRoutes: React.FC = () => {
  const { isLoggedIn } = useAuth();

  /* Helper: if an authenticated user hits /login or /register, bounce them
     to /my-quizzes instead of showing the auth form again. */
  const authRedirect = (page: 'login' | 'register') =>
    isLoggedIn ? (
      <Navigate to="/my-quizzes" replace />
    ) : page === 'login' ? (
      <LoginPage />
    ) : (
      <RegisterPage />
    );

  const publicRouteElement = (routeId: PublicRouteId): React.ReactElement => {
    switch (routeId) {
      case 'home':
        return <HomePage />;
      case 'login':
        return authRedirect('login');
      case 'register':
        return authRedirect('register');
      case 'forgotPassword':
        return <ForgotPasswordPage />;
      case 'resetPassword':
        return <ResetPasswordPage />;
      case 'verifyEmail':
        return <EmailVerificationPage />;
      case 'oauthCallback':
      case 'oauth2Redirect':
        return <OAuthCallbackPage />;
      case 'themeDemo':
        return <ThemeDemoPage />;
      case 'terms':
        return <TermsPage />;
      case 'privacy':
        return <PrivacyPage />;
      case 'faq':
        return <FaqPage />;
      case 'values':
        return <ValuesPage />;
      case 'roadmap':
        return <RoadmapPage />;
      case 'blogIndex':
        return <BlogIndexPage />;
      case 'blogTemplate':
        return <BlogArticleTemplatePage />;
      case 'blogArticle':
        return <BlogArticlePage />;
      case 'articleSitemap':
        return <SitemapArticlesPage />;
      case 'notFound':
      case 'sitemap':
        throw new Error(`${routeId} is delivered outside the React route map.`);
    }
  };

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
        {/* --------------------------  Public  ------------------------------ */}
        {publicRouteManifest
          .filter((route) => route.router !== false)
          .flatMap((route) => {
            const routePaths = [route.path, getAlternatePublicRoutePath(route)].filter(
              (path): path is string => Boolean(path),
            );

            return routePaths.map((path) => (
              <Route
                key={`${route.id}:${path}`}
                path={path}
                element={(
                  <PublicRouteElement route={route}>
                    {publicRouteElement(route.id)}
                  </PublicRouteElement>
                )}
              />
            ));
          })}

        {/* -------------------------  Private  ------------------------------ */}
        <Route path="/quizzes" element={<Navigate to="/my-quizzes" replace />} />
        <Route
          path="/quizzes/:quizId"
          element={protectedRoute(<QuizDetailPage />)}
        />
        <Route
          path="/quizzes/:quizId/attempt"
          element={protectedRoute(<QuizAttemptPage />)}
        />
        <Route
          path="/quizzes/:quizId/attempt/start"
          element={protectedRoute(<QuizAttemptFlowPage />)}
        />
        <Route
          path="/quizzes/:quizId/results"
          element={protectedRoute(<QuizResultPage />)}
        />
        <Route
          path="/my-quizzes"
          element={protectedRoute(<MyQuizzesPage />)}
        />
        {/* Quiz creation & editing share the same form component */}
        <Route
          path="/quizzes/create"
          element={protectedRoute(<QuizFormPage />)}
        />
        <Route
          path="/quizzes/:quizId/edit"
          element={protectedRoute(<QuizFormPage />)}
        />
        <Route
          path="/quizzes/:quizId/results-summary"
          element={protectedRoute(<QuizResultsSummaryPage />)}
        />
        <Route
          path="/quizzes/:quizId/questions"
          element={<Navigate to="/quizzes/:quizId/edit?tab=questions" replace />}
        />
        <Route
          path="/quizzes/:quizId/generation"
          element={protectedRoute(<QuizGenerationJobsPage />)}
        />
        
        {/* Management sections */}
        <Route
          path="/tags"
          element={protectedRoute(<TagManagementPage />)}
        />
        <Route
          path="/categories"
          element={protectedRoute(<CategoryManagementPage />)}
        />
        <Route
          path="/questions"
          element={protectedRoute(<QuestionManagementPage />)}
        />
        <Route
          path="/bug-reports"
          element={protectedRoute(<BugReportManagementPage />, ['ROLE_SUPER_ADMIN'])}
        />
        <Route
          path="/admin"
          element={protectedRoute(<AdminWorkspacePage />, ['ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])}
        />

        {/* Document Management Routes */}
        <Route
          path="/documents"
          element={protectedRoute(<DocumentListPage />, ['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])}
        />
        <Route
          path="/documents/upload"
          element={protectedRoute(<DocumentUploadPage />, ['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])}
        />

        <Route
          path="/documents/:documentId"
          element={protectedRoute(<DocumentViewPage />, ['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'])}
        />

        

        {/* AI Analysis Route */}
        <Route
          path="/ai-analysis"
          element={protectedRoute(
            <div>
              <h1>AI Analysis Test Page</h1>
              <p>If you can see this, the route is working!</p>
              <AiAnalysisPage />
            </div>,
          )}
        />

        {/* Form Test Route */}
        <Route
          path="/form-test"
          element={protectedRoute(<FormTestPage />)}
        />

        {/* User Profile Routes */}
        <Route
          path="/profile"
          element={protectedRoute(<ProfilePage />)}
        />
        <Route
          path="/settings"
          element={protectedRoute(<SettingsPage />)}
        />

        {/* Billing Route */}
        <Route
          path="/billing"
          element={protectedRoute(<BillingPage />)}
        />
        <Route
          path="/billing/success"
          element={protectedRoute(<BillingSuccessPage />)}
        />
        <Route
          path="/billing/cancel"
          element={protectedRoute(<BillingCancelPage />)}
        />

        {/* Attempts Route */}
        <Route
          path="/my-attempts"
          element={protectedRoute(<MyAttemptsPage />)}
        />

        {/* ---------------  Fallback: 404 Not-Found  ------------------------- */}
        <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
};

export default AppRoutes;
