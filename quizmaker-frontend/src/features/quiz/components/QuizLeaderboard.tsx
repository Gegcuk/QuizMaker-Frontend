// src/components/QuizLeaderboard.tsx
// ---------------------------------------------------------------------------
// Leaderboard for quiz attempts based on LeaderboardEntryDto
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { LeaderboardEntryDto } from '@/types';
import { Badge } from '@/components';
import { getScoreStatus } from '@/utils/statusHelpers';

interface QuizLeaderboardProps {
  entries: LeaderboardEntryDto[];
  isLoading?: boolean;
  className?: string;
}

const QuizLeaderboard: React.FC<QuizLeaderboardProps> = ({
  entries,
  isLoading = false,
  className = ''
}) => {
  const [showTop10, setShowTop10] = useState(true);

  // Helper function to get medal icon
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return (
          <div className="w-8 h-8 bg-theme-bg-tertiary rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-theme-interactive-warning" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 bg-theme-bg-tertiary rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-theme-text-secondary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 bg-theme-bg-warning rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-theme-interactive-warning" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-theme-bg-tertiary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-theme-text-secondary">{position}</span>
          </div>
        );
    }
  };

  // Helper function to get score color
  const getScoreColor = getScoreStatus;

  // Helper function to format percentage
  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  if (isLoading) {
    return (
      <div className={`bg-theme-bg-primary shadow rounded-lg border border-theme-border-primary ${className}`}>
        <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-secondary">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-theme-text-tertiary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-theme-text-primary">Leaderboard</h3>
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="animate-pulse flex items-center space-x-4">
                <div className="w-8 h-8 bg-theme-bg-tertiary rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-theme-bg-tertiary rounded w-1/3"></div>
                </div>
                <div className="h-4 bg-theme-bg-tertiary rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={`bg-theme-bg-primary shadow rounded-lg border border-theme-border-primary ${className}`}>
        <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-secondary">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-theme-text-tertiary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-theme-text-primary">Leaderboard</h3>
          </div>
        </div>
        <div className="px-6 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No attempts yet</h3>
          <p className="mt-1 text-sm text-theme-text-tertiary">
            Be the first to attempt this quiz and claim the top spot!
          </p>
        </div>
      </div>
    );
  }

  const displayedEntries = showTop10 ? entries.slice(0, 10) : entries;

  return (
    <div className={`bg-theme-bg-primary shadow rounded-lg border border-theme-border-primary ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-secondary">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-theme-text-tertiary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-theme-text-primary">Leaderboard</h3>
          </div>
          {entries.length > 10 && (
            <button
              onClick={() => setShowTop10(!showTop10)}
              className="text-sm text-theme-interactive-primary hover:text-theme-interactive-primary"
            >
              {showTop10 ? 'Show All' : 'Show Top 10'}
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-theme-text-tertiary">
          {entries.length} participant{entries.length !== 1 ? 's' : ''} • Best scores
        </p>
      </div>

      {/* Leaderboard List */}
      <div className="px-6 py-4">
        <div className="space-y-3">
          {displayedEntries.map((entry, index) => {
            const position = index + 1;
            const isTop3 = position <= 3;
            
            return (
              <div
                key={entry.userId}
                className={`flex items-center space-x-4 p-3 rounded-lg transition-colors ${
                  isTop3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-theme-border-warning' : 'hover:bg-theme-bg-secondary'
                }`}
              >
                {/* Position/Medal */}
                <div className="flex-shrink-0">
                  {getMedalIcon(position)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-theme-text-primary truncate">
                      {entry.username}
                    </p>
                    {isTop3 && (
                      <Badge variant="warning" size="sm">
                        #{position}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-theme-text-tertiary">
                    User ID: {entry.userId}
                  </p>
                </div>

                {/* Score */}
                <div className="flex-shrink-0 text-right">
                  <p className={`text-lg font-bold ${getScoreColor(entry.bestScore)}`}>
                    {formatPercentage(entry.bestScore)}
                  </p>
                  <p className="text-xs text-theme-text-tertiary">Best Score</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show More Button */}
        {showTop10 && entries.length > 10 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowTop10(false)}
              className="text-sm text-theme-interactive-primary hover:text-theme-interactive-primary font-medium"
            >
              Show all {entries.length} participants
            </button>
          </div>
        )}

        {/* Your Position (if applicable) */}
        {entries.length > 0 && (
          <div className="mt-6 pt-4 border-t border-theme-border-primary">
            <div className="text-center">
              <p className="text-sm text-theme-text-tertiary">
                Want to improve your ranking? Try the quiz again!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizLeaderboard; 