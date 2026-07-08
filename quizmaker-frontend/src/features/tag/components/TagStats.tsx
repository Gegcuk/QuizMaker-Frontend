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

    const usedTags = tagUsageData.filter(t => t.usageCount > 0).length;
    const totalUsage = tagUsageData.reduce((sum, t) => sum + t.usageCount, 0);

    return {
      totalTags: tags.length,
      usedTags,
      unusedTags: tags.length - usedTags,
      averageUsagePerTag: tags.length > 0 ? Math.round(totalUsage / tags.length) : 0,
      mostUsedTags,
      usageDistribution
    };
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
      <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
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

          {/* Unused Tags */}
          <div className="bg-theme-bg-warning rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-theme-interactive-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2h-3.5a2 2 0 01-1.6-.8l-.8-1.067A2 2 0 0010.5 2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2v-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-theme-interactive-warning">Unused Tags</p>
                <p className="text-2xl font-bold text-theme-text-primary">{stats.unusedTags}</p>
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
                        className="h-2 bg-theme-bg-danger rounded-full"
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
                        className="h-2 bg-theme-bg-warning rounded-full"
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
                        className="h-2 bg-theme-bg-success rounded-full"
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
          </>
        )}
      </div>
    </div>
  );
};
