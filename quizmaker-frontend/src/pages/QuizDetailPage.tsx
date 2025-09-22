// ---------------------------------------------------------------------------
// Enhanced Quiz Detail Page with all analytics and management components
// Route: /quizzes/:quizId
// Integrates all components from section 3.3 Quiz Details & Analytics
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { getQuizById, deleteQuiz } from '@/services';
import { QuizDto, QuizResultSummaryDto } from '@/types';
import { 
  Spinner, 
  ConfirmationModal,
  QuizDetailHeader,
  QuizStats,
  QuizLeaderboard,
  QuizAnalytics,
  QuizShare,
  QuizExport,
  QuizGenerationJobs,
  QuizManagementTab
} from '@/components';

const QuizDetailPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'management' | 'analytics' | 'leaderboard' | 'export' | 'generation'>('overview');

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Mock data for components that need it
  const mockStats: QuizResultSummaryDto = {
    quizId: quizId || '',
    attemptsCount: 156,
    averageScore: 78.5,
    bestScore: 95.0,
    worstScore: 45.0,
    passRate: 82.3,
    questionStats: []
  };

  const mockLeaderboardEntries = [
    { userId: '1', username: 'John Doe', bestScore: 95 },
    { userId: '2', username: 'Jane Smith', bestScore: 92 },
    { userId: '3', username: 'Bob Johnson', bestScore: 88 },
    { userId: '4', username: 'Alice Brown', bestScore: 85 },
    { userId: '5', username: 'Charlie Wilson', bestScore: 82 }
  ];

  // Fetch quiz on mount / id change
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      setLoading(true);
      setError(null);
      try {
        const quizData = await getQuizById(quizId);
        setQuiz(quizData);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Quiz not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  // Handle quiz actions
  const handleEditQuiz = () => {
    navigate(`/quizzes/${quizId}/edit`);
  };

  const handleDeleteQuiz = async () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizId) return;
    
    setIsDeleting(true);
    try {
      await deleteQuiz(quizId);
      navigate('/quizzes');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete quiz.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleStartQuiz = () => {
    navigate(`/quizzes/${quizId}/attempt`);
  };

  const handleManageQuestions = () => {
    navigate(`/quizzes/${quizId}/edit?tab=questions`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error || 'Quiz not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'management', name: 'Management', icon: '⚙️' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'leaderboard', name: 'Leaderboard', icon: '🏆' },
    { id: 'export', name: 'Export', icon: '📤' },
    { id: 'generation', name: 'AI Generation', icon: '🤖' }
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Quiz Detail Header */}
      <QuizDetailHeader
        quiz={quiz}
        onEdit={handleEditQuiz}
        onDelete={handleDeleteQuiz}
        onStart={handleStartQuiz}
        onManageQuestions={handleManageQuestions}
        onManageGeneration={() => navigate(`/quizzes/${quizId}/generation`)}
      />

      {/* Tab Navigation */}
      <div className="mt-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quiz Statistics */}
            <QuizStats stats={mockStats} />
            
            {/* Social Sharing */}
            <QuizShare quiz={quiz} />
          </div>
        )}

        {activeTab === 'management' && (
          <QuizManagementTab
            quizId={quizId!}
            quizData={{
              title: quiz.title,
              description: quiz.description,
              visibility: quiz.visibility,
              difficulty: quiz.difficulty,
              estimatedTime: quiz.estimatedTime,
              isRepetitionEnabled: quiz.isRepetitionEnabled,
              timerEnabled: quiz.timerEnabled,
              timerDuration: quiz.timerDuration,
              categoryId: quiz.categoryId,
              tagIds: quiz.tagIds
            }}
            onDataChange={(updatedData) => {
              // TODO: Implement quiz update logic
              console.log('Quiz data updated:', updatedData);
            }}
            isEditing={true}
          />
        )}

        {activeTab === 'analytics' && (
          <QuizAnalytics stats={mockStats} />
        )}

        {activeTab === 'leaderboard' && (
          <QuizLeaderboard entries={mockLeaderboardEntries} />
        )}

        {activeTab === 'export' && (
          <QuizExport quiz={quiz} />
        )}

        {activeTab === 'generation' && (
          <QuizGenerationJobs quizId={quizId!} />
        )}
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
        isLoading={isDeleting}
      />
    </div>
  );
};

export default QuizDetailPage;
