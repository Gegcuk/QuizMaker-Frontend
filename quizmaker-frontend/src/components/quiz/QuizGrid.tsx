// src/components/QuizGrid.tsx
// ---------------------------------------------------------------------------
// Grid layout for quiz listings
// ---------------------------------------------------------------------------

import React from 'react';
import { QuizDto } from '@/types';
import { QuizCard } from './';

interface QuizGridProps {
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

const QuizGrid: React.FC<QuizGridProps> = ({
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
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md animate-pulse">
            <div className="p-6 border-b border-gray-200">
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
              </div>
            </div>
            <div className="p-6">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
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
    <div className={`space-y-4 ${className}`}>
      {/* Select All Checkbox */}
      {onSelectAll && (
        <div className="flex items-center space-x-2 mb-4">
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
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {quizzes.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            showActions={showActions}
            isSelected={selectedQuizzes.includes(quiz.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            onStart={onStart}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default QuizGrid; 