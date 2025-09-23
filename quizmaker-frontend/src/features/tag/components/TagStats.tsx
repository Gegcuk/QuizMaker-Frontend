import React, { useState, useEffect } from 'react';
import { TagDto, QuizDto } from '@/types';
import { TagService, QuizService, api } from '@/services';
import { Spinner } from '@/components';

interface TagStatsProps {
  className?: string;
  showDetails?: boolean;
}

interface TagStatistics {
  totalTags: number;
  usedTags: number;
  unusedTags: number;
  averageUsagePerTag: number;
  mostUsedTags: Array<{
    tag: TagDto;
    usageCount: number;
  }>;
  recentActivity: {
    lastCreated: Date | null;
    lastUpdated: Date | null;
  };
  growthMetrics: {
    tagsThisMonth: number;
    tagsLastMonth: number;
    growthRate: number;
  };
  usageDistribution: {
    highUsage: number; // > 10 quizzes
    mediumUsage: number; // 5-10 quizzes
    lowUsage: number; // 1-4 quizzes
    unused: number; // 0 quizzes
  };
}

export const TagStats: React.FC<TagStatsProps> = ({
  className = '',
  showDetails = true
}) => {
  const [stats, setStats] = useState<TagStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tagService = new TagService(api);
  const quizService = new QuizService(api);

  useEffect(() => {
    loadTagStats();
  }, []);

  const loadTagStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all tags
      const tagsResponse = await tagService.getTags({
        page: 0,
        size: 1000,
        sort: 'name,asc'
      });

      // Load all quizzes to calculate usage
      const quizzesResponse = await quizService.getQuizzes({
        page: 0,
        size: 1000
      });

      const allTags = tagsResponse.content;
      const allQuizzes = quizzesResponse.content;

      // Calculate statistics
      const calculatedStats = calculateStats(allTags, allQuizzes);
      setStats(calculatedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tag statistics');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tags: TagDto[], quizzes: QuizDto[]): TagStatistics => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Calculate usage for each tag
    const tagUsageMap = new Map<string, number>();
    
    quizzes.forEach(quiz => {
      quiz.tagIds.forEach(tagId => {
        tagUsageMap.set(tagId, (tagUsageMap.get(tagId) || 0) + 1);
      });
    });

    // Create tag usage data
    const tagUsageData = tags.map(tag => ({
      tag,
      usageCount: tagUsageMap.get(tag.id) || 0
    }));

    // Calculate usage distribution
    const usageDistribution = {
      highUsage: tagUsageData.filter(t => t.usageCount > 10).length,
      mediumUsage: tagUsageData.filter(t => t.usageCount >= 5 && t.usageCount <= 10).length,
      lowUsage: tagUsageData.filter(t => t.usageCount >= 1 && t.usageCount < 5).length,
      unused: tagUsageData.filter(t => t.usageCount === 0).length
    };

    // Most used tags
    const mostUsedTags = tagUsageData
      .filter(t => t.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    // Activity tracking
    let lastCreated: Date | null = null;
    let lastUpdated: Date | null = null;

    tags.forEach(tag => {
      const createdDate = new Date(tag.createdAt);
      const updatedDate = new Date(tag.updatedAt);

      if (!lastCreated || createdDate > lastCreated) {
        lastCreated = createdDate;
      }
      if (!lastUpdated || updatedDate > lastUpdated) {
        lastUpdated = updatedDate;
      }
    });

    // Monthly growth
    let tagsThisMonth = 0;
    let tagsLastMonth = 0;

    tags.forEach(tag => {
      const createdDate = new Date(tag.createdAt);
      
      if (createdDate >= thisMonth) {
        tagsThisMonth++;
      } else if (createdDate >= lastMonth && createdDate < thisMonth) {
        tagsLastMonth++;
      }
    });

    const growthRate = tagsLastMonth > 0 
      ? ((tagsThisMonth - tagsLastMonth) / tagsLastMonth) * 100 
      : tagsThisMonth > 0 ? 100 : 0;

    const usedTags = tagUsageData.filter(t => t.usageCount > 0).length;
    const totalUsage = tagUsageData.reduce((sum, t) => sum + t.usageCount, 0);

    return {
      totalTags: tags.length,
      usedTags,
      unusedTags: tags.length - usedTags,
      averageUsagePerTag: tags.length > 0 ? Math.round(totalUsage / tags.length) : 0,
      mostUsedTags,
      recentActivity: {
        lastCreated,
        lastUpdated
      },
      growthMetrics: {
        tagsThisMonth,
        tagsLastMonth,
        growthRate
      },
      usageDistribution
    };
  };

  const getGrowthIcon = (growthRate: number) => {
    if (growthRate > 0) {
      return (
        <svg className="w-4 h-4 text-theme-interactive-success" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      );
    } else if (growthRate < 0) {
      return (
        <svg className="w-4 h-4 text-theme-interactive-danger" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-theme-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className={`bg-theme-bg-primary rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <Spinner />
          <span className="ml-2 text-theme-text-secondary">Loading statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-theme-bg-danger border border-theme-border-danger rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-theme-interactive-danger mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-theme-interactive-danger">{error}</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`bg-theme-bg-primary rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme-border-primary">
        <h3 className="text-lg font-medium text-theme-text-primary">Tag Statistics</h3>
        <p className="text-sm text-theme-text-tertiary mt-1">Overview of tag usage and performance</p>
      </div>

      {/* Main Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Tags */}
          <div className="bg-theme-bg-info rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-theme-interactive-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-theme-interactive-primary">Total Tags</p>
                <p className="text-2xl font-bold text-theme-text-primary">{stats.totalTags}</p>
              </div>
            </div>
          </div>

          {/* Used Tags */}
          <div className="bg-theme-bg-success rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-theme-interactive-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-theme-interactive-success">Used Tags</p>
                <p className="text-2xl font-bold text-theme-text-primary">{stats.usedTags}</p>
              </div>
            </div>
          </div>

          {/* Average Usage */}
          <div className="bg-theme-bg-primary rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-theme-interactive-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-theme-interactive-primary">Avg Usage</p>
                <p className="text-2xl font-bold text-theme-text-primary">{stats.averageUsagePerTag}</p>
              </div>
            </div>
          </div>

          {/* Growth Rate */}
          <div className="bg-theme-bg-warning rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {getGrowthIcon(stats.growthMetrics.growthRate)}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-theme-interactive-warning">Growth Rate</p>
                <p className="text-2xl font-bold text-theme-text-primary">
                  {stats.growthMetrics.growthRate > 0 ? '+' : ''}{stats.growthMetrics.growthRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {showDetails && (
          <>
            {/* Usage Distribution */}
            <div className="mt-8">
              <h4 className="text-lg font-medium text-theme-text-primary mb-4">Usage Distribution</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-theme-bg-danger rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-theme-interactive-danger">High Usage</span>
                    <span className="text-lg font-bold text-theme-text-primary">{stats.usageDistribution.highUsage}</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
                      <div
                        className="h-2 bg-theme-bg-danger0 rounded-full"
                        style={{ width: `${stats.totalTags > 0 ? (stats.usageDistribution.highUsage / stats.totalTags) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-theme-bg-warning rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-theme-interactive-warning">Medium Usage</span>
                    <span className="text-lg font-bold text-theme-text-primary">{stats.usageDistribution.mediumUsage}</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
                      <div
                        className="h-2 bg-theme-bg-warning0 rounded-full"
                        style={{ width: `${stats.totalTags > 0 ? (stats.usageDistribution.mediumUsage / stats.totalTags) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-theme-bg-success rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-theme-interactive-success">Low Usage</span>
                    <span className="text-lg font-bold text-theme-text-primary">{stats.usageDistribution.lowUsage}</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
                      <div
                        className="h-2 bg-theme-bg-success0 rounded-full"
                        style={{ width: `${stats.totalTags > 0 ? (stats.usageDistribution.lowUsage / stats.totalTags) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-theme-bg-secondary rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-theme-text-secondary">Unused</span>
                    <span className="text-lg font-bold text-theme-text-primary">{stats.usageDistribution.unused}</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
                      <div
                        className="h-2 bg-theme-bg-secondary0 rounded-full"
                        style={{ width: `${stats.totalTags > 0 ? (stats.usageDistribution.unused / stats.totalTags) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Most Used Tags */}
            <div className="mt-8">
              <h4 className="text-lg font-medium text-theme-text-primary mb-4">Most Used Tags</h4>
              <div className="space-y-3">
                {stats.mostUsedTags.map((item, index) => (
                  <div key={item.tag.id} className="flex items-center justify-between p-3 bg-theme-bg-secondary rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-theme-bg-info text-theme-interactive-primary rounded-full flex items-center justify-center text-sm font-medium mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-theme-text-primary">{item.tag.name}</div>
                        <div className="text-sm text-theme-text-tertiary">
                          {item.tag.description || 'No description'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-theme-text-primary">{item.usageCount} quizzes</div>
                      <div className="text-xs text-theme-text-tertiary">Usage count</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <h4 className="text-lg font-medium text-theme-text-primary mb-4">Recent Activity</h4>
              <div className="bg-theme-bg-secondary rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-theme-text-secondary">Last Created:</span>
                    <span className="text-sm font-medium text-theme-text-primary">
                      {stats.recentActivity.lastCreated 
                        ? new Date(stats.recentActivity.lastCreated).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-theme-text-secondary">Last Updated:</span>
                    <span className="text-sm font-medium text-theme-text-primary">
                      {stats.recentActivity.lastUpdated 
                        ? new Date(stats.recentActivity.lastUpdated).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 