// src/components/QuizCard.tsx
// ---------------------------------------------------------------------------
// Individual quiz display card based on QuizDto
// Uses base Card component for consistent styling
// ---------------------------------------------------------------------------

import React from 'react';
import { Link } from 'react-router-dom';
import { QuizDto } from '@/types';
import { useQuizMetadata } from '../hooks/useQuizMetadata';
import { Badge, Button, Card, CardHeader, CardBody, CardFooter, CardActions } from '@/components';

interface QuizCardProps {
  quiz: QuizDto;
  showActions?: boolean;
  isSelected?: boolean;
  onEdit?: (quizId: string) => void;
  onDelete?: (quizId: string) => void;
  onExport?: (quizId: string) => void;
  onStart?: (quizId: string) => void;
  onSelect?: (quizId: string, selected: boolean) => void;
  className?: string;
}

const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  showActions = true,
  isSelected = false,
  onEdit,
  onDelete,
  onExport,
  onStart,
  onSelect,
  className = ''
}) => {
  const { getTagName, getCategoryName } = useQuizMetadata();
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileMenu]);
  
  // Helper function to get difficulty badge variant
  const getDifficultyVariant = (difficulty: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (difficulty) {
      case 'EASY':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HARD':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  // Helper function to get status badge variant
  const getStatusVariant = (status: string): 'success' | 'warning' | 'neutral' => {
    switch (status) {
      case 'PUBLISHED':
        return 'success';
      case 'DRAFT':
        return 'warning';
      case 'ARCHIVED':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  // Helper function to format time
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card 
      variant="elevated" 
      padding="md" 
      hoverable 
      selected={isSelected}
      className={className}
    >
      <CardBody>
        {/* Mobile Layout - Simplified */}
        <div className="md:hidden">
          {/* Header with checkbox, title and 3-dots menu */}
          <div className="flex items-start gap-3 mb-1">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(quiz.id, e.target.checked)}
                className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded mt-1"
              />
            )}
            <h3 className="text-lg font-semibold text-theme-text-primary truncate flex-1">
              {quiz.title}
            </h3>

            {/* 3-Dots Menu in Top Right */}
            {(onEdit || onExport) && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-1 text-theme-text-tertiary hover:text-theme-text-primary hover:bg-theme-bg-tertiary rounded transition-colors"
                  title="More options"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showMobileMenu && (
                  <div className="absolute right-0 mt-1 w-44 bg-theme-bg-primary rounded-lg shadow-lg border border-theme-border-primary z-50">
                    <div className="py-1">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            onEdit(quiz.id);
                            setShowMobileMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-theme-text-secondary hover:bg-theme-bg-secondary hover:text-theme-text-primary transition-colors flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Quiz
                        </button>
                      )}
                      {onExport && (
                        <button
                          type="button"
                          onClick={() => {
                            onExport(quiz.id);
                            setShowMobileMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-theme-text-secondary hover:bg-theme-bg-secondary hover:text-theme-text-primary transition-colors flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Export Quiz
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Estimated Time and Question Count */}
          <div className="flex items-center gap-3 text-sm text-theme-text-secondary mb-2">
            <span>{formatTime(quiz.estimatedTime)}</span>
            {quiz.questionCount !== undefined && (
              <>
                <span>•</span>
                <span>{quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2">
              {onStart && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onStart(quiz.id)}
                  disabled={quiz.status === 'DRAFT'}
                  title={quiz.status === 'DRAFT' ? 'Quiz must be published before it can be started' : 'Start this quiz'}
                >
                  Start Quiz
                </Button>
              )}
              <Link to={`/quizzes/${quiz.id}`}>
                <Button type="button" variant="outline" size="sm">View Details</Button>
              </Link>
              {onDelete && (
                <Button 
                  type="button" 
                  variant="danger" 
                  size="sm" 
                  onClick={() => onDelete(quiz.id)}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  }
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Desktop Layout - Full details */}
        <div className="hidden md:block">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              {onSelect && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelect(quiz.id, e.target.checked)}
                  className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded mt-1"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-theme-text-primary mb-1 truncate">
                  {quiz.title}
                </h3>
                {quiz.description && (
                  <p className="text-sm text-theme-text-secondary line-clamp-2">
                    {truncateText(quiz.description, 120)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Badge variant={getDifficultyVariant(quiz.difficulty)} size="sm">{quiz.difficulty}</Badge>
              <Badge variant={getStatusVariant(quiz.status)} size="sm">{quiz.status}</Badge>
            </div>
          </div>

          {/* Quiz Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="flex items-center text-theme-text-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatTime(quiz.estimatedTime)}</span>
            </div>
            <div className="flex items-center text-theme-text-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{quiz.timerEnabled ? formatTime(quiz.timerDuration) : 'No limit'}</span>
            </div>
          </div>

          {/* Quiz Features */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center text-sm text-theme-text-secondary">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{quiz.visibility}</span>
            </div>
            <div className="flex items-center text-sm text-theme-text-secondary">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>{getCategoryName(quiz.categoryId)}</span>
            </div>
            {quiz.isRepetitionEnabled && (
              <div className="flex items-center text-sm text-theme-text-secondary">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Multiple attempts</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {quiz.tagIds && quiz.tagIds.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {quiz.tagIds.slice(0, 3).map((tagId) => (
                  <span
                    key={tagId}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-theme-bg-tertiary text-theme-text-primary"
                  >
                    #{getTagName(tagId)}
                  </span>
                ))}
                {quiz.tagIds.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-theme-bg-tertiary text-theme-text-secondary">
                    +{quiz.tagIds.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Created/Updated Info */}
          <div className="text-xs text-theme-text-tertiary mb-4">
            <div>Created: {new Date(quiz.createdAt).toLocaleDateString()}</div>
            <div>Updated: {new Date(quiz.updatedAt).toLocaleDateString()}</div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center justify-between pt-4 border-t border-theme-border-primary">
              <div className="flex space-x-2">
                {onStart && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => onStart(quiz.id)}
                    disabled={quiz.status === 'DRAFT'}
                    title={quiz.status === 'DRAFT' ? 'Quiz must be published before it can be started' : 'Start this quiz'}
                  >
                    Start Quiz
                  </Button>
                )}
                <Link to={`/quizzes/${quiz.id}`}>
                  <Button type="button" variant="outline" size="sm">View Details</Button>
                </Link>
              </div>
              <div className="flex space-x-2">
                {onEdit && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(quiz.id)} title="Edit quiz">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                )}
                {onExport && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onExport(quiz.id)} title="Export quiz">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </Button>
                )}
                {onDelete && (
                  <Button type="button" variant="danger" size="sm" onClick={() => onDelete(quiz.id)} title="Delete quiz">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default QuizCard; 
