import React, { useState, useEffect } from 'react';
import { CategoryDto } from '@/types';
import { QuizDto, Difficulty } from '@/types';
import { categoryService } from '@/services';
import { QuizService } from '@/services';
import { api } from '@/services';

interface CategoryStatsProps {
  category: CategoryDto;
  className?: string;
  showDetails?: boolean;
}

interface CategoryStatistics {
  totalQuizzes: number;
  publicQuizzes: number;
  privateQuizzes: number;
  draftQuizzes: number;
  publishedQuizzes: number;
  archivedQuizzes: number;
  difficultyDistribution: Record<Difficulty, number>;
  averageEstimatedTime: number;
  averageTimerDuration: number;
  repetitionEnabledCount: number;
  timerEnabledCount: number;
  recentActivity: {
    lastCreated: Date | null;
    lastUpdated: Date | null;
    lastAttempted: Date | null;
  };
  growthMetrics: {
    quizzesThisMonth: number;
    quizzesLastMonth: number;
    growthRate: number;
  };
}

export const CategoryStats: React.FC<CategoryStatsProps> = ({
  category,
  className = '',
  showDetails = true
}) => {
  const [stats, setStats] = useState<CategoryStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<QuizDto[]>([]);

  const quizService = new QuizService(api);

  useEffect(() => {
    loadCategoryStats();
  }, [category.id]);

  const loadCategoryStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all quizzes for this category
      const quizzesResponse = await quizService.getQuizzes({
        category: category.id,
        size: 1000 // Get all quizzes for accurate stats
      });

      const categoryQuizzes = quizzesResponse.content;
      setQuizzes(categoryQuizzes);

      // Calculate statistics
      const calculatedStats = calculateStats(categoryQuizzes);
      setStats(calculatedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load category statistics');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (categoryQuizzes: QuizDto[]): CategoryStatistics => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const difficultyDistribution: Record<Difficulty, number> = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0
    };

    let totalEstimatedTime = 0;
    let totalTimerDuration = 0;
    let repetitionEnabledCount = 0;
    let timerEnabledCount = 0;
    let quizzesThisMonth = 0;
    let quizzesLastMonth = 0;

    let lastCreated: Date | null = null;
    let lastUpdated: Date | null = null;

    categoryQuizzes.forEach(quiz => {
      // Difficulty distribution
      difficultyDistribution[quiz.difficulty]++;

      // Time calculations
      totalEstimatedTime += quiz.estimatedTime;
      totalTimerDuration += quiz.timerDuration;

      // Feature counts
      if (quiz.isRepetitionEnabled) repetitionEnabledCount++;
      if (quiz.timerEnabled) timerEnabledCount++;

      // Activity tracking
      const createdDate = new Date(quiz.createdAt);
      const updatedDate = new Date(quiz.updatedAt);

      if (!lastCreated || createdDate > lastCreated) {
        lastCreated = createdDate;
      }
      if (!lastUpdated || updatedDate > lastUpdated) {
        lastUpdated = updatedDate;
      }

      // Monthly growth
      if (createdDate >= thisMonth) {
        quizzesThisMonth++;
      } else if (createdDate >= lastMonth && createdDate < thisMonth) {
        quizzesLastMonth++;
      }
    });

    const growthRate = quizzesLastMonth > 0 
      ? ((quizzesThisMonth - quizzesLastMonth) / quizzesLastMonth) * 100 
      : quizzesThisMonth > 0 ? 100 : 0;

    return {
      totalQuizzes: categoryQuizzes.length,
      publicQuizzes: categoryQuizzes.filter(q => q.visibility === 'PUBLIC').length,
      privateQuizzes: categoryQuizzes.filter(q => q.visibility === 'PRIVATE').length,
      draftQuizzes: categoryQuizzes.filter(q => q.status === 'DRAFT').length,
      publishedQuizzes: categoryQuizzes.filter(q => q.status === 'PUBLISHED').length,
      archivedQuizzes: categoryQuizzes.filter(q => q.status === 'ARCHIVED').length,
      difficultyDistribution,
      averageEstimatedTime: categoryQuizzes.length > 0 ? Math.round(totalEstimatedTime / categoryQuizzes.length) : 0,
      averageTimerDuration: categoryQuizzes.length > 0 ? Math.round(totalTimerDuration / categoryQuizzes.length) : 0,
      repetitionEnabledCount,
      timerEnabledCount,
      recentActivity: {
        lastCreated,
        lastUpdated,
        lastAttempted: null // Would need attempt data to calculate this
      },
      growthMetrics: {
        quizzesThisMonth,
        quizzesLastMonth,
        growthRate
      }
    };
  };

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HARD': return 'text-red-600 bg-red-100';
      default: return 'text-theme-text-secondary bg-theme-bg-tertiary';
    }
  };

  const getGrowthIcon = (growthRate: number) => {
    if (growthRate > 0) {
      return (
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      );
    } else if (growthRate < 0) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-theme-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className={`bg-theme-bg-primary rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-theme-text-secondary">Loading statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`bg-theme-bg-primary rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Category Statistics</h3>
        <p className="text-sm text-gray-500 mt-1">{category.name}</p>
      </div>

      {/* Main Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Quizzes */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Quizzes</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalQuizzes}</p>
              </div>
            </div>
          </div>

          {/* Published Quizzes */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Published</p>
                <p className="text-2xl font-bold text-green-900">{stats.publishedQuizzes}</p>
              </div>
            </div>
          </div>

          {/* Public Quizzes */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Public</p>
                <p className="text-2xl font-bold text-purple-900">{stats.publicQuizzes}</p>
              </div>
            </div>
          </div>

          {/* Growth Rate */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {getGrowthIcon(stats.growthMetrics.growthRate)}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Growth Rate</p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.growthMetrics.growthRate > 0 ? '+' : ''}{stats.growthMetrics.growthRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {showDetails && (
          <>
            {/* Difficulty Distribution */}
            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Difficulty Distribution</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(stats.difficultyDistribution).map(([difficulty, count]) => (
                  <div key={difficulty} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty as Difficulty)}`}>
                        {difficulty}
                      </span>
                      <span className="text-lg font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            difficulty === 'EASY' ? 'bg-green-500' :
                            difficulty === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${stats.totalQuizzes > 0 ? (count / stats.totalQuizzes) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-theme-text-secondary">Avg. Time (min)</p>
                <p className="text-xl font-bold text-gray-900">{stats.averageEstimatedTime}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-theme-text-secondary">Timer Enabled</p>
                <p className="text-xl font-bold text-gray-900">{stats.timerEnabledCount}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-theme-text-secondary">Repetition Enabled</p>
                <p className="text-xl font-bold text-gray-900">{stats.repetitionEnabledCount}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-theme-text-secondary">Draft Quizzes</p>
                <p className="text-xl font-bold text-gray-900">{stats.draftQuizzes}</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-theme-text-secondary">Last Created:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {stats.recentActivity.lastCreated 
                        ? new Date(stats.recentActivity.lastCreated).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-theme-text-secondary">Last Updated:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {stats.recentActivity.lastUpdated 
                        ? new Date(stats.recentActivity.lastUpdated).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 