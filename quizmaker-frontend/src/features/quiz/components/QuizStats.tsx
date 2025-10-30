// src/components/QuizStats.tsx
// ---------------------------------------------------------------------------
// Quiz statistics display based on QuizResultSummaryDto
// ---------------------------------------------------------------------------

import React from 'react';
import { QuizResultSummaryDto } from '@/types';
import { getScoreStatus, getScoreBgStatus } from '@/utils/statusHelpers';
import { Card } from '@/components';

interface QuizStatsProps {
  stats: QuizResultSummaryDto;
  className?: string;
  useContainer?: boolean;
}

const QuizStats: React.FC<QuizStatsProps> = ({ stats, className = '', useContainer = true }) => {
  const formatPercentage = (value: number) => `${Math.round(value)}%`;
  const getScoreColor = getScoreStatus;
  const getScoreBgColor = getScoreBgStatus;

  const inner = (
    <>
      <div className="flex items-center mb-4">
        <svg className="w-5 h-5 text-theme-text-tertiary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-medium text-theme-text-primary">Quiz Statistics</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Attempts */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-theme-bg-tertiary rounded-lg mx-auto mb-3">
            <svg className="w-6 h-6 text-theme-interactive-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-theme-text-primary">{stats.attemptsCount}</p>
          <p className="text-sm text-theme-text-secondary">Total Attempts</p>
        </div>

        {/* Average Score */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-theme-bg-tertiary rounded-lg mx-auto mb-3">
            <svg className="w-6 h-6 text-theme-interactive-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className={`text-2xl font-bold text-theme-interactive-primary`}>{formatPercentage(stats.averageScore)}</p>
          <p className="text-sm text-theme-text-secondary">Average Score</p>
        </div>

        {/* Best Score */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-theme-bg-tertiary rounded-lg mx-auto mb-3">
            <svg className="w-6 h-6 text-theme-interactive-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <p className={`text-2xl font-bold text-theme-interactive-success`}>{formatPercentage(stats.bestScore)}</p>
          <p className="text-sm text-theme-text-secondary">Best Score</p>
        </div>

        {/* Pass Rate */}
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-theme-bg-tertiary rounded-lg mx-auto mb-3">
            <svg className="w-6 h-6 text-theme-interactive-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className={`text-2xl font-bold ${getScoreColor(stats.passRate)}`}>{formatPercentage(stats.passRate)}</p>
          <p className="text-sm text-theme-text-secondary">Pass Rate</p>
        </div>
      </div>

      {/* Score Range */}
      <div className="mt-8">
        <h4 className="text-sm font-medium text-theme-text-primary mb-4">Score Distribution</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-theme-bg-secondary rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-theme-text-secondary">Best Score</span>
              <span className={`text-sm font-semibold ${getScoreColor(stats.bestScore)}`}>{formatPercentage(stats.bestScore)}</span>
            </div>
            <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
              <div className={`h-2 rounded-full bg-theme-interactive-success`} style={{ width: `${stats.bestScore}%` }} />
            </div>
          </div>

          <div className="bg-theme-bg-secondary rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-theme-text-secondary">Average Score</span>
              <span className={`text-sm font-semibold text-theme-interactive-primary`}>{formatPercentage(stats.averageScore)}</span>
            </div>
            <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
              <div className={`h-2 rounded-full bg-theme-interactive-primary`} style={{ width: `${stats.averageScore}%` }} />
            </div>
          </div>

          <div className="bg-theme-bg-secondary rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-theme-text-secondary">Worst Score</span>
              <span className={`text-sm font-semibold ${getScoreColor(stats.worstScore)}`}>{formatPercentage(stats.worstScore)}</span>
            </div>
            <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
              <div className={`h-2 rounded-full bg-theme-interactive-danger`} style={{ width: `${stats.worstScore}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Question Statistics Summary */}
      {stats.questionStats && stats.questionStats.length > 0 && (
        <div className="mt-8">
          <h4 className="text-sm font-medium text-theme-text-primary mb-4">Question Performance</h4>
          <div className="bg-theme-bg-secondary rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-theme-text-primary">{stats.questionStats.length}</p>
                <p className="text-sm text-theme-text-secondary">Total Questions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-theme-text-primary">
                  {Math.round(
                    stats.questionStats.reduce((sum, q) => sum + q.correctRate, 0) / stats.questionStats.length
                  )}%
                </p>
                <p className="text-sm text-theme-text-secondary">Average Success Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-theme-text-primary">
                  {stats.questionStats.reduce((sum, q) => sum + q.timesAsked, 0)}
                </p>
                <p className="text-sm text-theme-text-secondary">Total Times Asked</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (!useContainer) {
    return <div className={className}>{inner}</div>;
  }

  return <Card className={className}>{inner}</Card>;
};

export default QuizStats; 