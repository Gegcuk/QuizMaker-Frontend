// src/components/attempt/ScoreDisplay.tsx
// ---------------------------------------------------------------------------
// Component for displaying detailed score breakdown and performance metrics
// Shows score distribution, performance trends, and achievement badges
// ---------------------------------------------------------------------------

import React from 'react';
import { AttemptResultDto, AnswerSubmissionDto } from '@/types';

interface ScoreDisplayProps {
  result: AttemptResultDto;
  showDetails?: boolean;
  className?: string;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  result,
  showDetails = true,
  className = ''
}) => {
  const accuracy = result.totalQuestions > 0 ? (result.correctCount / result.totalQuestions) * 100 : 0;
  const score = result.totalQuestions > 0 ? (result.totalScore / result.totalQuestions) * 100 : 0;
  const incorrectCount = result.totalQuestions - result.correctCount;
  
  const getScoreGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 45) return 'D+';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600 bg-green-100 border-green-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getScoreMessage = (percentage: number): string => {
    if (percentage >= 90) return 'Outstanding! Exceptional performance!';
    if (percentage >= 80) return 'Excellent! Great work!';
    if (percentage >= 70) return 'Good! Solid understanding!';
    if (percentage >= 60) return 'Satisfactory! Room for improvement.';
    if (percentage >= 50) return 'Needs improvement. Keep practicing!';
    return 'Requires significant improvement. Review the material.';
  };

  const getAchievementBadges = (percentage: number): string[] => {
    const badges: string[] = [];
    
    if (percentage >= 90) badges.push('🏆 Perfect Score', '🎯 Master', '⭐ Elite');
    else if (percentage >= 80) badges.push('🎉 Excellent', '📚 Scholar', '💎 Diamond');
    else if (percentage >= 70) badges.push('👍 Good Job', '📖 Learner', '🔶 Bronze');
    else if (percentage >= 60) badges.push('💪 Keep Going', '📝 Student');
    else badges.push('📚 Study More', '💡 Beginner');
    
    return badges;
  };

  const formatDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = end.getTime() - start.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const averageTimePerQuestion = result.totalQuestions > 0 
    ? formatDuration(result.startedAt, result.completedAt).split(' ')[0] + 'm'
    : '0m';

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Main Score Display */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-6xl font-bold mb-4 border-4 ${getScoreColor(score)}`}>
          {Math.round(score)}%
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-2">
          Grade: {getScoreGrade(score)}
        </div>
        <div className="text-lg text-gray-600 mb-4">
          {getScoreMessage(score)}
        </div>
        
        {/* Achievement Badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {getAchievementBadges(score).map((badge, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full border border-yellow-200"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-3xl font-bold text-green-600">{result.correctCount}</div>
          <div className="text-sm text-green-700 font-medium">Correct</div>
          <div className="text-xs text-green-600 mt-1">
            {Math.round((result.correctCount / result.totalQuestions) * 100)}%
          </div>
        </div>
        
        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-3xl font-bold text-red-600">{incorrectCount}</div>
          <div className="text-sm text-red-700 font-medium">Incorrect</div>
          <div className="text-xs text-red-600 mt-1">
            {Math.round((incorrectCount / result.totalQuestions) * 100)}%
          </div>
        </div>
        
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-3xl font-bold text-blue-600">{Math.round(accuracy)}%</div>
          <div className="text-sm text-blue-700 font-medium">Accuracy</div>
          <div className="text-xs text-blue-600 mt-1">
            {result.correctCount}/{result.totalQuestions}
          </div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-3xl font-bold text-purple-600">{result.totalScore}</div>
          <div className="text-sm text-purple-700 font-medium">Total Score</div>
          <div className="text-xs text-purple-600 mt-1">
            {Math.round(result.totalScore / result.totalQuestions * 100)}% avg
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {showDetails && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            {/* Overall Score Progress */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Overall Score</span>
                <span>{Math.round(score)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getScoreColor(score).split(' ')[0].replace('text-', 'bg-')}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {/* Accuracy Progress */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Accuracy</span>
                <span>{Math.round(accuracy)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>

            {/* Score Distribution */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Score Distribution</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden">
                <div
                  className="bg-green-500"
                  style={{ width: `${(result.correctCount / result.totalQuestions) * 100}%` }}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${(incorrectCount / result.totalQuestions) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Correct ({result.correctCount})</span>
                <span>Incorrect ({incorrectCount})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timing Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Timing Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Total Time:</span>
            <div className="text-lg font-bold text-gray-900">
              {formatDuration(result.startedAt, result.completedAt)}
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Average per Question:</span>
            <div className="text-lg font-bold text-gray-900">
              {averageTimePerQuestion}
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Started:</span>
            <div className="text-gray-900">
              {new Date(result.startedAt).toLocaleTimeString()}
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Completed:</span>
            <div className="text-gray-900">
              {new Date(result.completedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <h3 className="text-sm font-medium text-indigo-900 mb-2">Performance Insights</h3>
        <div className="text-sm text-indigo-700 space-y-1">
          {score >= 90 && (
            <>
              <div>🎯 You've demonstrated exceptional mastery of this material</div>
              <div>⭐ Consider helping others or taking advanced challenges</div>
            </>
          )}
          {score >= 80 && score < 90 && (
            <>
              <div>👍 Strong performance with room for minor improvements</div>
              <div>📚 Focus on the questions you missed for perfection</div>
            </>
          )}
          {score >= 70 && score < 80 && (
            <>
              <div>📖 Good understanding with some areas needing review</div>
              <div>💡 Pay attention to the specific topics you struggled with</div>
            </>
          )}
          {score >= 60 && score < 70 && (
            <>
              <div>💪 You're on the right track but need more practice</div>
              <div>📝 Review the material and try again</div>
            </>
          )}
          {score < 60 && (
            <>
              <div>📚 This material needs more study time</div>
              <div>🔄 Consider reviewing the content before retaking</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreDisplay; 
