// src/components/UserStats.tsx
// ---------------------------------------------------------------------------
// User statistics and achievements component
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import type { AxiosError } from 'axios';

interface UserStatsProps {
  userId?: string; // If provided, shows stats for specific user (admin view)
  onError?: (error: string) => void;
  className?: string;
}

interface UserStatistics {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  bestScore: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracyRate: number;
  totalTimeSpent: number; // in minutes
  quizzesCreated: number;
  quizzesShared: number;
  streakDays: number;
  rank: number;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  progress?: number;
  maxProgress?: number;
}

const UserStats: React.FC<UserStatsProps> = ({
  userId,
  onError,
  className = ''
}) => {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string | null>(null);

  // Determine if this is admin view
  const isAdminView = !!userId && userId !== currentUser?.id;
  const displayUser = currentUser;

  // Load user statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!displayUser) return;

      setIsLoading(true);
      try {
        // TODO: Implement actual stats loading from API
        // const userStats = await userService.getUserStats(userId || displayUser.id);
        // setStats(userStats);
        
        // Mock data for demonstration
        await new Promise(resolve => setTimeout(resolve, 800));
        setStats({
          totalQuizzes: 45,
          completedQuizzes: 38,
          averageScore: 78.5,
          bestScore: 95,
          totalQuestions: 342,
          correctAnswers: 268,
          accuracyRate: 78.4,
          totalTimeSpent: 1240,
          quizzesCreated: 12,
          quizzesShared: 8,
          streakDays: 7,
          rank: 15,
          achievements: [
            {
              id: '1',
              name: 'Quiz Master',
              description: 'Complete 50 quizzes',
              icon: '🏆',
              unlockedAt: '2024-01-15T10:30:00Z',
              progress: 38,
              maxProgress: 50
            },
            {
              id: '2',
              name: 'Perfect Score',
              description: 'Get 100% on any quiz',
              icon: '⭐',
              unlockedAt: '2024-01-10T14:20:00Z'
            },
            {
              id: '3',
              name: 'Creator',
              description: 'Create 10 quizzes',
              icon: '✏️',
              unlockedAt: '2024-01-08T09:15:00Z',
              progress: 12,
              maxProgress: 10
            },
            {
              id: '4',
              name: 'Streak Master',
              description: 'Maintain a 7-day streak',
              icon: '🔥',
              unlockedAt: '2024-01-20T16:45:00Z'
            }
          ]
        });
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const errorMessage = axiosError.response?.data?.message || 'Failed to load user statistics';
        setErrors(errorMessage);
        if (onError) onError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [userId, displayUser, onError]);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (errors) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{errors}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-md p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">No statistics available</p>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {isAdminView ? `${displayUser?.username}'s Statistics` : 'My Statistics'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Track your progress and achievements
        </p>
      </div>

      {/* Stats Grid */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Completed</p>
                <p className="text-2xl font-bold text-blue-900">{stats.completedQuizzes}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Avg Score</p>
                <p className="text-2xl font-bold text-green-900">{stats.averageScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Time Spent</p>
                <p className="text-2xl font-bold text-purple-900">{formatTime(stats.totalTimeSpent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Rank</p>
                <p className="text-2xl font-bold text-yellow-900">#{stats.rank}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Questions</span>
                <span className="text-sm font-medium text-gray-900">{stats.totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Correct Answers</span>
                <span className="text-sm font-medium text-gray-900">{stats.correctAnswers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Accuracy Rate</span>
                <span className="text-sm font-medium text-gray-900">{stats.accuracyRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Best Score</span>
                <span className="text-sm font-medium text-gray-900">{stats.bestScore}%</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Quizzes Created</span>
                <span className="text-sm font-medium text-gray-900">{stats.quizzesCreated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Quizzes Shared</span>
                <span className="text-sm font-medium text-gray-900">{stats.quizzesShared}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Streak</span>
                <span className="text-sm font-medium text-gray-900">{stats.streakDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Quizzes</span>
                <span className="text-sm font-medium text-gray-900">{stats.totalQuizzes}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Achievements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{achievement.icon}</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{achievement.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                    {achievement.progress !== undefined && achievement.maxProgress && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStats; 