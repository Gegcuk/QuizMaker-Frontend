// src/components/UserActivity.tsx
// ---------------------------------------------------------------------------
// User activity history component
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import type { AxiosError } from 'axios';

interface UserActivityProps {
  userId?: string; // If provided, shows activity for specific user (admin view)
  onError?: (error: string) => void;
  className?: string;
}

interface ActivityItem {
  id: string;
  type: 'quiz_completed' | 'quiz_created' | 'quiz_shared' | 'achievement_unlocked' | 'login' | 'profile_updated';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    quizId?: string;
    quizTitle?: string;
    score?: number;
    achievementName?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

interface ActivityFilter {
  type?: ActivityItem['type'];
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'all';
  search?: string;
}

const UserActivity: React.FC<UserActivityProps> = ({
  userId,
  onError,
  className = ''
}) => {
  const { user: currentUser } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityFilter>({
    dateRange: 'week'
  });

  // Determine if this is admin view
  const isAdminView = !!userId && userId !== currentUser?.id;
  const displayUser = currentUser;

  // Load user activity
  useEffect(() => {
    const loadActivity = async () => {
      if (!displayUser) return;

      setIsLoading(true);
      try {
        // TODO: Implement actual activity loading from API
        // const userActivity = await userService.getUserActivity(userId || displayUser.id);
        // setActivities(userActivity);
        
        // Mock data for demonstration
        await new Promise(resolve => setTimeout(resolve, 600));
        const mockActivities: ActivityItem[] = [
          {
            id: '1',
            type: 'quiz_completed',
            title: 'Completed Quiz',
            description: 'You completed "JavaScript Fundamentals"',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            metadata: {
              quizId: 'quiz-1',
              quizTitle: 'JavaScript Fundamentals',
              score: 85
            }
          },
          {
            id: '2',
            type: 'achievement_unlocked',
            title: 'Achievement Unlocked',
            description: 'You unlocked "Perfect Score" achievement',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
            metadata: {
              achievementName: 'Perfect Score'
            }
          },
          {
            id: '3',
            type: 'quiz_created',
            title: 'Quiz Created',
            description: 'You created "React Hooks Quiz"',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            metadata: {
              quizId: 'quiz-2',
              quizTitle: 'React Hooks Quiz'
            }
          },
          {
            id: '4',
            type: 'login',
            title: 'Login',
            description: 'You logged in from a new device',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            metadata: {
              ipAddress: '192.168.1.100',
              userAgent: 'Chrome/120.0.0.0'
            }
          },
          {
            id: '5',
            type: 'quiz_shared',
            title: 'Quiz Shared',
            description: 'You shared "TypeScript Basics" with your team',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            metadata: {
              quizId: 'quiz-3',
              quizTitle: 'TypeScript Basics'
            }
          },
          {
            id: '6',
            type: 'profile_updated',
            title: 'Profile Updated',
            description: 'You updated your profile information',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          },
          {
            id: '7',
            type: 'quiz_completed',
            title: 'Completed Quiz',
            description: 'You completed "CSS Grid Layout"',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
            metadata: {
              quizId: 'quiz-4',
              quizTitle: 'CSS Grid Layout',
              score: 92
            }
          }
        ];
        
        setActivities(mockActivities);
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const errorMessage = axiosError.response?.data?.message || 'Failed to load user activity';
        setErrors(errorMessage);
        if (onError) onError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivity();
  }, [userId, displayUser, onError]);

  // Filter activities based on current filter
  useEffect(() => {
    let filtered = [...activities];

    // Filter by type
    if (filter.type) {
      filtered = filtered.filter(activity => activity.type === filter.type);
    }

    // Filter by date range
    if (filter.dateRange && filter.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      switch (filter.dateRange) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'year':
          cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(activity => new Date(activity.timestamp) >= cutoffDate);
    }

    // Filter by search
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchLower) ||
        activity.description.toLowerCase().includes(searchLower)
      );
    }

    setFilteredActivities(filtered);
  }, [activities, filter]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'quiz_completed':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'quiz_created':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'quiz_shared':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </div>
        );
      case 'achievement_unlocked':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        );
      case 'login':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
        );
      case 'profile_updated':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="h-6 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
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

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {isAdminView ? `${displayUser?.username}'s Activity` : 'My Activity'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Recent activity and actions
        </p>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search activities..."
              value={filter.search || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filter.type || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as ActivityItem['type'] || undefined }))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="quiz_completed">Quiz Completed</option>
              <option value="quiz_created">Quiz Created</option>
              <option value="quiz_shared">Quiz Shared</option>
              <option value="achievement_unlocked">Achievement Unlocked</option>
              <option value="login">Login</option>
              <option value="profile_updated">Profile Updated</option>
            </select>
            <select
              value={filter.dateRange || 'week'}
              onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value as ActivityFilter['dateRange'] }))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="px-6 py-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activities found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter.search || filter.type || filter.dateRange !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Get started by completing your first quiz!'}
            </p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {filteredActivities.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== filteredActivities.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      {getActivityIcon(activity.type)}
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-900">
                            {activity.title}
                            {activity.metadata?.score && (
                              <span className="ml-2 text-sm text-gray-500">
                                (Score: {activity.metadata.score}%)
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                          {activity.metadata?.ipAddress && (
                            <p className="text-xs text-gray-400 mt-1">
                              IP: {activity.metadata.ipAddress}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={activity.timestamp}>
                            {formatTimestamp(activity.timestamp)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivity; 