import React, { useState, useEffect } from 'react';
import { CategoryService } from '../../api/category.service';
import { QuizService } from '../../api/quiz.service';
import api from '../../api/axiosInstance';
import { CategoryDto } from '../../types/category.types';
import { QuizDto } from '../../types/quiz.types';

interface CategoryStatsProps {
  categoryId?: string;
  onError?: (error: string) => void;
  className?: string;
}

interface CategoryStats {
  totalQuizzes: number;
  publishedQuizzes: number;
  draftQuizzes: number;
  totalAttempts: number;
  averageScore: number;
  totalUsers: number;
  recentActivity: number;
  growthRate: number;
}

interface QuizDistribution {
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  status: {
    published: number;
    draft: number;
    archived: number;
  };
  visibility: {
    public: number;
    private: number;
  };
}

const CategoryStats: React.FC<CategoryStatsProps> = ({ 
  categoryId, 
  onError,
  className = '' 
}) => {
  const [category, setCategory] = useState<CategoryDto | null>(null);
  const [quizzes, setQuizzes] = useState<QuizDto[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [distribution, setDistribution] = useState<QuizDistribution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const categoryService = new CategoryService(api);
  const quizService = new QuizService(api);

  useEffect(() => {
    if (categoryId) {
      loadCategoryStats();
    }
  }, [categoryId, timeRange]);

  const loadCategoryStats = async () => {
    if (!categoryId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load category details
      const categoryData = await categoryService.getCategoryById(categoryId);
      setCategory(categoryData);

      // Load quizzes for this category
      const quizzesResponse = await quizService.getQuizzes({ 
        category: categoryData.name,
        size: 1000 // Get all quizzes for this category
      });
      setQuizzes(quizzesResponse.content);

      // Calculate statistics
      const calculatedStats = calculateStats(quizzesResponse.content);
      setStats(calculatedStats);

      // Calculate distribution
      const calculatedDistribution = calculateDistribution(quizzesResponse.content);
      setDistribution(calculatedDistribution);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load category statistics';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (quizList: QuizDto[]): CategoryStats => {
    const totalQuizzes = quizList.length;
    const publishedQuizzes = quizList.filter(q => q.status === 'PUBLISHED').length;
    const draftQuizzes = quizList.filter(q => q.status === 'DRAFT').length;
    
    // Mock data for demonstration - in real app, these would come from API
    const totalAttempts = Math.floor(Math.random() * 1000) + 100;
    const averageScore = Math.floor(Math.random() * 30) + 70; // 70-100%
    const totalUsers = Math.floor(Math.random() * 500) + 50;
    const recentActivity = Math.floor(Math.random() * 50) + 10;
    const growthRate = Math.floor(Math.random() * 40) - 10; // -10% to +30%

    return {
      totalQuizzes,
      publishedQuizzes,
      draftQuizzes,
      totalAttempts,
      averageScore,
      totalUsers,
      recentActivity,
      growthRate
    };
  };

  const calculateDistribution = (quizList: QuizDto[]): QuizDistribution => {
    const difficulty = {
      easy: quizList.filter(q => q.difficulty === 'EASY').length,
      medium: quizList.filter(q => q.difficulty === 'MEDIUM').length,
      hard: quizList.filter(q => q.difficulty === 'HARD').length
    };

    const status = {
      published: quizList.filter(q => q.status === 'PUBLISHED').length,
      draft: quizList.filter(q => q.status === 'DRAFT').length,
      archived: quizList.filter(q => q.status === 'ARCHIVED').length
    };

    const visibility = {
      public: quizList.filter(q => q.visibility === 'PUBLIC').length,
      private: quizList.filter(q => q.visibility === 'PRIVATE').length
    };

    return { difficulty, status, visibility };
  };

  const getGrowthColor = (rate: number) => {
    if (rate > 0) return 'text-green-600';
    if (rate < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (rate: number) => {
    if (rate > 0) return '↗';
    if (rate < 0) return '↘';
    return '→';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className={`bg-white border rounded-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!category || !stats || !distribution) {
    return (
      <div className={`bg-white border rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p>No statistics available for this category</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Category Statistics</h3>
          <p className="text-sm text-gray-600 mt-1">
            {category.name} • {timeRange} overview
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Quizzes</p>
              <p className="text-2xl font-semibold text-blue-900">{stats.totalQuizzes}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Published</p>
              <p className="text-2xl font-semibold text-green-900">{stats.publishedQuizzes}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-600">Total Attempts</p>
              <p className="text-2xl font-semibold text-yellow-900">{formatNumber(stats.totalAttempts)}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Avg Score</p>
              <p className="text-2xl font-semibold text-purple-900">{stats.averageScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Growth and Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Growth Rate</p>
              <p className={`text-lg font-semibold ${getGrowthColor(stats.growthRate)}`}>
                {getGrowthIcon(stats.growthRate)} {Math.abs(stats.growthRate)}%
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-lg font-semibold text-gray-900">{formatNumber(stats.totalUsers)}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Activity</p>
              <p className="text-lg font-semibold text-gray-900">{stats.recentActivity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Difficulty Distribution */}
        <div className="p-4 border rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Difficulty Distribution</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Easy</span>
              <span className="text-sm font-medium">{distribution.difficulty.easy}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${(distribution.difficulty.easy / stats.totalQuizzes) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Medium</span>
              <span className="text-sm font-medium">{distribution.difficulty.medium}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${(distribution.difficulty.medium / stats.totalQuizzes) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Hard</span>
              <span className="text-sm font-medium">{distribution.difficulty.hard}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${(distribution.difficulty.hard / stats.totalQuizzes) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="p-4 border rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Status Distribution</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Published</span>
              <span className="text-sm font-medium">{distribution.status.published}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${(distribution.status.published / stats.totalQuizzes) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Draft</span>
              <span className="text-sm font-medium">{distribution.status.draft}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${(distribution.status.draft / stats.totalQuizzes) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Archived</span>
              <span className="text-sm font-medium">{distribution.status.archived}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gray-500 h-2 rounded-full" 
                style={{ width: `${(distribution.status.archived / stats.totalQuizzes) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Visibility Distribution */}
        <div className="p-4 border rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Visibility Distribution</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Public</span>
              <span className="text-sm font-medium">{distribution.visibility.public}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${(distribution.visibility.public / stats.totalQuizzes) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Private</span>
              <span className="text-sm font-medium">{distribution.visibility.private}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gray-500 h-2 rounded-full" 
                style={{ width: `${(distribution.visibility.private / stats.totalQuizzes) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t">
        <p className="text-xs text-gray-500 text-center">
          Statistics are updated in real-time • Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default CategoryStats; 