// src/components/attempt/QuestionTiming.tsx
// ---------------------------------------------------------------------------
// Component for displaying detailed timing analysis for individual questions
// Shows time spent, performance patterns, and timing insights
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { QuestionTimingStatsDto } from '@/types';
import { getQuestionTypeIcon } from '@/utils/questionUtils';
import { Button } from '@/components';

interface QuestionTimingProps {
  timings: QuestionTimingStatsDto[];
  showDetails?: boolean;
  className?: string;
}

const QuestionTiming: React.FC<QuestionTimingProps> = ({
  timings,
  showDetails = true,
  className = ''
}) => {
  const [sortBy, setSortBy] = useState<'time' | 'accuracy' | 'difficulty' | 'type'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatDuration = (duration: string): string => {
    // Parse ISO 8601 duration format (e.g., "PT2M30S")
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0s';
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getDurationInSeconds = (duration: string): number => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  };


  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'EASY':
        return 'text-theme-interactive-success bg-theme-bg-success';
      case 'MEDIUM':
        return 'text-theme-interactive-warning bg-theme-bg-warning';
      case 'HARD':
        return 'text-theme-interactive-danger bg-theme-bg-danger';
      default:
        return 'text-theme-text-secondary bg-theme-bg-tertiary';
    }
  };

  const getTimeColor = (seconds: number): string => {
    if (seconds <= 30) return 'text-theme-interactive-success bg-theme-bg-success';
    if (seconds <= 60) return 'text-theme-interactive-primary bg-theme-bg-info';
    if (seconds <= 120) return 'text-theme-interactive-warning bg-theme-bg-warning';
    if (seconds <= 300) return 'text-theme-interactive-warning bg-theme-bg-warning';
    return 'text-theme-interactive-danger bg-theme-bg-danger';
  };

  // Sort timings
  const sortedTimings = [...timings].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'time':
        aValue = getDurationInSeconds(a.timeSpent);
        bValue = getDurationInSeconds(b.timeSpent);
        break;
      case 'accuracy':
        aValue = a.isCorrect ? 1 : 0;
        bValue = b.isCorrect ? 1 : 0;
        break;
      case 'difficulty':
        const difficultyOrder = { 'EASY': 1, 'MEDIUM': 2, 'HARD': 3 };
        aValue = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0;
        bValue = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0;
        break;
      case 'type':
        aValue = a.questionType;
        bValue = b.questionType;
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Calculate statistics
  const totalQuestions = timings.length;
  const correctQuestions = timings.filter(t => t.isCorrect).length;
  const accuracyPercentage = totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0;
  
  const totalTimeSeconds = timings.reduce((sum, t) => sum + getDurationInSeconds(t.timeSpent), 0);
  const averageTimeSeconds = totalQuestions > 0 ? totalTimeSeconds / totalQuestions : 0;
  
  const fastestQuestion = timings.reduce((min, t) => {
    const time = getDurationInSeconds(t.timeSpent);
    return time < min.time ? { time, timing: t } : min;
  }, { time: Infinity, timing: timings[0] });
  
  const slowestQuestion = timings.reduce((max, t) => {
    const time = getDurationInSeconds(t.timeSpent);
    return time > max.time ? { time, timing: t } : max;
  }, { time: 0, timing: timings[0] });

  // Group by question type
  const typeStats = timings.reduce((acc, timing) => {
    const type = timing.questionType;
    if (!acc[type]) {
      acc[type] = { count: 0, totalTime: 0, correct: 0 };
    }
    acc[type].count++;
    acc[type].totalTime += getDurationInSeconds(timing.timeSpent);
    if (timing.isCorrect) acc[type].correct++;
    return acc;
  }, {} as Record<string, { count: number; totalTime: number; correct: number }>);

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-theme-text-primary mb-2">Question Timing Analysis</h2>
        <p className="text-theme-text-secondary">Detailed timing breakdown and performance patterns</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-theme-bg-info rounded-lg border border-theme-border-info">
          <div className="text-2xl font-bold text-theme-interactive-primary">{formatDuration(`PT${Math.floor(averageTimeSeconds / 60)}M${Math.floor(averageTimeSeconds % 60)}S`)}</div>
          <div className="text-sm text-theme-interactive-primary font-medium">Average Time</div>
        </div>
        
        <div className="text-center p-4 bg-theme-bg-success rounded-lg border border-theme-border-success">
          <div className="text-2xl font-bold text-theme-interactive-success">{formatDuration(`PT${Math.floor(fastestQuestion.time / 60)}M${Math.floor(fastestQuestion.time % 60)}S`)}</div>
          <div className="text-sm text-theme-interactive-success font-medium">Fastest</div>
        </div>
        
        <div className="text-center p-4 bg-theme-bg-danger rounded-lg border border-theme-border-danger">
          <div className="text-2xl font-bold text-theme-interactive-danger">{formatDuration(`PT${Math.floor(slowestQuestion.time / 60)}M${Math.floor(slowestQuestion.time % 60)}S`)}</div>
          <div className="text-sm text-theme-interactive-danger font-medium">Slowest</div>
        </div>
        
        <div className="text-center p-4 bg-theme-bg-primary rounded-lg border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary">
          <div className="text-2xl font-bold text-theme-interactive-primary">{Math.round(accuracyPercentage)}%</div>
          <div className="text-sm text-theme-text-primary font-medium">Accuracy</div>
        </div>
      </div>

      {/* Question Type Performance */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Performance by Question Type</h3>
        <div className="space-y-3">
          {Object.entries(typeStats).map(([type, stats]) => {
            const avgTime = stats.count > 0 ? stats.totalTime / stats.count : 0;
            const accuracy = stats.count > 0 ? (stats.correct / stats.count) * 100 : 0;
            
            return (
              <div key={type} className="p-4 border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getQuestionTypeIcon(type)}</span>
                    <span className="font-medium text-theme-text-primary">{type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTimeColor(avgTime)}`}>
                      {formatDuration(`PT${Math.floor(avgTime / 60)}M${Math.floor(avgTime % 60)}S`)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${accuracy >= 80 ? 'text-theme-interactive-success bg-theme-bg-success' : accuracy >= 60 ? 'text-theme-interactive-warning bg-theme-bg-warning' : 'text-theme-interactive-danger bg-theme-bg-danger'}`}>
                      {Math.round(accuracy)}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-theme-text-secondary">
                  <div>Count: {stats.count}</div>
                  <div>Correct: {stats.correct}</div>
                  <div>Total Time: {formatDuration(`PT${Math.floor(stats.totalTime / 60)}M${Math.floor(stats.totalTime % 60)}S`)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sorting Controls */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-sm font-medium text-theme-text-secondary">Sort by:</span>
        {(['time', 'accuracy', 'difficulty', 'type'] as const).map((option) => (
          <Button
            key={option}
            onClick={() => handleSort(option)}
            variant={sortBy === option ? 'primary' : 'secondary'}
            size="sm"
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
            {sortBy === option && (
              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Question Timing List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedTimings.map((timing, index) => {
          const timeSeconds = getDurationInSeconds(timing.timeSpent);
          const timeColor = getTimeColor(timeSeconds);
          
          return (
            <div key={timing.questionId} className="p-4 border border-theme-border-primary rounded-lg hover:bg-theme-bg-secondary transition-colors bg-theme-bg-primary text-theme-text-primary">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-theme-text-secondary">Q{index + 1}</span>
                  <span className="text-lg">{getQuestionTypeIcon(timing.questionType)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(timing.difficulty)}`}>
                    {timing.difficulty}
                  </span>
                  <span className={timing.isCorrect ? 'text-theme-interactive-success' : 'text-theme-interactive-danger'}>
                    {timing.isCorrect ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${timeColor}`}>
                    {formatDuration(timing.timeSpent)}
                  </span>
                </div>
              </div>
              
              {showDetails && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-theme-text-secondary mt-2">
                  <div>
                    <span className="font-medium">Started:</span> {new Date(timing.questionStartedAt).toLocaleTimeString()}
                  </div>
                  <div>
                    <span className="font-medium">Answered:</span> {new Date(timing.answeredAt).toLocaleTimeString()}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {timing.questionType.replace('_', ' ')}
                  </div>
                  <div>
                    <span className="font-medium">Result:</span> {timing.isCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Timing Insights */}
      <div className="mt-6 p-4 bg-theme-bg-primary border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
        <h3 className="text-sm font-medium text-theme-text-primary mb-2">Timing Insights</h3>
        <div className="space-y-1 text-sm text-theme-interactive-primary">
          <div>• Average time per question: {formatDuration(`PT${Math.floor(averageTimeSeconds / 60)}M${Math.floor(averageTimeSeconds % 60)}S`)}</div>
          <div>• Fastest question: {formatDuration(`PT${Math.floor(fastestQuestion.time / 60)}M${Math.floor(fastestQuestion.time % 60)}S`)}</div>
          <div>• Slowest question: {formatDuration(`PT${Math.floor(slowestQuestion.time / 60)}M${Math.floor(slowestQuestion.time % 60)}S`)}</div>
          <div>• Time range: {formatDuration(`PT${Math.floor((slowestQuestion.time - fastestQuestion.time) / 60)}M${Math.floor((slowestQuestion.time - fastestQuestion.time) % 60)}S`)}</div>
          {averageTimeSeconds > 120 && (
            <div>• Consider practicing to improve your speed on similar questions</div>
          )}
          {accuracyPercentage < 70 && (
            <div>• Focus on accuracy over speed for better results</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionTiming; 
