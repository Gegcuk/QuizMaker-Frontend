import React, { useState, useEffect } from 'react';
import { TagDto, QuizDto } from '@/types';
import { TagService, QuizService, api } from '@/services';
import { Spinner } from '@/components';

interface TagCloudProps {
  onTagClick?: (tag: TagDto) => void;
  className?: string;
  maxTags?: number;
  minFontSize?: number;
  maxFontSize?: number;
  showCounts?: boolean;
  interactive?: boolean;
}

interface TagWithUsage extends TagDto {
  usageCount: number;
  fontSize: number;
}

export const TagCloud: React.FC<TagCloudProps> = ({
  onTagClick,
  className = '',
  maxTags = 50,
  minFontSize = 12,
  maxFontSize = 32,
  showCounts = true,
  interactive = true
}) => {
  const [tags, setTags] = useState<TagWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  const tagService = new TagService(api);
  const quizService = new QuizService(api);

  useEffect(() => {
    loadTagCloud();
  }, []);

  const loadTagCloud = async () => {
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

      // Calculate usage count for each tag
      const tagUsageMap = new Map<string, number>();
      
      allQuizzes.forEach(quiz => {
        quiz.tagIds.forEach(tagId => {
          tagUsageMap.set(tagId, (tagUsageMap.get(tagId) || 0) + 1);
        });
      });

      // Create tag cloud data with usage counts
      const tagsWithUsage = allTags
        .map(tag => ({
          ...tag,
          usageCount: tagUsageMap.get(tag.id) || 0,
          fontSize: minFontSize // Default fontSize, will be calculated later
        }))
        .filter(tag => tag.usageCount > 0) // Only show tags that are actually used
        .sort((a, b) => b.usageCount - a.usageCount) // Sort by usage
        .slice(0, maxTags) as TagWithUsage[]; // Limit to max tags

      // Calculate font sizes based on usage
      if (tagsWithUsage.length > 0) {
        const maxUsage = Math.max(...tagsWithUsage.map(t => t.usageCount));
        const minUsage = Math.min(...tagsWithUsage.map(t => t.usageCount));

        tagsWithUsage.forEach(tag => {
          if (maxUsage === minUsage) {
            tag.fontSize = (minFontSize + maxFontSize) / 2;
          } else {
            const normalizedUsage = (tag.usageCount - minUsage) / (maxUsage - minUsage);
            tag.fontSize = minFontSize + (normalizedUsage * (maxFontSize - minFontSize));
          }
        });
      }

      setTags(tagsWithUsage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tag cloud');
    } finally {
      setLoading(false);
    }
  };

  const getTagColor = (usageCount: number, maxUsage: number) => {
    if (usageCount === 0) return 'text-theme-text-tertiary';
    
    const ratio = usageCount / maxUsage;
    
    if (ratio > 0.8) return 'text-red-600';
    if (ratio > 0.6) return 'text-orange-600';
    if (ratio > 0.4) return 'text-yellow-600';
    if (ratio > 0.2) return 'text-green-600';
    return 'text-theme-interactive-primary';
  };

  const getTagBackground = (usageCount: number, maxUsage: number) => {
    if (usageCount === 0) return 'bg-theme-bg-tertiary';
    
    const ratio = usageCount / maxUsage;
    
    if (ratio > 0.8) return 'bg-red-100 hover:bg-red-200';
    if (ratio > 0.6) return 'bg-orange-100 hover:bg-orange-200';
    if (ratio > 0.4) return 'bg-yellow-100 hover:bg-yellow-200';
    if (ratio > 0.2) return 'bg-green-100 hover:bg-green-200';
    return 'bg-blue-100 hover:bg-blue-200';
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className={`bg-theme-bg-secondary rounded-lg p-8 text-center ${className}`}>
        <svg className="mx-auto h-12 w-12 text-theme-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <h3 className="text-lg font-medium text-theme-text-primary mb-2">No tags found</h3>
        <p className="text-theme-text-tertiary">Tags will appear here once they are used in quizzes.</p>
      </div>
    );
  }

  const maxUsage = Math.max(...tags.map(t => t.usageCount));

  return (
    <div className={`bg-theme-bg-primary rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-theme-text-primary">Tag Cloud</h3>
        <p className="text-sm text-theme-text-tertiary">
          {tags.length} tags • Size indicates usage frequency
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {tags.map((tag) => {
          const isHovered = hoveredTag === tag.id;
          const colorClass = getTagColor(tag.usageCount, maxUsage);
          const bgClass = getTagBackground(tag.usageCount, maxUsage);
          
          return (
            <button
              key={tag.id}
              onClick={() => onTagClick && onTagClick(tag)}
              onMouseEnter={() => setHoveredTag(tag.id)}
              onMouseLeave={() => setHoveredTag(null)}
              disabled={!interactive}
              className={`
                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                transition-all duration-200 ease-in-out
                ${colorClass}
                ${bgClass}
                ${interactive ? 'cursor-pointer transform hover:scale-105' : 'cursor-default'}
                ${isHovered ? 'shadow-md' : 'shadow-sm'}
              `}
              style={{
                fontSize: `${tag.fontSize}px`,
                lineHeight: '1.2'
              }}
              title={showCounts ? `${tag.name} (${tag.usageCount} quizzes)` : tag.name}
            >
              <span className="truncate max-w-32">{tag.name}</span>
              {showCounts && (
                <span className="ml-1 text-xs opacity-75">({tag.usageCount})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-theme-border-primary">
        <div className="flex items-center justify-center space-x-4 text-xs text-theme-text-tertiary">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 rounded-full mr-1"></div>
            <span>High usage</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-100 rounded-full mr-1"></div>
            <span>Medium usage</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 rounded-full mr-1"></div>
            <span>Low usage</span>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="font-semibold text-theme-text-primary">{tags.length}</div>
          <div className="text-theme-text-tertiary">Total Tags</div>
        </div>
        <div>
          <div className="font-semibold text-theme-text-primary">
            {Math.round(tags.reduce((sum, tag) => sum + tag.usageCount, 0) / tags.length)}
          </div>
          <div className="text-theme-text-tertiary">Avg Usage</div>
        </div>
        <div>
          <div className="font-semibold text-theme-text-primary">{maxUsage}</div>
          <div className="text-theme-text-tertiary">Max Usage</div>
        </div>
      </div>
    </div>
  );
}; 