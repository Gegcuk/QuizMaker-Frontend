// src/components/QuizQuestionManager.tsx
// ---------------------------------------------------------------------------
// Add/remove questions from quiz based on QUIZ_ENDPOINTS
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionDto } from '../../types/question.types';
import { getAllQuestions } from '../../api/question.service';
import type { AxiosError } from 'axios';

interface QuizQuestionManagerProps {
  quizId: string;
  currentQuestionIds: string[];
  onQuestionsChange: (questionIds: string[]) => void;
  className?: string;
}

interface QuestionWithStatus extends QuestionDto {
  isSelected: boolean;
}

const QuizQuestionManager: React.FC<QuizQuestionManagerProps> = ({
  quizId,
  currentQuestionIds,
  onQuestionsChange,
  className = ''
}) => {
  const [questions, setQuestions] = useState<QuestionWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Load available questions
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await getAllQuestions();
        const questionsWithStatus = response.content.map((question: QuestionDto) => ({
          ...question,
          isSelected: currentQuestionIds.includes(question.id)
        }));
        setQuestions(questionsWithStatus);
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const errorMessage = axiosError.response?.data?.message || 'Failed to load questions';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [currentQuestionIds]);

  // Filter questions based on search and filters
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || question.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || question.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesType && matchesDifficulty;
  });

  // Handle question selection
  const handleQuestionToggle = (questionId: string) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, isSelected: !q.isSelected } : q
    );
    setQuestions(updatedQuestions);
    
    const selectedIds = updatedQuestions
      .filter(q => q.isSelected)
      .map(q => q.id);
    
    onQuestionsChange(selectedIds);
  };

  // Handle bulk selection
  const handleBulkSelect = (selectAll: boolean) => {
    const updatedQuestions = questions.map(q => ({ ...q, isSelected: selectAll }));
    setQuestions(updatedQuestions);
    
    const selectedIds = selectAll ? questions.map(q => q.id) : [];
    onQuestionsChange(selectedIds);
  };

  // Get question type icon
  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'MCQ_SINGLE':
        return '🔘';
      case 'MCQ_MULTI':
        return '☑️';
      case 'TRUE_FALSE':
        return '✅';
      case 'OPEN':
        return '📝';
      case 'FILL_GAP':
        return '⬜';
      case 'COMPLIANCE':
        return '📋';
      case 'ORDERING':
        return '📊';
      case 'HOTSPOT':
        return '🎯';
      default:
        return '❓';
    }
  };

  // Get difficulty color
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

  if (isLoading) {
    return (
      <div className={`bg-white shadow rounded-lg ${className}`}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Question Manager</h3>
        </div>
        <div className="px-6 py-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Question Manager</h3>
        <p className="mt-1 text-sm text-gray-500">
          Select questions to include in this quiz ({currentQuestionIds.length} selected)
        </p>
      </div>

      <div className="px-6 py-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search Questions
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by question text or type..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                id="type-filter"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All Types</option>
                <option value="MCQ_SINGLE">Single Choice</option>
                <option value="MCQ_MULTI">Multiple Choice</option>
                <option value="TRUE_FALSE">True/False</option>
                <option value="OPEN">Open Ended</option>
                <option value="FILL_GAP">Fill in the Gap</option>
                <option value="COMPLIANCE">Compliance</option>
                <option value="ORDERING">Ordering</option>
                <option value="HOTSPOT">Hotspot</option>
              </select>
            </div>
            <div>
              <label htmlFor="difficulty-filter" className="block text-sm font-medium text-gray-700">
                Difficulty
              </label>
              <select
                id="difficulty-filter"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleBulkSelect(true)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Select All
              </button>
              <button
                onClick={() => handleBulkSelect(false)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Clear All
              </button>
            </div>
            <p className="text-sm text-gray-500">
              {filteredQuestions.length} questions found
            </p>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <div
                key={question.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  question.isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleQuestionToggle(question.id)}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={question.isSelected}
                    onChange={() => handleQuestionToggle(question.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getQuestionTypeIcon(question.type)}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {question.type.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                    </div>
                                         <p className="text-sm text-gray-700 line-clamp-2">
                       {question.questionText}
                     </p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>ID: {question.id}</span>
                      <span>Created: {new Date(question.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{currentQuestionIds.length}</span> questions selected
            </p>
            <p className="text-sm text-gray-500">
              Estimated time: ~{currentQuestionIds.length * 2} minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestionManager; 