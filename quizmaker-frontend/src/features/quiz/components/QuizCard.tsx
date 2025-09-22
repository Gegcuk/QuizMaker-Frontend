// src/components/QuizCard.tsx
// ---------------------------------------------------------------------------
// Individual quiz display card based on QuizDto
// ---------------------------------------------------------------------------

import React from 'react';
import { Link } from 'react-router-dom';
import { QuizDto } from '@/types';
import { useQuizMetadata } from '../hooks/useQuizMetadata';
import { Badge, Button } from '@/components';

interface QuizCardProps {
  quiz: QuizDto;
  showActions?: boolean;
  isSelected?: boolean;
  onEdit?: (quizId: string) => void;
  onDelete?: (quizId: string) => void;
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
  onStart,
  onSelect,
  className = ''
}) => {
  const { getTagName, getCategoryName } = useQuizMetadata();
  const difficultyToBadge = (d: string) => (d === 'EASY' ? 'success' : d === 'MEDIUM' ? 'warning' : 'danger');
  const statusToBadge = (s: string) => (s === 'PUBLISHED' ? 'success' : s === 'DRAFT' ? 'warning' : 'secondary');

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
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ${isSelected ? 'ring-2 ring-indigo-500' : ''} ${className}`}>
      {/* Card Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(quiz.id, e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {quiz.title}
              </h3>
              {quiz.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {truncateText(quiz.description, 120)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Badge variant={difficultyToBadge(quiz.difficulty)} size="sm">{quiz.difficulty}</Badge>
            <Badge variant={statusToBadge(quiz.status)} size="sm">{quiz.status}</Badge>
          </div>
        </div>

        {/* Quiz Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatTime(quiz.estimatedTime)}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{quiz.timerEnabled ? formatTime(quiz.timerDuration) : 'No limit'}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6">
        {/* Quiz Features */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{quiz.visibility}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>{getCategoryName(quiz.categoryId)}</span>
          </div>
          {quiz.isRepetitionEnabled && (
            <div className="flex items-center text-sm text-gray-600">
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
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  #{getTagName(tagId)}
                </span>
              ))}
              {quiz.tagIds.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  +{quiz.tagIds.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Created/Updated Info */}
        <div className="text-xs text-gray-500 mb-4">
          <div>Created: {new Date(quiz.createdAt).toLocaleDateString()}</div>
          <div>Updated: {new Date(quiz.updatedAt).toLocaleDateString()}</div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
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
              {onDelete && (
                <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(quiz.id)} title="Delete quiz" className="text-red-600 hover:text-red-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizCard; 
