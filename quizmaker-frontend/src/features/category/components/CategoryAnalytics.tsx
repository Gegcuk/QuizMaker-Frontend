import React, { useState, useEffect } from 'react';
import { CategoryDto } from '@/types';
import { QuizDto, Difficulty, Visibility, QuizStatus } from '@/types';
import { categoryService } from '@/services';
import { QuizService } from '../../../api/quiz.service';
import api from '../../../api/axiosInstance';

interface CategoryAnalyticsProps {
  category: CategoryDto;
  className?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

interface AnalyticsData {
  quizCreationTrend: Array<{ date: string; count: number }>;
  difficultyBreakdown: Record<Difficulty, number>;
  visibilityBreakdown: Record<Visibility, number>;
  statusBreakdown: Record<QuizStatus, number>;
  averageMetrics: {
    estimatedTime: number;
    timerDuration: number;
    questionsPerQuiz: number;
  };
  topQuizzes: Array<{
    quiz: QuizDto;
    popularity: number;
  }>;
  featureUsage: {
    timerEnabled: number;
    repetitionEnabled: number;
    publicQuizzes: number;
  };
}

export const CategoryAnalytics: React.FC<CategoryAnalyticsProps> = ({
  category,
  className = '',
  timeRange = 'month'
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  const quizService = new QuizService(api);

  useEffect(() => {
    loadAnalyticsData();
  }, [category.id, selectedTimeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all quizzes for this category
      const quizzesResponse = await quizService.getQuizzes({
        category: category.id,
        size: 1000
      });

      const categoryQuizzes = quizzesResponse.content;
      const calculatedData = calculateAnalyticsData(categoryQuizzes, selectedTimeRange);
      setAnalyticsData(calculatedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalyticsData = (quizzes: QuizDto[], range: string): AnalyticsData => {
    const now = new Date();
    const startDate = getStartDate(now, range);
    
    // Filter quizzes by time range
    const filteredQuizzes = quizzes.filter(quiz => {
      const quizDate = new Date(quiz.createdAt);
      return quizDate >= startDate;
    });

    // Quiz creation trend
    const trendData = generateTrendData(filteredQuizzes, startDate, now, range);

    // Breakdowns
    const difficultyBreakdown: Record<Difficulty, number> = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0
    };

    const visibilityBreakdown: Record<Visibility, number> = {
      PUBLIC: 0,
      PRIVATE: 0
    };

    const statusBreakdown: Record<QuizStatus, number> = {
      DRAFT: 0,
      PUBLISHED: 0,
      ARCHIVED: 0
    };

    let totalEstimatedTime = 0;
    let totalTimerDuration = 0;
    let timerEnabledCount = 0;
    let repetitionEnabledCount = 0;
    let publicQuizzesCount = 0;

    filteredQuizzes.forEach(quiz => {
      difficultyBreakdown[quiz.difficulty]++;
      visibilityBreakdown[quiz.visibility]++;
      statusBreakdown[quiz.status]++;

      totalEstimatedTime += quiz.estimatedTime;
      totalTimerDuration += quiz.timerDuration;

      if (quiz.timerEnabled) timerEnabledCount++;
      if (quiz.isRepetitionEnabled) repetitionEnabledCount++;
      if (quiz.visibility === 'PUBLIC') publicQuizzesCount++;
    });

    // Top quizzes (sorted by creation date for now, could be by popularity later)
    const topQuizzes = filteredQuizzes
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(quiz => ({
        quiz,
        popularity: Math.floor(Math.random() * 100) + 1 // Placeholder for actual popularity
      }));

    return {
      quizCreationTrend: trendData,
      difficultyBreakdown,
      visibilityBreakdown,
      statusBreakdown,
      averageMetrics: {
        estimatedTime: filteredQuizzes.length > 0 ? Math.round(totalEstimatedTime / filteredQuizzes.length) : 0,
        timerDuration: filteredQuizzes.length > 0 ? Math.round(totalTimerDuration / filteredQuizzes.length) : 0,
        questionsPerQuiz: 10 // Placeholder, would need question data
      },
      topQuizzes,
      featureUsage: {
        timerEnabled: timerEnabledCount,
        repetitionEnabled: repetitionEnabledCount,
        publicQuizzes: publicQuizzesCount
      }
    };
  };

  const getStartDate = (now: Date, range: string): Date => {
    switch (range) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  };

  const generateTrendData = (quizzes: QuizDto[], startDate: Date, endDate: Date, range: string) => {
    const data: Array<{ date: string; count: number }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const count = quizzes.filter(quiz => {
        const quizDate = new Date(quiz.createdAt).toISOString().split('T')[0];
        return quizDate === dateStr;
      }).length;

      data.push({ date: dateStr, count });

      // Move to next period
      switch (range) {
        case 'week':
          current.setDate(current.getDate() + 1);
          break;
        case 'month':
          current.setDate(current.getDate() + 1);
          break;
        case 'quarter':
          current.setDate(current.getDate() + 7);
          break;
        case 'year':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    return data;
  };

  const renderBarChart = (data: Record<string, number>, title: string, colors: Record<string, string>) => {
    const maxValue = Math.max(...Object.values(data));
    
    return (
      <div className="bg-white rounded-lg p-4 border">
        <h4 className="text-lg font-medium text-gray-900 mb-4">{title}</h4>
        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex items-center">
              <div className="w-20 text-sm font-medium text-gray-600">{key}</div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${colors[key] || 'bg-blue-500'}`}
                    style={{ width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-12 text-sm font-medium text-gray-900 text-right">{value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTrendChart = (data: Array<{ date: string; count: number }>) => {
    const maxValue = Math.max(...data.map(d => d.count));
    const height = 200;
    
    return (
      <div className="bg-white rounded-lg p-4 border">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Quiz Creation Trend</h4>
        <div className="relative" style={{ height: `${height}px` }}>
          <svg className="w-full h-full" viewBox={`0 0 ${data.length * 40} ${height}`}>
            {data.map((point, index) => {
              const x = index * 40;
              const y = height - (point.count / maxValue) * height;
              const nextPoint = data[index + 1];
              
              if (nextPoint) {
                const nextX = (index + 1) * 40;
                const nextY = height - (nextPoint.count / maxValue) * height;
                
                return (
                  <g key={index}>
                    <line
                      x1={x}
                      y1={y}
                      x2={nextX}
                      y2={nextY}
                      stroke="#3B82F6"
                      strokeWidth="2"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#3B82F6"
                    />
                  </g>
                );
              }
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#3B82F6"
                />
              );
            })}
          </svg>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-600">Loading analytics...</span>
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

  if (!analyticsData) {
    return null;
  }

  const difficultyColors = {
    EASY: 'bg-green-500',
    MEDIUM: 'bg-yellow-500',
    HARD: 'bg-red-500'
  };

  const visibilityColors = {
    PUBLIC: 'bg-blue-500',
    PRIVATE: 'bg-gray-500'
  };

  const statusColors = {
    DRAFT: 'bg-yellow-500',
    PUBLISHED: 'bg-green-500',
    ARCHIVED: 'bg-red-500'
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Category Analytics</h3>
            <p className="text-sm text-gray-500 mt-1">{category.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTrendChart(analyticsData.quizCreationTrend)}
        
        {/* Average Metrics */}
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Average Metrics</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Estimated Time:</span>
              <span className="text-lg font-bold text-gray-900">{analyticsData.averageMetrics.estimatedTime} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Timer Duration:</span>
              <span className="text-lg font-bold text-gray-900">{analyticsData.averageMetrics.timerDuration} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Questions per Quiz:</span>
              <span className="text-lg font-bold text-gray-900">{analyticsData.averageMetrics.questionsPerQuiz}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderBarChart(analyticsData.difficultyBreakdown, 'Difficulty Distribution', difficultyColors)}
        {renderBarChart(analyticsData.visibilityBreakdown, 'Visibility Distribution', visibilityColors)}
        {renderBarChart(analyticsData.statusBreakdown, 'Status Distribution', statusColors)}
      </div>

      {/* Feature Usage */}
      <div className="bg-white rounded-lg p-6 border">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Feature Usage</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{analyticsData.featureUsage.timerEnabled}</div>
            <div className="text-sm text-gray-600">Timer Enabled</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{analyticsData.featureUsage.repetitionEnabled}</div>
            <div className="text-sm text-gray-600">Repetition Enabled</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{analyticsData.featureUsage.publicQuizzes}</div>
            <div className="text-sm text-gray-600">Public Quizzes</div>
          </div>
        </div>
      </div>

      {/* Top Quizzes */}
      <div className="bg-white rounded-lg p-6 border">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Top Quizzes</h4>
        <div className="space-y-3">
          {analyticsData.topQuizzes.map((item, index) => (
            <div key={item.quiz.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{item.quiz.title}</div>
                  <div className="text-sm text-gray-500">
                    {item.quiz.difficulty} • {item.quiz.visibility} • {item.quiz.status}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{item.popularity}%</div>
                <div className="text-xs text-gray-500">Popularity</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 