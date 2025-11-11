// ---------------------------------------------------------------------------
// Enhanced Quiz Detail Page with all analytics and management components
// Route: /quizzes/:quizId
// Integrates all components from section 3.3 Quiz Details & Analytics
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import {
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowUpOnSquareIcon,
} from '@heroicons/react/24/outline';
import { useParams, useNavigate } from 'react-router-dom';
import { updateQuiz, updateQuizStatus } from '@/services';
import { useToast } from '@/components';
import { useAuth } from '@/features/auth';
import { useQuiz, useQuizStats, useQuizLeaderboard, useDeleteQuiz } from '@/features/quiz/hooks/useQuizQueries';
import { 
  Spinner, 
  ConfirmationModal,
  QuizDetailHeader,
  QuizStats,
  Button,
  QuizExport,
  QuizGenerationJobs,
  QuizManagementTab,
  QuizPublishModal,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components';
import type { QuizStatus } from '@/types';

const QuizDetailPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'management' | 'export'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [managementData, setManagementData] = useState<Partial<import('@/types').CreateQuizRequest | import('@/types').UpdateQuizRequest>>();
  const [initialManagementData, setInitialManagementData] = useState<Partial<import('@/types').CreateQuizRequest | import('@/types').UpdateQuizRequest>>();
  const [isSavingManagement, setIsSavingManagement] = useState(false);
  const [managementErrors, setManagementErrors] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  // React Query hooks
  const { data: quiz, isLoading: quizLoading, error: quizError } = useQuiz(quizId!);
  const { data: stats, isLoading: statsLoading } = useQuizStats(quizId!);
  const { data: leaderboardEntries, isLoading: leaderboardLoading } = useQuizLeaderboard(quizId!);
  const deleteQuizMutation = useDeleteQuiz();

  // Handle quiz actions
  const handleEditQuiz = () => {
    navigate(`/quizzes/${quizId}/edit`);
  };

  const handleDeleteQuiz = async () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizId) return;
    
    try {
      await deleteQuizMutation.mutateAsync(quizId);
      navigate('/quizzes');
    } catch (err: any) {
      // Error is handled by the mutation's onError callback
      console.error('Delete failed:', err);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleStartQuiz = () => {
    navigate(`/quizzes/${quizId}/attempt`);
  };

  const handleManageQuestions = () => {
    navigate(`/quizzes/${quizId}/edit?tab=questions`);
  };

  const handleSaveManagement = async () => {
    if (!quizId || !managementData) return;
    setIsSavingManagement(true);
    try {
      await updateQuiz(quizId, managementData as import('@/types').UpdateQuizRequest);
      addToast({ type: 'success', message: 'Quiz settings saved.' });
      // Reset initial data to mark form as pristine after successful save
      setInitialManagementData({ ...managementData });
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to save changes.' });
    } finally {
      setIsSavingManagement(false);
    }
  };

  const handleStatusChange = async (newStatus: QuizStatus) => {
    if (!quizId) return;
    try {
      await updateQuizStatus(quizId, { status: newStatus });
      addToast({ type: 'success', message: `Quiz ${newStatus.toLowerCase()} successfully.` });
      setShowPublishModal(false);
      // Refetch quiz data to update UI
      window.location.reload(); // Simple way to refresh data
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to update quiz status.' });
    }
  };

  // Initialize local management form data when quiz loads
  React.useEffect(() => {
    if (quiz) {
      const initialData = {
        title: quiz.title,
        description: quiz.description,
        visibility: quiz.visibility,
        difficulty: quiz.difficulty,
        estimatedTime: quiz.estimatedTime,
        isRepetitionEnabled: quiz.isRepetitionEnabled,
        timerEnabled: quiz.timerEnabled,
        timerDuration: quiz.timerDuration,
        categoryId: quiz.categoryId,
        tagIds: quiz.tagIds,
      };
      setManagementData(initialData);
      setInitialManagementData(initialData);
    }
  }, [quiz]);

  // Check if form has unsaved changes
  const isDirty = React.useMemo(() => {
    if (!managementData || !initialManagementData) return false;
    return JSON.stringify(managementData) !== JSON.stringify(initialManagementData);
  }, [managementData, initialManagementData]);

  if (quizLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner />
      </div>
    );
  }

  if (quizError || !quiz) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-theme-bg-danger border border-theme-border-danger rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-theme-interactive-danger" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-theme-interactive-danger">{quizError?.message || 'Quiz not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Quiz Detail Header */}
      <QuizDetailHeader
        quiz={quiz}
        onEdit={handleEditQuiz}
        onDelete={handleDeleteQuiz}
        onStart={handleStartQuiz}
        onManageQuestions={handleManageQuestions}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg shadow-theme">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            {/* Tabs header attached to content */}
            <div className="px-4 sm:px-6 lg:px-8 border-b border-theme-border-primary">
              <TabsList>
                <TabsTrigger value="overview" icon={<ChartBarIcon className="w-4 h-4" />}>
                  Overview
                </TabsTrigger>
                <TabsTrigger value="management" icon={<Cog6ToothIcon className="w-4 h-4" />}>
                  Settings
                </TabsTrigger>
                <TabsTrigger value="export" icon={<ArrowUpOnSquareIcon className="w-4 h-4" />}>
                  Export
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content - inside same rounded container */}
            <div className="p-6">
              <TabsContent value="overview">
                <div className="space-y-6">
                  {stats && (
                    <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6">
                      <QuizStats stats={stats} useContainer={false} />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="management">
                {managementData && (
                  <>
                    <QuizManagementTab
                      quizId={quizId!}
                      quizData={managementData}
                      onDataChange={(updatedData) => setManagementData(prev => ({ ...(prev || {}), ...updatedData }))}
                      errors={managementErrors}
                      isEditing={true}
                    />
                    <div className="flex justify-center space-x-4 pt-6">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleSaveManagement}
                        disabled={isSavingManagement || !isDirty}
                        loading={isSavingManagement}
                      >
                        {isSavingManagement ? 'Saving…' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowPublishModal(true)}
                      >
                        Manage Status
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteQuiz}
                      >
                        Delete Quiz
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="export">
                <QuizExport quiz={quiz} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteQuiz}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz? This action cannot be undone."
        confirmText="Delete Quiz"
        variant="danger"
        isLoading={deleteQuizMutation.isPending}
      />

      {/* Publish/Status Modal */}
      {quiz && (
        <QuizPublishModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onConfirm={handleStatusChange}
          quiz={quiz}
        />
      )}
    </>
  );
};

export default QuizDetailPage;
