// src/components/QuizStats.tsx
// ---------------------------------------------------------------------------
// Quiz statistics display based on QuizResultSummaryDto
// ---------------------------------------------------------------------------

import React from 'react';
import { QuizResultSummaryDto } from '../../types/quiz.types';

interface QuizStatsProps {
  stats: QuizResultSummaryDto;
  className?: string;
}

const QuizStats: React.FC<QuizStatsProps> = ({ stats, className = '' }) => {
  // Helper function to format percentage
  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  // Helper function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Helper function to get background color based on score
  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className={`bg-white shadow rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Quiz Statistics</h3>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Attempts */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.attemptsCount}</p>
            <p className="text-sm text-gray-500">Total Attempts</p>
          </div>

          {/* Average Score */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
              {formatPercentage(stats.averageScore)}
            </p>
            <p className="text-sm text-gray-500">Average Score</p>
          </div>

          {/* Best Score */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <p className={`text-2xl font-bold ${getScoreColor(stats.bestScore)}`}>
              {formatPercentage(stats.bestScore)}
            </p>
            <p className="text-sm text-gray-500">Best Score</p>
          </div>

          {/* Pass Rate */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className={`text-2xl font-bold ${getScoreColor(stats.passRate)}`}>
              {formatPercentage(stats.passRate)}
            </p>
            <p className="text-sm text-gray-500">Pass Rate</p>
          </div>
        </div>

        {/* Score Range */}
        <div className="mt-8">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Score Distribution</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Best Score</span>
                <span className={`text-sm font-semibold ${getScoreColor(stats.bestScore)}`}>
                  {formatPercentage(stats.bestScore)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getScoreBgColor(stats.bestScore)}`}
                  style={{ width: `${stats.bestScore}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Average Score</span>
                <span className={`text-sm font-semibold ${getScoreColor(stats.averageScore)}`}>
                  {formatPercentage(stats.averageScore)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getScoreBgColor(stats.averageScore)}`}
                  style={{ width: `${stats.averageScore}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Worst Score</span>
                <span className={`text-sm font-semibold ${getScoreColor(stats.worstScore)}`}>
                  {formatPercentage(stats.worstScore)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getScoreBgColor(stats.worstScore)}`}
                  style={{ width: `${stats.worstScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Statistics Summary */}
        {stats.questionStats && stats.questionStats.length > 0 && (
          <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Question Performance</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.questionStats.length}
                  </p>
                  <p className="text-sm text-gray-500">Total Questions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(stats.questionStats.reduce((sum, q) => sum + q.correctRate, 0) / stats.questionStats.length)}%
                  </p>
                  <p className="text-sm text-gray-500">Average Success Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.questionStats.reduce((sum, q) => sum + q.timesAsked, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Times Asked</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizStats; 