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
    if (percentage >= 90) return 'text-theme-interactive-success bg-theme-bg-tertiary border-theme-border-primary';
    if (percentage >= 80) return 'text-theme-interactive-info bg-theme-bg-tertiary border-theme-border-primary';
    if (percentage >= 70) return 'text-theme-interactive-warning bg-theme-bg-tertiary border-theme-border-primary';
    if (percentage >= 60) return 'text-theme-interactive-warning bg-theme-bg-tertiary border-theme-border-primary';
    return 'text-theme-interactive-danger bg-theme-bg-tertiary border-theme-border-primary';
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
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
      {/* Main Score Display */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-6xl font-bold mb-4 border-4 ${getScoreColor(score)}`}>
          {Math.round(score)}%
        </div>
        <div className="text-2xl font-bold text-theme-text-primary mb-2">
          Grade: {getScoreGrade(score)}
        </div>
        <div className="text-lg text-theme-text-secondary mb-4">
          {getScoreMessage(score)}
        </div>
        
        {/* Achievement Badges */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {getAchievementBadges(score).map((badge, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-theme-bg-tertiary text-theme-interactive-warning text-sm font-medium rounded-full border border-theme-border-primary"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-theme-bg-tertiary rounded-lg border border-theme-border-primary">
          <div className="text-3xl font-bold text-theme-interactive-success">{result.correctCount}</div>
          <div className="text-sm text-theme-interactive-success font-medium">Correct</div>
          <div className="text-xs text-theme-interactive-success mt-1">
            {Math.round((result.correctCount / result.totalQuestions) * 100)}%
          </div>
        </div>
        
        <div className="text-center p-4 bg-theme-bg-tertiary rounded-lg border border-theme-border-primary">
          <div className="text-3xl font-bold text-theme-interactive-danger">{incorrectCount}</div>
          <div className="text-sm text-theme-interactive-danger font-medium">Incorrect</div>
          <div className="text-xs text-theme-interactive-danger mt-1">
            {Math.round((incorrectCount / result.totalQuestions) * 100)}%
          </div>
        </div>
        
        <div className="text-center p-4 bg-theme-bg-tertiary rounded-lg border border-theme-border-primary">
          <div className="text-3xl font-bold text-theme-interactive-info">{Math.round(accuracy)}%</div>
          <div className="text-sm text-theme-interactive-info font-medium">Accuracy</div>
          <div className="text-xs text-theme-interactive-info mt-1">
            {result.correctCount}/{result.totalQuestions}
          </div>
        </div>
        
        <div className="text-center p-4 bg-theme-bg-primary rounded-lg border border-theme-border-primary">
          <div className="text-3xl font-bold text-theme-interactive-primary">{result.totalScore}</div>
          <div className="text-sm text-theme-text-primary font-medium">Total Score</div>
          <div className="text-xs text-theme-interactive-primary mt-1">
            {Math.round(result.totalScore / result.totalQuestions * 100)}% avg
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {showDetails && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-theme-text-primary mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            {/* Overall Score Progress */}
            <div>
              <div className="flex justify-between text-sm text-theme-text-secondary mb-2">
                <span>Overall Score</span>
                <span>{Math.round(score)}%</span>
              </div>
              <div className="w-full bg-theme-bg-tertiary rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getScoreColor(score).split(' ')[0].replace('text-', 'bg-')}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {/* Accuracy Progress */}
            <div>
              <div className="flex justify-between text-sm text-theme-text-secondary mb-2">
                <span>Accuracy</span>
                <span>{Math.round(accuracy)}%</span>
              </div>
              <div className="w-full bg-theme-bg-tertiary rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-theme-bg-success0 transition-all duration-500"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>

            {/* Score Distribution */}
            <div>
              <div className="flex justify-between text-sm text-theme-text-secondary mb-2">
                <span>Score Distribution</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden">
                <div
                  className="bg-theme-bg-success0"
                  style={{ width: `${(result.correctCount / result.totalQuestions) * 100}%` }}
                />
                <div
                  className="bg-theme-bg-danger0"
                  style={{ width: `${(incorrectCount / result.totalQuestions) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-theme-text-tertiary mt-1">
                <span>Correct ({result.correctCount})</span>
                <span>Incorrect ({incorrectCount})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timing Information */}
      <div className="mb-6 p-4 bg-theme-bg-secondary rounded-lg">
        <h3 className="text-sm font-medium text-theme-text-primary mb-3">Timing Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-theme-text-secondary">Total Time:</span>
            <div className="text-lg font-bold text-theme-text-primary">
              {formatDuration(result.startedAt, result.completedAt)}
            </div>
          </div>
          <div>
            <span className="font-medium text-theme-text-secondary">Average per Question:</span>
            <div className="text-lg font-bold text-theme-text-primary">
              {averageTimePerQuestion}
            </div>
          </div>
          <div>
            <span className="font-medium text-theme-text-secondary">Started:</span>
            <div className="text-theme-text-primary">
              {new Date(result.startedAt).toLocaleTimeString()}
            </div>
          </div>
          <div>
            <span className="font-medium text-theme-text-secondary">Completed:</span>
            <div className="text-theme-text-primary">
              {new Date(result.completedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="p-4 bg-theme-bg-primary border border-theme-border-primary rounded-lg">
        <h3 className="text-sm font-medium text-theme-text-primary mb-2">Performance Insights</h3>
        <div className="text-sm text-theme-interactive-primary space-y-1">
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
