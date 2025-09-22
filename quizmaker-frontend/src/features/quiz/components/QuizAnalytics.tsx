// src/components/QuizAnalytics.tsx
// ---------------------------------------------------------------------------
// Detailed analytics charts based on QuizResultSummaryDto, QuestionStatDto
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { QuizResultSummaryDto, QuestionStatDto } from '@/types';

interface QuizAnalyticsProps {
  stats: QuizResultSummaryDto;
  className?: string;
}

const QuizAnalytics: React.FC<QuizAnalyticsProps> = ({ stats, className = '' }) => {
  const [selectedChart, setSelectedChart] = useState<'score-distribution' | 'question-performance' | 'attempt-trends'>('score-distribution');

  // Helper function to format percentage
  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  // Helper function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Helper function to get question performance color
  const getQuestionColor = (correctRate: number) => {
    if (correctRate >= 80) return 'bg-green-500';
    if (correctRate >= 60) return 'bg-yellow-500';
    if (correctRate >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Mock data for score distribution (in a real app, this would come from the API)
  const getScoreDistribution = () => {
    return [
      { range: '90-100%', count: Math.floor(stats.attemptsCount * 0.2), percentage: 20 },
      { range: '80-89%', count: Math.floor(stats.attemptsCount * 0.3), percentage: 30 },
      { range: '70-79%', count: Math.floor(stats.attemptsCount * 0.25), percentage: 25 },
      { range: '60-69%', count: Math.floor(stats.attemptsCount * 0.15), percentage: 15 },
      { range: '0-59%', count: Math.floor(stats.attemptsCount * 0.1), percentage: 10 }
    ];
  };

  // Mock data for attempt trends (in a real app, this would come from the API)
  const getAttemptTrends = () => {
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        attempts: Math.floor(Math.random() * 10) + 1,
        averageScore: Math.floor(Math.random() * 40) + 60
      });
    }
    return last7Days;
  };

  const scoreDistribution = getScoreDistribution();
  const attemptTrends = getAttemptTrends();

  return (
    <div className={`bg-white shadow rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
          </div>
          
          {/* Chart Type Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedChart('score-distribution')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedChart === 'score-distribution'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Score Distribution
            </button>
            <button
              onClick={() => setSelectedChart('question-performance')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedChart === 'question-performance'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Question Performance
            </button>
            <button
              onClick={() => setSelectedChart('attempt-trends')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedChart === 'attempt-trends'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Attempt Trends
            </button>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="px-6 py-6">
        {selectedChart === 'score-distribution' && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Score Distribution</h4>
            <div className="space-y-4">
              {scoreDistribution.map((item, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium text-gray-700">
                    {item.range}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{item.count} attempts</span>
                      <span className="text-sm font-medium text-gray-900">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedChart === 'question-performance' && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Question Performance</h4>
            {stats.questionStats && stats.questionStats.length > 0 ? (
              <div className="space-y-4">
                {stats.questionStats.slice(0, 10).map((question, index) => (
                  <div key={question.questionId} className="flex items-center space-x-4">
                    <div className="w-8 text-sm font-medium text-gray-700">
                      Q{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">
                          {question.timesCorrect}/{question.timesAsked} correct
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatPercentage(question.correctRate)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getQuestionColor(question.correctRate)}`}
                          style={{ width: `${question.correctRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
                {stats.questionStats.length > 10 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-500">
                      Showing top 10 questions • {stats.questionStats.length - 10} more questions
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No question statistics available</p>
              </div>
            )}
          </div>
        )}

        {selectedChart === 'attempt-trends' && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Attempt Trends (Last 7 Days)</h4>
            <div className="space-y-4">
              {attemptTrends.map((day, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-16 text-sm font-medium text-gray-700">
                    {day.date}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{day.attempts} attempts</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatPercentage(day.averageScore)} avg
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${(day.attempts / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Key Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">Performance Trend</p>
                  <p className="text-xs text-blue-700">
                    {stats.averageScore > 70 ? 'Strong' : stats.averageScore > 50 ? 'Moderate' : 'Needs Improvement'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-900">Pass Rate</p>
                  <p className="text-xs text-green-700">
                    {formatPercentage(stats.passRate)} of attempts passed
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-purple-900">Engagement</p>
                  <p className="text-xs text-purple-700">
                    {stats.attemptsCount} total attempts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAnalytics; 