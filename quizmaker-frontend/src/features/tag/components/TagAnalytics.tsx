import React, { useState, useEffect } from 'react';
import { TagDto, QuizDto } from '@/types';
import { TagService, QuizService, api } from '@/services';
import { Spinner } from '@/components';
import { useTheme } from '@/context/ThemeContext';

interface TagAnalyticsProps {
  className?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

interface AnalyticsData {
  tagCreationTrend: Array<{ date: string; count: number }>;
  usageTrend: Array<{ date: string; usage: number }>;
  topTagsByUsage: Array<{
    tag: TagDto;
    usageCount: number;
    percentage: number;
  }>;
  tagEfficiency: {
    averageQuizzesPerTag: number;
    mostEfficientTags: Array<{
      tag: TagDto;
      efficiency: number; // quizzes per tag
    }>;
  };
  tagCorrelation: Array<{
    tag1: string;
    tag2: string;
    correlation: number; // how often they appear together
  }>;
  usagePatterns: {
    popularCombinations: Array<{
      tags: string[];
      frequency: number;
    }>;
    seasonalUsage: Record<string, number>;
  };
}

export const TagAnalytics: React.FC<TagAnalyticsProps> = ({
  className = '',
  timeRange = 'month'
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  const tagService = new TagService(api);
  const quizService = new QuizService(api);
  const { currentPalette } = useTheme();

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all tags
      const tagsResponse = await tagService.getTags({
        page: 0,
        size: 1000,
        sort: 'name,asc'
      });

      // Load all quizzes
      const quizzesResponse = await quizService.getQuizzes({
        page: 0,
        size: 1000
      });

      const allTags = tagsResponse.content;
      const allQuizzes = quizzesResponse.content;
      const calculatedData = calculateAnalyticsData(allTags, allQuizzes, selectedTimeRange);
      setAnalyticsData(calculatedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalyticsData = (tags: TagDto[], quizzes: QuizDto[], range: string): AnalyticsData => {
    const now = new Date();
    const startDate = getStartDate(now, range);
    
    // Filter data by time range
    const filteredTags = tags.filter(tag => {
      const tagDate = new Date(tag.createdAt);
      return tagDate >= startDate;
    });

    const filteredQuizzes = quizzes.filter(quiz => {
      const quizDate = new Date(quiz.createdAt);
      return quizDate >= startDate;
    });

    // Tag creation trend
    const creationTrend = generateTrendData(filteredTags, startDate, now, range, 'createdAt');

    // Usage trend (based on quiz creation with tags)
    const usageTrend = generateUsageTrend(filteredQuizzes, startDate, now, range);

    // Calculate tag usage
    const tagUsageMap = new Map<string, number>();
    const totalQuizzes = filteredQuizzes.length;
    
    filteredQuizzes.forEach(quiz => {
      quiz.tagIds.forEach(tagId => {
        tagUsageMap.set(tagId, (tagUsageMap.get(tagId) || 0) + 1);
      });
    });

    // Top tags by usage
    const topTagsByUsage = Array.from(tagUsageMap.entries())
      .map(([tagId, usageCount]) => {
        const tag = tags.find(t => t.id === tagId);
        return {
          tag: tag!,
          usageCount,
          percentage: totalQuizzes > 0 ? (usageCount / totalQuizzes) * 100 : 0
        };
      })
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    // Tag efficiency
    const averageQuizzesPerTag = tags.length > 0 ? totalQuizzes / tags.length : 0;
    const mostEfficientTags = Array.from(tagUsageMap.entries())
      .map(([tagId, usageCount]) => {
        const tag = tags.find(t => t.id === tagId);
        return {
          tag: tag!,
          efficiency: usageCount
        };
      })
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 5);

    // Tag correlation (simplified)
    const tagCorrelation: Array<{ tag1: string; tag2: string; correlation: number }> = [];
    const tagPairs = new Map<string, number>();

    filteredQuizzes.forEach(quiz => {
      if (quiz.tagIds.length > 1) {
        for (let i = 0; i < quiz.tagIds.length; i++) {
          for (let j = i + 1; j < quiz.tagIds.length; j++) {
            const pair = [quiz.tagIds[i], quiz.tagIds[j]].sort().join('-');
            tagPairs.set(pair, (tagPairs.get(pair) || 0) + 1);
          }
        }
      }
    });

    // Convert pairs to correlation data
    Array.from(tagPairs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([pair, count]) => {
        const [tag1Id, tag2Id] = pair.split('-');
        const tag1 = tags.find(t => t.id === tag1Id);
        const tag2 = tags.find(t => t.id === tag2Id);
        if (tag1 && tag2) {
          tagCorrelation.push({
            tag1: tag1.name,
            tag2: tag2.name,
            correlation: count
          });
        }
      });

    // Usage patterns
    const popularCombinations: Array<{ tags: string[]; frequency: number }> = [];
    const combinationMap = new Map<string, number>();

    filteredQuizzes.forEach(quiz => {
      if (quiz.tagIds.length > 1) {
        const sortedTags = quiz.tagIds.sort();
        const combination = sortedTags.join(',');
        combinationMap.set(combination, (combinationMap.get(combination) || 0) + 1);
      }
    });

    Array.from(combinationMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([combination, frequency]) => {
        const tagNames = combination.split(',').map(tagId => {
          const tag = tags.find(t => t.id === tagId);
          return tag ? tag.name : tagId;
        });
        popularCombinations.push({ tags: tagNames, frequency });
      });

    // Seasonal usage (simplified - by month)
    const seasonalUsage: Record<string, number> = {};
    filteredQuizzes.forEach(quiz => {
      const month = new Date(quiz.createdAt).toLocaleString('default', { month: 'long' });
      seasonalUsage[month] = (seasonalUsage[month] || 0) + quiz.tagIds.length;
    });

    return {
      tagCreationTrend: creationTrend,
      usageTrend,
      topTagsByUsage,
      tagEfficiency: {
        averageQuizzesPerTag,
        mostEfficientTags
      },
      tagCorrelation,
      usagePatterns: {
        popularCombinations,
        seasonalUsage
      }
    };
  };

  const getStartDate = (now: Date, range: string): Date => {
    switch (range) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  };

  const generateTrendData = (data: any[], startDate: Date, endDate: Date, range: string, dateField: string) => {
    const trendData: Array<{ date: string; count: number }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const count = data.filter(item => {
        const itemDate = new Date(item[dateField]).toISOString().split('T')[0];
        return itemDate === dateStr;
      }).length;

      trendData.push({ date: dateStr, count });

      // Move to next period
      switch (range) {
        case 'week':
        case 'month':
          current.setDate(current.getDate() + 1);
          break;
        case 'quarter':
          current.setDate(current.getDate() + 7);
          break;
        case 'year':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    return trendData;
  };

  const generateUsageTrend = (quizzes: QuizDto[], startDate: Date, endDate: Date, range: string) => {
    const usageData: Array<{ date: string; usage: number }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const usage = quizzes
        .filter(quiz => {
          const quizDate = new Date(quiz.createdAt).toISOString().split('T')[0];
          return quizDate === dateStr;
        })
        .reduce((total, quiz) => total + quiz.tagIds.length, 0);

      usageData.push({ date: dateStr, usage });

      // Move to next period
      switch (range) {
        case 'week':
        case 'month':
          current.setDate(current.getDate() + 1);
          break;
        case 'quarter':
          current.setDate(current.getDate() + 7);
          break;
        case 'year':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    return usageData;
  };

  const renderBarChart = (data: Array<{ label: string; value: number }>, title: string, color: string) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="bg-theme-bg-primary rounded-lg p-4 border border-theme-border-primary">
        <h4 className="text-lg font-medium text-theme-text-primary mb-4">{title}</h4>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-24 text-sm font-medium text-theme-text-secondary truncate">{item.label}</div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${color}`}
                    style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-12 text-sm font-medium text-theme-text-primary text-right">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTrendChart = (data: Array<{ date: string; count?: number; usage?: number }>, title: string, yAxis: string) => {
    const maxValue = Math.max(...data.map(d => d.count || d.usage || 0));
    const height = 200;
    
    return (
      <div className="bg-theme-bg-primary rounded-lg p-4 border border-theme-border-primary">
        <h4 className="text-lg font-medium text-theme-text-primary mb-4">{title}</h4>
        <div className="relative" style={{ height: `${height}px` }}>
          <svg className="w-full h-full" viewBox={`0 0 ${data.length * 40} ${height}`}>
            {data.map((point, index) => {
              const x = index * 40;
              const y = height - ((point.count || point.usage || 0) / maxValue) * height;
              const nextPoint = data[index + 1];
              
              if (nextPoint) {
                const nextX = (index + 1) * 40;
                const nextY = height - ((nextPoint.count || nextPoint.usage || 0) / maxValue) * height;
                
                return (
                  <g key={index}>
                    <line
                      x1={x}
                      y1={y}
                      x2={nextX}
                      y2={nextY}
                      stroke={currentPalette.colors.interactive.primary}
                      strokeWidth="2"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill={currentPalette.colors.interactive.primary}
                    />
                  </g>
                );
              }
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={currentPalette.colors.interactive.primary}
                />
              );
            })}
          </svg>
        </div>
        <div className="flex justify-between text-xs text-theme-text-tertiary mt-2">
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-theme-bg-primary rounded-lg shadow-theme border border-theme-border-primary p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <Spinner />
          <span className="ml-2 text-theme-text-secondary">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-theme-status-danger-bg border border-theme-border-danger rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-theme-status-danger mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-theme-status-danger">{error}</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-theme-bg-primary rounded-lg shadow-theme border border-theme-border-primary p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-theme-text-primary">Tag Analytics</h3>
            <p className="text-sm text-theme-text-tertiary mt-1">Comprehensive tag usage and performance analysis</p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-theme-text-secondary">Time Range:</label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-1 border border-theme-border-primary rounded-md text-sm bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-focus-ring"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTrendChart(analyticsData.tagCreationTrend, 'Tag Creation Trend', 'Tags Created')}
        {renderTrendChart(analyticsData.usageTrend, 'Tag Usage Trend', 'Tags Used')}
      </div>

      {/* Top Tags by Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderBarChart(
          analyticsData.topTagsByUsage.map(item => ({
            label: item.tag.name,
            value: item.usageCount
          })),
          'Top Tags by Usage',
          'bg-blue-500'
        )}
        
        {/* Tag Efficiency */}
        <div className="bg-theme-bg-primary rounded-lg p-4 border border-theme-border-primary">
          <h4 className="text-lg font-medium text-theme-text-primary mb-4">Tag Efficiency</h4>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analyticsData.tagEfficiency.averageQuizzesPerTag.toFixed(1)}
              </div>
              <div className="text-sm text-theme-text-secondary">Average Quizzes per Tag</div>
            </div>
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-theme-text-secondary">Most Efficient Tags:</h5>
              {analyticsData.tagEfficiency.mostEfficientTags.map((item, index) => (
                <div key={item.tag.id} className="flex justify-between items-center text-sm">
                  <span className="text-theme-text-secondary">{item.tag.name}</span>
                  <span className="font-medium text-theme-text-primary">{item.efficiency} quizzes</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tag Correlation */}
      <div className="bg-theme-bg-primary rounded-lg p-6 border">
        <h4 className="text-lg font-medium text-theme-text-primary mb-4">Tag Correlations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analyticsData.tagCorrelation.map((correlation, index) => (
            <div key={index} className="bg-theme-bg-secondary rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {correlation.tag1}
                  </span>
                  <span className="text-theme-text-tertiary">×</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {correlation.tag2}
                  </span>
                </div>
                <span className="text-sm font-medium text-theme-text-primary">{correlation.correlation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Combinations */}
      <div className="bg-theme-bg-primary rounded-lg p-6 border">
        <h4 className="text-lg font-medium text-theme-text-primary mb-4">Popular Tag Combinations</h4>
        <div className="space-y-3">
          {analyticsData.usagePatterns.popularCombinations.map((combination, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-theme-bg-secondary rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex flex-wrap gap-1">
                  {combination.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-theme-text-primary">{combination.frequency}</div>
                <div className="text-xs text-theme-text-tertiary">occurrences</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal Usage */}
      <div className="bg-theme-bg-primary rounded-lg p-6 border">
        <h4 className="text-lg font-medium text-theme-text-primary mb-4">Seasonal Usage Patterns</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(analyticsData.usagePatterns.seasonalUsage).map(([month, usage]) => (
            <div key={month} className="text-center">
              <div className="text-2xl font-bold text-blue-600">{usage}</div>
              <div className="text-sm text-theme-text-secondary">{month}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 