// src/components/QuizQuestionManager.tsx
// ---------------------------------------------------------------------------
// Modern list-based question manager with clean UX design
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionDto, QuestionService } from '../../features/question';
import api from '../../api/axiosInstance';
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
  const questionService = new QuestionService(api);
  const [questions, setQuestions] = useState<QuestionWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Load available questions only once
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await questionService.getQuestions();
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
  }, []); // Remove currentQuestionIds dependency to prevent backend calls on selection

  // Update selection status when currentQuestionIds changes
  useEffect(() => {
    setQuestions(prevQuestions => 
      prevQuestions.map(question => ({
        ...question,
        isSelected: currentQuestionIds.includes(question.id)
      }))
    );
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
    const updatedQuestions = filteredQuestions.map(q => ({ ...q, isSelected: selectAll }));
    // Update the main questions array with the changes from filtered questions
    const updatedMainQuestions = questions.map(q => {
      const filteredQuestion = updatedQuestions.find(fq => fq.id === q.id);
      return filteredQuestion ? filteredQuestion : q;
    });
    setQuestions(updatedMainQuestions);
    
    const selectedIds = updatedMainQuestions
      .filter(q => q.isSelected)
      .map(q => q.id);
    
    onQuestionsChange(selectedIds);
  };

  // Get question type display name and icon
  const getQuestionTypeInfo = (type: string) => {
    switch (type) {
      case 'MCQ_SINGLE':
        return { name: 'Single Choice', icon: '🔘' };
      case 'MCQ_MULTI':
        return { name: 'Multiple Choice', icon: '☑️' };
      case 'TRUE_FALSE':
        return { name: 'True/False', icon: '✅' };
      case 'OPEN':
        return { name: 'Open Ended', icon: '📝' };
      case 'FILL_GAP':
        return { name: 'Fill Gap', icon: '⬜' };
      case 'COMPLIANCE':
        return { name: 'Compliance', icon: '📋' };
      case 'ORDERING':
        return { name: 'Ordering', icon: '📊' };
      case 'HOTSPOT':
        return { name: 'Hotspot', icon: '🎯' };
      default:
        return { name: type, icon: '❓' };
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

  // Get question type color
  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'MCQ_SINGLE':
      case 'MCQ_MULTI':
        return 'bg-blue-100 text-blue-800';
      case 'TRUE_FALSE':
        return 'bg-green-100 text-green-800';
      case 'OPEN':
        return 'bg-purple-100 text-purple-800';
      case 'FILL_GAP':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLIANCE':
        return 'bg-red-100 text-red-800';
      case 'ORDERING':
        return 'bg-indigo-100 text-indigo-800';
      case 'HOTSPOT':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Truncate text helper
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Add Questions</h3>
          <p className="text-sm text-gray-500">Select questions to include in your quiz</p>
        </div>
        
        {/* Loading List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="p-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-4 w-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-6"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-300 rounded-full w-20"></div>
                    <div className="h-6 bg-gray-300 rounded-full w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Add Questions</h3>
          <p className="text-sm text-gray-500">
            Select questions to include in your quiz ({currentQuestionIds.length} selected)
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Questions
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by question text or type..."
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Types</option>
              <option value="MCQ_SINGLE">Single Choice</option>
              <option value="MCQ_MULTI">Multiple Choice</option>
              <option value="TRUE_FALSE">True/False</option>
              <option value="OPEN">Open Ended</option>
              <option value="FILL_GAP">Fill Gap</option>
              <option value="COMPLIANCE">Compliance</option>
              <option value="ORDERING">Ordering</option>
              <option value="HOTSPOT">Hotspot</option>
            </select>
          </div>
          <div>
            <label htmlFor="difficulty-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              id="difficulty-filter"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => handleBulkSelect(true)}
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Select All Visible
            </button>
            <button
              type="button"
              onClick={() => handleBulkSelect(false)}
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Clear All Visible
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {filteredQuestions.length} questions found
          </p>
        </div>
      </div>

      {/* Questions List */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {filteredQuestions.map((question) => {
              const typeInfo = getQuestionTypeInfo(question.type);
              
              return (
                <div
                  key={question.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    question.isSelected ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => handleQuestionToggle(question.id)}
                >
                  <div className="flex items-center space-x-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={question.isSelected}
                      onChange={() => handleQuestionToggle(question.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* Question Icon */}
                    <span className="text-lg flex-shrink-0">{typeInfo.icon}</span>
                    
                    {/* Question Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {truncateText(question.questionText, 150)}
                      </p>
                    </div>
                    
                    {/* Type and Difficulty Badges */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQuestionTypeColor(question.type)}`}>
                        {typeInfo.name}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      {currentQuestionIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-indigo-900">
              {currentQuestionIds.length} questions selected for your quiz
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizQuestionManager; 