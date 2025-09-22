// ---------------------------------------------------------------------------
// QuestionAnalytics.tsx - Question performance analytics component
// Based on QUESTION_ENDPOINTS from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionDto, QuestionType, QuestionDifficulty } from '../../types/question.types';
// TODO: Implement getQuestionAnalytics in question.service.ts
// import { getQuestionAnalytics } from '../../api/question.service';
import { Spinner } from '../../../components/ui';

interface QuestionAnalyticsProps {
  questionId?: string; // If provided, show analytics for specific question
  quizId?: string; // If provided, show analytics for questions in this quiz
  className?: string;
}

interface QuestionAnalyticsData {
  questionId: string;
  timesAsked: number;
  timesCorrect: number;
  correctRate: number;
  averageTimeSpent: number;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  typeBreakdown: {
    [key in QuestionType]: number;
  };
  recentPerformance: {
    date: string;
    correctRate: number;
    attempts: number;
  }[];
}

const QuestionAnalytics: React.FC<QuestionAnalyticsProps> = ({
  questionId,
  quizId,
  className = ''
}) => {
  const [analytics, setAnalytics] = useState<QuestionAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Load analytics data
  useEffect(() => {
    loadAnalytics();
  }, [questionId, quizId, selectedTimeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implement getQuestionAnalytics in question.service.ts
      // const data = await getQuestionAnalytics({ questionId, quizId, timeRange: selectedTimeRange });
      // setAnalytics(data);
      
      // Mock data for now
      setAnalytics({
        questionId: questionId || 'mock-id',
        timesAsked: 156,
        timesCorrect: 124,
        correctRate: 79.5,
        averageTimeSpent: 45.2,
        difficultyBreakdown: {
          easy: 45,
          medium: 78,
          hard: 33
        },
        typeBreakdown: {
          MCQ_SINGLE: 67,
          MCQ_MULTI: 23,
          TRUE_FALSE: 34,
          OPEN: 12,
          FILL_GAP: 8,
          COMPLIANCE: 5,
          ORDERING: 4,
          HOTSPOT: 3
        },
        recentPerformance: [
          { date: '2024-01-15', correctRate: 82, attempts: 12 },
          { date: '2024-01-16', correctRate: 78, attempts: 15 },
          { date: '2024-01-17', correctRate: 85, attempts: 8 },
          { date: '2024-01-18', correctRate: 76, attempts: 18 },
          { date: '2024-01-19', correctRate: 81, attempts: 14 },
          { date: '2024-01-20', correctRate: 79, attempts: 16 },
          { date: '2024-01-21', correctRate: 83, attempts: 11 }
        ]
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBgColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100';
    if (rate >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className={`bg-white shadow rounded-lg border border-gray-200 ${className}`}>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Question Analytics</h3>
        </div>
        <div className="px-6 py-12 text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error || 'No analytics data available'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Question Analytics</h3>
            <p className="text-sm text-gray-500">
              Performance metrics and insights
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
              className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Attempts */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Attempts</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.timesAsked}</p>
              </div>
            </div>
          </div>

          {/* Correct Answers */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Correct Answers</p>
                <p className="text-2xl font-bold text-green-900">{analytics.timesCorrect}</p>
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className={`${getPerformanceBgColor(analytics.correctRate)} rounded-lg p-4`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className={`h-8 w-8 ${getPerformanceColor(analytics.correctRate)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.correctRate)}`}>
                  {formatPercentage(analytics.correctRate)}
                </p>
              </div>
            </div>
          </div>

          {/* Average Time */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Avg. Time</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatTime(analytics.averageTimeSpent)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Difficulty Breakdown */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Difficulty Breakdown</h4>
            <div className="space-y-4">
              {Object.entries(analytics.difficultyBreakdown).map(([difficulty, count]) => (
                <div key={difficulty} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{difficulty}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / analytics.timesAsked) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question Type Breakdown */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Question Type Distribution</h4>
            <div className="space-y-4">
              {Object.entries(analytics.typeBreakdown)
                .filter(([_, count]) => count > 0)
                .sort(([_, a], [__, b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {type.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(count / analytics.timesAsked) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Recent Performance Chart */}
        <div className="mt-8">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Performance Trend</h4>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-end justify-between h-32">
              {analytics.recentPerformance.map((data, index) => (
                <div key={data.date} className="flex flex-col items-center space-y-2">
                  <div
                    className="bg-blue-600 rounded-t w-8"
                    style={{ height: `${(data.correctRate / 100) * 80}px` }}
                  />
                  <span className="text-xs text-gray-500">
                    {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-xs font-medium text-gray-700">
                    {formatPercentage(data.correctRate)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-8">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Performance Summary</h5>
              <p className="text-sm text-blue-800">
                This question has a {formatPercentage(analytics.correctRate)} success rate, 
                which is {analytics.correctRate >= 80 ? 'excellent' : analytics.correctRate >= 60 ? 'good' : 'needs improvement'}.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-green-900 mb-2">Time Analysis</h5>
              <p className="text-sm text-green-800">
                Students spend an average of {formatTime(analytics.averageTimeSpent)} on this question,
                indicating {analytics.averageTimeSpent <= 30 ? 'quick comprehension' : analytics.averageTimeSpent <= 60 ? 'moderate difficulty' : 'high complexity'}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionAnalytics; 