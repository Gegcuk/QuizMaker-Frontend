// src/components/attempt/AttemptDetails.tsx
// ---------------------------------------------------------------------------
// Component for displaying comprehensive attempt details and metadata
// Shows attempt information, status, mode, and detailed breakdown
// ---------------------------------------------------------------------------

import React from 'react';
import { AttemptDetailsDto, AnswerSubmissionDto } from '../../types/attempt.types';

interface AttemptDetailsProps {
  details: AttemptDetailsDto;
  className?: string;
}

const AttemptDetails: React.FC<AttemptDetailsProps> = ({
  details,
  className = ''
}) => {
  const formatDuration = (startTime: string, endTime?: string): string => {
    if (!endTime) return 'In Progress';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = end.getTime() - start.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'IN_PROGRESS':
        return 'text-blue-600 bg-blue-100';
      case 'PAUSED':
        return 'text-yellow-600 bg-yellow-100';
      case 'ABANDONED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'COMPLETED':
        return '✅';
      case 'IN_PROGRESS':
        return '🔄';
      case 'PAUSED':
        return '⏸️';
      case 'ABANDONED':
        return '❌';
      default:
        return '❓';
    }
  };

  const getModeDescription = (mode: string): string => {
    switch (mode) {
      case 'ONE_BY_ONE':
        return 'Questions presented one at a time';
      case 'ALL_AT_ONCE':
        return 'All questions available simultaneously';
      case 'TIMED':
        return 'Timed quiz with countdown';
      default:
        return 'Unknown mode';
    }
  };

  const getModeIcon = (mode: string): string => {
    switch (mode) {
      case 'ONE_BY_ONE':
        return '📄';
      case 'ALL_AT_ONCE':
        return '📋';
      case 'TIMED':
        return '⏱️';
      default:
        return '❓';
    }
  };

  // Calculate statistics
  const totalAnswers = details.answers.length;
  const correctAnswers = details.answers.filter(a => a.isCorrect).length;
  const accuracyPercentage = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
  const totalScore = details.answers.reduce((sum, a) => sum + a.score, 0);
  const averageScore = totalAnswers > 0 ? totalScore / totalAnswers : 0;

  // Group answers by time periods
  const timeGroups = details.answers.reduce((groups, answer) => {
    const hour = new Date(answer.answeredAt).getHours();
    const timeSlot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
    
    if (!groups[timeSlot]) {
      groups[timeSlot] = { count: 0, correct: 0, totalScore: 0 };
    }
    groups[timeSlot].count++;
    if (answer.isCorrect) groups[timeSlot].correct++;
    groups[timeSlot].totalScore += answer.score;
    return groups;
  }, {} as Record<string, { count: number; correct: number; totalScore: number }>);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Attempt Details</h2>
        <p className="text-gray-600">Comprehensive information about this quiz attempt</p>
      </div>

      {/* Attempt Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getStatusIcon(details.status)}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(details.status)}`}>
              {details.status}
            </span>
          </div>
          <div className="text-sm text-blue-700">
            <div><strong>Attempt ID:</strong> {details.attemptId}</div>
            <div><strong>Quiz ID:</strong> {details.quizId}</div>
            <div><strong>User ID:</strong> {details.userId}</div>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{getModeIcon(details.mode)}</span>
            <span className="font-medium text-green-700">{details.mode.replace('_', ' ')}</span>
          </div>
          <div className="text-sm text-green-700">
            {getModeDescription(details.mode)}
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600 mb-2">
            {formatDuration(details.startedAt, details.completedAt)}
          </div>
          <div className="text-sm text-purple-700">
            <div><strong>Started:</strong> {new Date(details.startedAt).toLocaleString()}</div>
            {details.completedAt && (
              <div><strong>Completed:</strong> {new Date(details.completedAt).toLocaleString()}</div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalAnswers}</div>
            <div className="text-sm text-gray-600">Questions Answered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
            <div className="text-sm text-green-700">Correct Answers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{Math.round(accuracyPercentage)}%</div>
            <div className="text-sm text-blue-700">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{Math.round(averageScore)}</div>
            <div className="text-sm text-purple-700">Average Score</div>
          </div>
        </div>
      </div>

      {/* Answer Timeline */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Answer Timeline</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {details.answers.map((answer, index) => (
            <div key={answer.answerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
                <span className={answer.isCorrect ? 'text-green-600' : 'text-red-600'}>
                  {answer.isCorrect ? '✅' : '❌'}
                </span>
                <span className="text-sm text-gray-600">
                  {new Date(answer.answeredAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Score: {answer.score}</span>
                <span className="text-xs text-gray-500">
                  {new Date(answer.answeredAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance by Time of Day */}
      {Object.keys(timeGroups).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance by Time of Day</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(timeGroups).map(([timeSlot, data]) => {
              const accuracy = data.count > 0 ? (data.correct / data.count) * 100 : 0;
              const avgScore = data.count > 0 ? data.totalScore / data.count : 0;
              
              return (
                <div key={timeSlot} className="p-4 border border-gray-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 mb-2">{timeSlot}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">{data.count}</div>
                        <div className="text-gray-500">Questions</div>
                      </div>
                      <div>
                        <div className="font-medium text-green-600">{data.correct}</div>
                        <div className="text-green-500">Correct</div>
                      </div>
                      <div>
                        <div className="font-medium text-blue-600">{Math.round(accuracy)}%</div>
                        <div className="text-blue-500">Accuracy</div>
                      </div>
                      <div>
                        <div className="font-medium text-purple-600">{Math.round(avgScore)}</div>
                        <div className="text-purple-500">Avg Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attempt Metadata */}
      <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
        <h3 className="text-sm font-medium text-indigo-900 mb-3">Attempt Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-indigo-700">Attempt ID:</span>
            <div className="text-indigo-900 font-mono text-xs break-all">{details.attemptId}</div>
          </div>
          <div>
            <span className="font-medium text-indigo-700">Quiz ID:</span>
            <div className="text-indigo-900 font-mono text-xs break-all">{details.quizId}</div>
          </div>
          <div>
            <span className="font-medium text-indigo-700">User ID:</span>
            <div className="text-indigo-900 font-mono text-xs break-all">{details.userId}</div>
          </div>
          <div>
            <span className="font-medium text-indigo-700">Mode:</span>
            <div className="text-indigo-900">{details.mode}</div>
          </div>
          <div>
            <span className="font-medium text-indigo-700">Status:</span>
            <div className="text-indigo-900">{details.status}</div>
          </div>
          <div>
            <span className="font-medium text-indigo-700">Duration:</span>
            <div className="text-indigo-900">{formatDuration(details.startedAt, details.completedAt)}</div>
          </div>
        </div>
      </div>

      {/* Progress Analysis */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-sm font-medium text-green-900 mb-2">Progress Analysis</h3>
        <div className="space-y-1 text-sm text-green-700">
          <div>• Total questions answered: {totalAnswers}</div>
          <div>• Overall accuracy: {Math.round(accuracyPercentage)}%</div>
          <div>• Average score per question: {Math.round(averageScore)}</div>
          <div>• Total score achieved: {totalScore}</div>
          {details.status === 'COMPLETED' && (
            <div>• Quiz completed successfully</div>
          )}
          {details.status === 'IN_PROGRESS' && (
            <div>• Quiz is currently in progress</div>
          )}
          {details.status === 'PAUSED' && (
            <div>• Quiz has been paused and can be resumed</div>
          )}
          {details.status === 'ABANDONED' && (
            <div>• Quiz was abandoned and cannot be resumed</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttemptDetails; 