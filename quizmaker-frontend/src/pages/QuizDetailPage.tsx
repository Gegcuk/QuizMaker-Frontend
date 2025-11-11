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
import { updateQuiz } from '@/services';
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
  QuizManagementTab
} from '@/components';

const QuizDetailPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'management' | 'export'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [managementData, setManagementData] = useState<Partial<import('@/types').CreateQuizRequest | import('@/types').UpdateQuizRequest>>();
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
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to save changes.' });
    } finally {
      setIsSavingManagement(false);
    }
  };

  // Initialize local management form data when quiz loads
  React.useEffect(() => {
    if (quiz) {
      setManagementData({
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
      });
    }
  }, [quiz]);

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

  const tabs: { id: typeof activeTab; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'management', name: 'Settings', icon: Cog6ToothIcon },
    { id: 'export', name: 'Export', icon: ArrowUpOnSquareIcon }
  ];

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
          {/* Tabs header attached to content */}
          <div className="px-4 sm:px-6 lg:px-8 border-b border-theme-border-primary">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 rounded-none ${
                    activeTab === tab.id
                      ? 'border-theme-interactive-primary text-theme-interactive-primary'
                      : 'border-transparent'
                  }`}
                  leftIcon={(() => { const Icon = tab.icon; return <Icon className="w-4 h-4" />; })()}
                >
                  {tab.name}
                </Button>
              ))}
            </nav>
          </div>

          {/* Tab Content - inside same rounded container */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {stats && (
                  <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6">
                    <QuizStats stats={stats} useContainer={false} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'management' && managementData && (
              <>
                <QuizManagementTab
                  quizId={quizId!}
                  quizData={managementData}
                  onDataChange={(updatedData) => setManagementData(prev => ({ ...(prev || {}), ...updatedData }))}
                  errors={managementErrors}
                  isEditing={true}
                />
                <div className="flex justify-center space-x-4 pt-6 border-t border-theme-border-primary">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleSaveManagement}
                    disabled={isSavingManagement}
                    loading={isSavingManagement}
                  >
                    {isSavingManagement ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </>
            )}

            

            {activeTab === 'export' && (
              <QuizExport quiz={quiz} />
            )}

            {/* AI Generation tab removed */}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
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
    </>
  );
};

export default QuizDetailPage;
