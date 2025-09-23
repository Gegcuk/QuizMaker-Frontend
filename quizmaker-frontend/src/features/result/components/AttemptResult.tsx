// src/components/attempt/AttemptResult.tsx
// ---------------------------------------------------------------------------
// Component for displaying quiz attempt results
// Shows score, completion status, and navigation options
// ---------------------------------------------------------------------------

import React from 'react';
import { Button } from '@/components';
import { Link } from 'react-router-dom';
import { AttemptResultDto, AnswerSubmissionDto } from '@/types';

interface AttemptResultProps {
  result: AttemptResultDto;
  quizTitle?: string;
  onRetake?: () => void;
  onReview?: () => void;
  onShare?: () => void;
  className?: string;
}

const AttemptResult: React.FC<AttemptResultProps> = ({
  result,
  quizTitle = 'Quiz',
  onRetake,
  onReview,
  onShare,
  className = ''
}) => {
  const accuracy = result.totalQuestions > 0 ? (result.correctCount / result.totalQuestions) * 100 : 0;
  const score = result.totalQuestions > 0 ? (result.totalScore / result.totalQuestions) * 100 : 0;
  
  const getScoreColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-theme-interactive-success bg-theme-bg-success';
    if (percentage >= 80) return 'text-theme-interactive-primary bg-theme-bg-info';
    if (percentage >= 70) return 'text-theme-interactive-warning bg-theme-bg-warning';
    if (percentage >= 60) return 'text-theme-interactive-warning bg-theme-bg-warning';
    return 'text-theme-interactive-danger bg-theme-bg-danger';
  };

  const getScoreMessage = (percentage: number): string => {
    if (percentage >= 90) return 'Excellent! Outstanding performance!';
    if (percentage >= 80) return 'Great job! Well done!';
    if (percentage >= 70) return 'Good work! Keep it up!';
    if (percentage >= 60) return 'Not bad! Room for improvement.';
    return 'Keep practicing! You can do better!';
  };

  const getScoreIcon = (percentage: number): string => {
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '🎉';
    if (percentage >= 70) return '👍';
    if (percentage >= 60) return '😊';
    return '💪';
  };

  const formatDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = end.getTime() - start.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-theme-text-primary mb-2">
          Quiz Complete!
        </h1>
        <p className="text-lg text-theme-text-secondary">
          {quizTitle}
        </p>
      </div>

      {/* Score Display */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-4xl mb-4 ${getScoreColor(score)}`}>
          {getScoreIcon(score)}
        </div>
        <div className="text-4xl font-bold text-theme-text-primary mb-2">
          {Math.round(score)}%
        </div>
        <div className="text-lg text-theme-text-secondary mb-2">
          {getScoreMessage(score)}
        </div>
        <div className="text-sm text-theme-text-tertiary">
          Score: {result.totalScore} / {result.totalQuestions}
        </div>
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-theme-bg-success rounded-lg">
          <div className="text-2xl font-bold text-theme-interactive-success">{result.correctCount}</div>
          <div className="text-sm text-green-700">Correct</div>
        </div>
        <div className="text-center p-4 bg-theme-bg-danger rounded-lg">
          <div className="text-2xl font-bold text-theme-interactive-danger">{result.totalQuestions - result.correctCount}</div>
          <div className="text-sm text-red-700">Incorrect</div>
        </div>
        <div className="text-center p-4 bg-theme-bg-info rounded-lg">
          <div className="text-2xl font-bold text-theme-interactive-primary">{Math.round(accuracy)}%</div>
          <div className="text-sm text-theme-interactive-primary">Accuracy</div>
        </div>
        <div className="text-center p-4 bg-theme-bg-primary rounded-lg">
          <div className="text-2xl font-bold text-theme-interactive-primary">
            {formatDuration(result.startedAt, result.completedAt)}
          </div>
          <div className="text-sm text-theme-text-primary">Time Taken</div>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Performance Breakdown</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-theme-text-secondary">Overall Score</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-theme-bg-tertiary rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreColor(score).split(' ')[0].replace('text-', 'bg-')}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-sm font-medium text-theme-text-primary">{Math.round(score)}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-theme-text-secondary">Accuracy</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-theme-bg-tertiary rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-theme-bg-success0"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
              <span className="text-sm font-medium text-theme-text-primary">{Math.round(accuracy)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attempt Details */}
      <div className="mb-6 p-4 bg-theme-bg-secondary rounded-lg">
        <h3 className="text-sm font-medium text-theme-text-primary mb-2">Attempt Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-theme-text-secondary">
          <div>
            <span className="font-medium">Started:</span> {new Date(result.startedAt).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Completed:</span> {new Date(result.completedAt).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Attempt ID:</span> {result.attemptId}
          </div>
          <div>
            <span className="font-medium">Questions:</span> {result.totalQuestions}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onReview && (
          <Button onClick={onReview} variant="primary" size="md" className="flex-1">
            📋 Review Answers
          </Button>
        )}
        {onRetake && (
          <Button onClick={onRetake} variant="success" size="md" className="flex-1">
            🔄 Retake Quiz
          </Button>
        )}
        {onShare && (
          <Button onClick={onShare} variant="info" size="md" className="flex-1">
            📤 Share Results
          </Button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="mt-6 pt-6 border-t border-theme-border-primary">
        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Link
            to="/quizzes"
            className="text-theme-interactive-primary hover:text-theme-interactive-primary text-sm font-medium"
          >
            ← Back to Quizzes
          </Link>
          <Link
            to="/dashboard"
            className="text-theme-interactive-primary hover:text-theme-interactive-primary text-sm font-medium"
          >
            📊 View Dashboard
          </Link>
          <Link
            to="/my-quizzes"
            className="text-theme-interactive-primary hover:text-theme-interactive-primary text-sm font-medium"
          >
            📚 My Quizzes
          </Link>
        </div>
      </div>

      {/* Achievement Badge */}
      {score >= 90 && (
        <div className="mt-6 p-4 bg-theme-bg-warning border border-theme-border-warning rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">🏆</span>
            <div className="text-center">
              <div className="text-sm font-medium text-theme-interactive-warning">Perfect Score Achievement!</div>
              <div className="text-xs text-theme-interactive-warning">You've earned a perfect score badge</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttemptResult; 
