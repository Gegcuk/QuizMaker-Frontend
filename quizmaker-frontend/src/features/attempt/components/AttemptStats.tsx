// src/components/attempt/AttemptStats.tsx
// ---------------------------------------------------------------------------
// Component for displaying detailed attempt statistics and analytics
// Shows timing data, performance trends, and detailed metrics
// ---------------------------------------------------------------------------

import React from 'react';
import { AttemptStatsDto, QuestionTimingStatsDto } from '@/types';
import { getQuestionTypeIcon } from '@/utils/questionUtils';
import { getDifficultyColor, getPerformanceColor } from '@/utils/statusHelpers';

interface AttemptStatsProps {
  stats: AttemptStatsDto;
  className?: string;
}

const AttemptStats: React.FC<AttemptStatsProps> = ({
  stats,
  className = ''
}) => {
  const formatDuration = (duration: string): string => {
    // Parse ISO 8601 duration format (e.g., "PT2M30S")
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0m 0s';
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };


  // Calculate additional metrics
  const totalQuestions = stats.questionTimings.length;
  const correctQuestions = stats.questionTimings.filter(q => q.isCorrect).length;
  const accuracyPercentage = totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0;
  
  // Group by question type
  const questionTypeStats = stats.questionTimings.reduce((acc, question) => {
    const type = question.questionType;
    if (!acc[type]) {
      acc[type] = { count: 0, correct: 0, totalTime: 0 };
    }
    acc[type].count++;
    if (question.isCorrect) acc[type].correct++;
    acc[type].totalTime += parseInt(question.timeSpent.match(/\d+/)?.[0] || '0');
    return acc;
  }, {} as Record<string, { count: number; correct: number; totalTime: number }>);

  // Group by difficulty
  const difficultyStats = stats.questionTimings.reduce((acc, question) => {
    const difficulty = question.difficulty;
    if (!acc[difficulty]) {
      acc[difficulty] = { count: 0, correct: 0, totalTime: 0 };
    }
    acc[difficulty].count++;
    if (question.isCorrect) acc[difficulty].correct++;
    acc[difficulty].totalTime += parseInt(question.timeSpent.match(/\d+/)?.[0] || '0');
    return acc;
  }, {} as Record<string, { count: number; correct: 0; totalTime: number }>);

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-theme-text-primary mb-2">Attempt Statistics</h2>
        <p className="text-theme-text-secondary">Detailed analytics and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-theme-interactive-primary">{formatDuration(stats.totalTime)}</div>
          <div className="text-sm text-theme-interactive-primary font-medium">Total Time</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{stats.correctAnswers}</div>
          <div className="text-sm text-green-700 font-medium">Correct</div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{Math.round(stats.accuracyPercentage)}%</div>
          <div className="text-sm text-purple-700 font-medium">Accuracy</div>
        </div>
        
        <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{formatDuration(stats.averageTimePerQuestion)}</div>
          <div className="text-sm text-orange-700 font-medium">Avg/Question</div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="mb-6 p-4 bg-theme-bg-secondary rounded-lg">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Performance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex justify-between text-sm text-theme-text-secondary mb-2">
              <span>Overall Accuracy</span>
              <span>{Math.round(stats.accuracyPercentage)}%</span>
            </div>
            <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getPerformanceColor(stats.accuracyPercentage).split(' ')[0].replace('text-', 'bg-')}`}
                style={{ width: `${stats.accuracyPercentage}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm text-theme-text-secondary mb-2">
              <span>Completion</span>
              <span>{Math.round(stats.completionPercentage)}%</span>
            </div>
            <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${stats.completionPercentage}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm text-theme-text-secondary mb-2">
              <span>Questions Answered</span>
              <span>{stats.questionsAnswered}</span>
            </div>
            <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
              <div
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${(stats.questionsAnswered / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Type Performance */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Performance by Question Type</h3>
        <div className="space-y-3">
          {Object.entries(questionTypeStats).map(([type, data]) => {
            const accuracy = data.count > 0 ? (data.correct / data.count) * 100 : 0;
            const avgTime = data.count > 0 ? Math.round(data.totalTime / data.count) : 0;
            
            return (
              <div key={type} className="p-4 border border-theme-border-primary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getQuestionTypeIcon(type)}</span>
                    <span className="font-medium text-theme-text-primary">{type.replace('_', ' ')}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(accuracy)}`}>
                    {Math.round(accuracy)}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-theme-text-secondary">
                  <div>Count: {data.count}</div>
                  <div>Correct: {data.correct}</div>
                  <div>Avg Time: {avgTime}s</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Difficulty Performance */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Performance by Difficulty</h3>
        <div className="space-y-3">
          {Object.entries(difficultyStats).map(([difficulty, data]) => {
            const accuracy = data.count > 0 ? (data.correct / data.count) * 100 : 0;
            const avgTime = data.count > 0 ? Math.round(data.totalTime / data.count) : 0;
            
            return (
              <div key={difficulty} className="p-4 border border-theme-border-primary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
                      {difficulty}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(accuracy)}`}>
                    {Math.round(accuracy)}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-theme-text-secondary">
                  <div>Count: {data.count}</div>
                  <div>Correct: {data.correct}</div>
                  <div>Avg Time: {avgTime}s</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timing Analysis */}
      <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
        <h3 className="text-sm font-medium text-indigo-900 mb-3">Timing Analysis</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-theme-interactive-primary">Started:</span>
            <div className="text-indigo-900">
              {new Date(stats.startedAt).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="font-medium text-theme-interactive-primary">Completed:</span>
            <div className="text-indigo-900">
              {stats.completedAt ? new Date(stats.completedAt).toLocaleString() : 'In Progress'}
            </div>
          </div>
          <div>
            <span className="font-medium text-theme-interactive-primary">Total Duration:</span>
            <div className="text-indigo-900 font-bold">
              {formatDuration(stats.totalTime)}
            </div>
          </div>
          <div>
            <span className="font-medium text-theme-interactive-primary">Average per Question:</span>
            <div className="text-indigo-900 font-bold">
              {formatDuration(stats.averageTimePerQuestion)}
            </div>
          </div>
        </div>
      </div>

      {/* Question Timing Details */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Question Timing Details</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {stats.questionTimings.map((timing, index) => (
            <div key={timing.questionId} className="flex items-center justify-between p-3 bg-theme-bg-secondary rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-theme-text-secondary">Q{index + 1}</span>
                <span className="text-lg">{getQuestionTypeIcon(timing.questionType)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(timing.difficulty)}`}>
                  {timing.difficulty}
                </span>
                <span className={timing.isCorrect ? 'text-green-600' : 'text-red-600'}>
                  {timing.isCorrect ? '✅' : '❌'}
                </span>
              </div>
              <div className="text-sm text-theme-text-secondary">
                {formatDuration(timing.timeSpent)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-sm font-medium text-green-900 mb-2">Performance Insights</h3>
        <div className="space-y-1 text-sm text-green-700">
          <div>• You completed {stats.questionsAnswered} out of {totalQuestions} questions</div>
          <div>• Your overall accuracy was {Math.round(stats.accuracyPercentage)}%</div>
          <div>• You spent an average of {formatDuration(stats.averageTimePerQuestion)} per question</div>
          {stats.accuracyPercentage >= 80 && (
            <div>• Excellent performance! You have a strong understanding of the material</div>
          )}
          {stats.accuracyPercentage < 60 && (
            <div>• Consider reviewing the material and practicing more</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttemptStats; 
