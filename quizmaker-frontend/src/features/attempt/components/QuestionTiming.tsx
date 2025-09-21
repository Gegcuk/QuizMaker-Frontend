// src/components/attempt/QuestionTiming.tsx
// ---------------------------------------------------------------------------
// Component for displaying detailed timing analysis for individual questions
// Shows time spent, performance patterns, and timing insights
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { QuestionTimingDto } from '../types/attempt.types';

interface QuestionTimingProps {
  timings: QuestionTimingDto[];
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

  const getQuestionTypeIcon = (type: string): string => {
    switch (type) {
      case 'MCQ_SINGLE':
        return '🔘';
      case 'MCQ_MULTI':
        return '☑️';
      case 'TRUE_FALSE':
        return '✅';
      case 'OPEN':
        return '📝';
      case 'FILL_GAP':
        return '🔤';
      case 'COMPLIANCE':
        return '📋';
      case 'ORDERING':
        return '📊';
      case 'HOTSPOT':
        return '🎯';
      default:
        return '❓';
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'EASY':
        return 'text-green-600 bg-green-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'HARD':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTimeColor = (seconds: number): string => {
    if (seconds <= 30) return 'text-green-600 bg-green-100';
    if (seconds <= 60) return 'text-blue-600 bg-blue-100';
    if (seconds <= 120) return 'text-yellow-600 bg-yellow-100';
    if (seconds <= 300) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
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
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Question Timing Analysis</h2>
        <p className="text-gray-600">Detailed timing breakdown and performance patterns</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{formatDuration(`PT${Math.floor(averageTimeSeconds / 60)}M${Math.floor(averageTimeSeconds % 60)}S`)}</div>
          <div className="text-sm text-blue-700 font-medium">Average Time</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{formatDuration(`PT${Math.floor(fastestQuestion.time / 60)}M${Math.floor(fastestQuestion.time % 60)}S`)}</div>
          <div className="text-sm text-green-700 font-medium">Fastest</div>
        </div>
        
        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">{formatDuration(`PT${Math.floor(slowestQuestion.time / 60)}M${Math.floor(slowestQuestion.time % 60)}S`)}</div>
          <div className="text-sm text-red-700 font-medium">Slowest</div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{Math.round(accuracyPercentage)}%</div>
          <div className="text-sm text-purple-700 font-medium">Accuracy</div>
        </div>
      </div>

      {/* Question Type Performance */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance by Question Type</h3>
        <div className="space-y-3">
          {Object.entries(typeStats).map(([type, stats]) => {
            const avgTime = stats.count > 0 ? stats.totalTime / stats.count : 0;
            const accuracy = stats.count > 0 ? (stats.correct / stats.count) * 100 : 0;
            
            return (
              <div key={type} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getQuestionTypeIcon(type)}</span>
                    <span className="font-medium text-gray-900">{type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTimeColor(avgTime)}`}>
                      {formatDuration(`PT${Math.floor(avgTime / 60)}M${Math.floor(avgTime % 60)}S`)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${accuracy >= 80 ? 'text-green-600 bg-green-100' : accuracy >= 60 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'}`}>
                      {Math.round(accuracy)}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
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
        <span className="text-sm font-medium text-gray-700">Sort by:</span>
        {(['time', 'accuracy', 'difficulty', 'type'] as const).map((option) => (
          <button
            key={option}
            onClick={() => handleSort(option)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              sortBy === option
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
            {sortBy === option && (
              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        ))}
      </div>

      {/* Question Timing List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedTimings.map((timing, index) => {
          const timeSeconds = getDurationInSeconds(timing.timeSpent);
          const timeColor = getTimeColor(timeSeconds);
          
          return (
            <div key={timing.questionId} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
                  <span className="text-lg">{getQuestionTypeIcon(timing.questionType)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(timing.difficulty)}`}>
                    {timing.difficulty}
                  </span>
                  <span className={timing.isCorrect ? 'text-green-600' : 'text-red-600'}>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-2">
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
      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <h3 className="text-sm font-medium text-indigo-900 mb-2">Timing Insights</h3>
        <div className="space-y-1 text-sm text-indigo-700">
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
