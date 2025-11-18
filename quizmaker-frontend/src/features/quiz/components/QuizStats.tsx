// src/components/QuizStats.tsx
// ---------------------------------------------------------------------------
// Quiz statistics display based on QuizResultSummaryDto
// ---------------------------------------------------------------------------

import React from 'react';
import { QuizResultSummaryDto } from '@/types';
import { getScoreStatus, getScoreBgStatus } from '@/utils/statusHelpers';
import { Card } from '@/components';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  SparklesIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface QuizStatsProps {
  stats: QuizResultSummaryDto;
  className?: string;
  useContainer?: boolean;
}

const QuizStats: React.FC<QuizStatsProps> = ({ stats, className = '', useContainer = true }) => {
  const formatPercentage = (value: number) => `${Math.round(value)}%`;
  const getScoreColor = getScoreStatus;
  const getScoreBgColor = getScoreBgStatus;

  // Calculate total number of questions from questionStats
  const totalQuestions = stats.questionStats?.length || 0;

  // Calculate percentages from raw scores
  // Backend returns:
  // - averageScore: total sum of correct answers across all attempts (need to divide by attemptsCount to get average per attempt)
  // - bestScore: best number of correct answers in a single attempt
  // - worstScore: worst number of correct answers in a single attempt
  // For averageScore: (totalCorrect / attemptsCount) / totalQuestions * 100
  // For bestScore/worstScore: correctAnswers / totalQuestions * 100
  const calculateAveragePercentage = (totalCorrect: number): number => {
    if (totalQuestions === 0 || stats.attemptsCount === 0) return 0;
    const averageCorrectPerAttempt = totalCorrect / stats.attemptsCount;
    return (averageCorrectPerAttempt / totalQuestions) * 100;
  };

  const calculateSingleAttemptPercentage = (correctAnswers: number): number => {
    if (totalQuestions === 0) return 0;
    return (correctAnswers / totalQuestions) * 100;
  };

  const averageScorePercentage = calculateAveragePercentage(stats.averageScore);
  const bestScorePercentage = calculateSingleAttemptPercentage(stats.bestScore);
  const worstScorePercentage = calculateSingleAttemptPercentage(stats.worstScore);

  const inner = (
    <>
      <div className="flex items-center mb-4">
        <ChartBarIcon className="w-5 h-5 text-theme-text-tertiary mr-2" />
        <h3 className="text-lg font-medium text-theme-text-primary">Quiz Statistics</h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Total Attempts */}
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-theme-bg-tertiary rounded-lg mx-auto mb-2 sm:mb-3">
            <DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6 text-theme-interactive-primary" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-theme-text-primary">{stats.attemptsCount}</p>
          <p className="text-xs sm:text-sm text-theme-text-secondary">Total Attempts</p>
        </div>

        {/* Average Score */}
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-theme-bg-tertiary rounded-lg mx-auto mb-2 sm:mb-3">
            <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-theme-interactive-success" />
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${getScoreColor(averageScorePercentage)}`}>{formatPercentage(averageScorePercentage)}</p>
          <p className="text-xs sm:text-sm text-theme-text-secondary">Average Score</p>
        </div>

        {/* Best Score */}
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-theme-bg-tertiary rounded-lg mx-auto mb-2 sm:mb-3">
            <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-theme-interactive-warning" />
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${getScoreColor(bestScorePercentage)}`}>{formatPercentage(bestScorePercentage)}</p>
          <p className="text-xs sm:text-sm text-theme-text-secondary">Best Score</p>
        </div>

        {/* Pass Rate */}
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-theme-bg-tertiary rounded-lg mx-auto mb-2 sm:mb-3">
            <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-theme-interactive-info" />
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${getScoreColor(stats.passRate)}`}>{formatPercentage(stats.passRate)}</p>
          <p className="text-xs sm:text-sm text-theme-text-secondary">Pass Rate</p>
        </div>
      </div>

      {/* Score Range */}
      <div className="mt-6 sm:mt-8">
        <h4 className="text-xs sm:text-sm font-medium text-theme-text-primary mb-3 sm:mb-4">Score Distribution</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-theme-bg-secondary rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-theme-text-secondary">Best Score</span>
              <span className={`text-xs sm:text-sm font-semibold ${getScoreColor(bestScorePercentage)}`}>{formatPercentage(bestScorePercentage)}</span>
            </div>
            <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
              <div className={`h-2 rounded-full ${getScoreColor(bestScorePercentage).replace('text-', 'bg-')}`} style={{ width: `${bestScorePercentage}%` }} />
            </div>
          </div>

          <div className="bg-theme-bg-secondary rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-theme-text-secondary">Average Score</span>
              <span className={`text-xs sm:text-sm font-semibold ${getScoreColor(averageScorePercentage)}`}>{formatPercentage(averageScorePercentage)}</span>
            </div>
            <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
              <div className={`h-2 rounded-full ${getScoreColor(averageScorePercentage).replace('text-', 'bg-')}`} style={{ width: `${averageScorePercentage}%` }} />
            </div>
          </div>

          <div className="bg-theme-bg-secondary rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-theme-text-secondary">Worst Score</span>
              <span className={`text-xs sm:text-sm font-semibold ${getScoreColor(worstScorePercentage)}`}>{formatPercentage(worstScorePercentage)}</span>
            </div>
            <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
              <div className={`h-2 rounded-full ${getScoreColor(worstScorePercentage).replace('text-', 'bg-')}`} style={{ width: `${worstScorePercentage}%` }} />
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
                <p className="text-sm text-theme-text-secondary">Total questions asked</p>
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