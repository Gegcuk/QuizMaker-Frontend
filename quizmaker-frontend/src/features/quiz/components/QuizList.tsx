// src/components/QuizList.tsx
// ---------------------------------------------------------------------------
// List layout for quiz listings
// ---------------------------------------------------------------------------

import React from 'react';
import { Link } from 'react-router-dom';
import { QuizDto } from '@/types';
import { useQuizMetadata } from '../hooks/useQuizMetadata';
import { Badge } from '@/components';

interface QuizListProps {
  quizzes: QuizDto[];
  isLoading?: boolean;
  showActions?: boolean;
  selectedQuizzes?: string[];
  onEdit?: (quizId: string) => void;
  onDelete?: (quizId: string) => void;
  onStart?: (quizId: string) => void;
  onSelect?: (quizId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  className?: string;
}

const QuizList: React.FC<QuizListProps> = ({
  quizzes,
  isLoading = false,
  showActions = true,
  selectedQuizzes = [],
  onEdit,
  onDelete,
  onStart,
  onSelect,
  onSelectAll,
  className = ''
}) => {
  const { getTagName, getCategoryName } = useQuizMetadata();
  // Helper function to get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HARD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (isLoading) {
    return (
      <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
        <ul className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="animate-pulse">
              <div className="px-4 py-4 sm:px-6 group hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="h-5 bg-gray-300 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                    <div className="h-6 bg-gray-300 rounded w-20"></div>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                  <div className="h-4 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No quizzes found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first quiz.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow overflow-hidden sm:rounded-md ${className}`}>
      {/* Select All Checkbox */}
      {onSelectAll && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedQuizzes.length === quizzes.length && quizzes.length > 0}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="text-sm font-medium text-gray-700">
              Select All ({selectedQuizzes.length}/{quizzes.length})
            </label>
          </div>
        </div>
      )}
      
      <ul className="divide-y divide-gray-200">
        {quizzes.map((quiz) => (
          <li key={quiz.id} className={`hover:bg-gray-50 transition-colors duration-150 ${selectedQuizzes.includes(quiz.id) ? 'bg-indigo-50' : ''}`}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    {onSelect && (
                      <input
                        type="checkbox"
                        checked={selectedQuizzes.includes(quiz.id)}
                        onChange={(e) => onSelect(quiz.id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    )}
                    <h3 className="text-lg font-medium text-gray-900 truncate group-hover:text-indigo-700">
                      {quiz.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          quiz.difficulty === 'EASY'
                            ? 'success'
                            : quiz.difficulty === 'MEDIUM'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {quiz.difficulty}
                      </Badge>
                      <Badge
                        variant={
                          quiz.status === 'PUBLISHED'
                            ? 'success'
                            : quiz.status === 'DRAFT'
                            ? 'warning'
                            : 'secondary'
                        }
                        size="sm"
                      >
                        {quiz.status}
                      </Badge>
                    </div>
                  </div>
                  {quiz.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {showActions && onStart && (
                    <button
                      onClick={() => onStart(quiz.id)}
                      disabled={quiz.status === 'DRAFT'}
                      className={`px-3 py-1 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        quiz.status === 'DRAFT'
                          ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                          : 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                      }`}
                      title={quiz.status === 'DRAFT' ? 'Quiz must be published before it can be started' : 'Start this quiz'}
                    >
                      Start Quiz
                    </button>
                  )}
                  <Link
                    to={`/quizzes/${quiz.id}`}
                    className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View Details
                  </Link>
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatTime(quiz.estimatedTime)}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{quiz.visibility}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>{getCategoryName(quiz.categoryId)}</span>
                    </div>
                    {quiz.isRepetitionEnabled && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Multiple attempts</span>
                      </div>
                    )}
                  </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-500">
                    Created: {new Date(quiz.createdAt).toLocaleDateString()}
                  </div>
                  {showActions && (
                    <div className="flex items-center space-x-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(quiz.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(quiz.id)}
                          className="p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {quiz.tagIds && quiz.tagIds.length > 0 && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {quiz.tagIds.slice(0, 5).map((tagId) => (
                      <span
                        key={tagId}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        #{getTagName(tagId)}
                      </span>
                    ))}
                    {quiz.tagIds.length > 5 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{quiz.tagIds.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuizList; 
