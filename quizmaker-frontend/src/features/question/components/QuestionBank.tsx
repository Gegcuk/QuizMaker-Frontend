// ---------------------------------------------------------------------------
// QuestionBank.tsx - Reusable question library component
// Browse and select questions from a question bank
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionDto, QuestionType, QuestionDifficulty } from '@/types';
import { QuestionService } from '@/services';
import { getQuestionTypeIcon } from '@/utils/questionUtils';
import { getDifficultyBadgeVariant } from '@/utils/statusHelpers';
import { Spinner, Badge, Button } from '@/components';
import { api } from '@/services';

interface QuestionBankProps {
  onQuestionSelect?: (question: QuestionDto) => void;
  selectedQuestionIds?: string[];
  onSelectionChange?: (questionIds: string[]) => void;
  quizId?: string; // If provided, filter questions already in this quiz
  className?: string;
}

const QuestionBank: React.FC<QuestionBankProps> = ({
  onQuestionSelect,
  selectedQuestionIds = [],
  onSelectionChange,
  quizId,
  className = ''
}) => {
  const questionService = new QuestionService(api);
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<QuestionType | 'ALL'>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuestionDifficulty | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load questions
  useEffect(() => {
    loadQuestions();
  }, [currentPage, searchTerm, selectedType, selectedDifficulty]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implement proper pagination and filtering in question.service.ts
      const response = await questionService.getQuestions();
      setQuestions(response.content);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  // Filter questions based on search and filters
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.questionText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || question.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'ALL' || question.difficulty === selectedDifficulty;
    const notInQuiz = !quizId || !question.quizIds.includes(quizId);
    
    return matchesSearch && matchesType && matchesDifficulty && notInQuiz;
  });

  // Paginate questions
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleQuestionSelect = (question: QuestionDto) => {
    if (onQuestionSelect) {
      onQuestionSelect(question);
    }
    
    if (onSelectionChange) {
      const isSelected = selectedQuestionIds.includes(question.id);
      if (isSelected) {
        onSelectionChange(selectedQuestionIds.filter(id => id !== question.id));
      } else {
        onSelectionChange([...selectedQuestionIds, question.id]);
      }
    }
  };



  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className={`bg-theme-bg-primary shadow-theme rounded-lg border border-theme-border-primary ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-secondary">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-theme-text-primary">Question Bank</h3>
            <p className="text-sm text-theme-text-tertiary">
              Browse and select questions from your question library
            </p>
          </div>
          <div className="text-sm text-theme-text-tertiary">
            {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-secondary">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-theme-text-secondary mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions..."
              className="block w-full border-theme-border-primary rounded-md shadow-sm bg-theme-bg-primary text-theme-text-primary focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-theme-text-secondary mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as QuestionType | 'ALL')}
              className="block w-full border-theme-border-primary rounded-md shadow-sm bg-theme-bg-primary text-theme-text-primary focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm"
            >
              <option value="ALL" className="bg-theme-bg-primary text-theme-text-primary">All Types</option>
              <option value="MCQ_SINGLE" className="bg-theme-bg-primary text-theme-text-primary">Multiple Choice (Single)</option>
              <option value="MCQ_MULTI" className="bg-theme-bg-primary text-theme-text-primary">Multiple Choice (Multi)</option>
              <option value="TRUE_FALSE" className="bg-theme-bg-primary text-theme-text-primary">True/False</option>
              <option value="OPEN" className="bg-theme-bg-primary text-theme-text-primary">Open Ended</option>
              <option value="FILL_GAP" className="bg-theme-bg-primary text-theme-text-primary">Fill in the Blank</option>
              <option value="COMPLIANCE" className="bg-theme-bg-primary text-theme-text-primary">Compliance</option>
              <option value="ORDERING" className="bg-theme-bg-primary text-theme-text-primary">Ordering</option>
              <option value="HOTSPOT" className="bg-theme-bg-primary text-theme-text-primary">Hotspot</option>
              <option value="MATCHING" className="bg-theme-bg-primary text-theme-text-primary">Matching</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium text-theme-text-secondary mb-1">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as QuestionDifficulty | 'ALL')}
              className="block w-full border-theme-border-primary rounded-md shadow-sm bg-theme-bg-primary text-theme-text-primary focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm"
            >
              <option value="ALL" className="bg-theme-bg-primary text-theme-text-primary">All Difficulties</option>
              <option value="EASY" className="bg-theme-bg-primary text-theme-text-primary">Easy</option>
              <option value="MEDIUM" className="bg-theme-bg-primary text-theme-text-primary">Medium</option>
              <option value="HARD" className="bg-theme-bg-primary text-theme-text-primary">Hard</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('ALL');
                setSelectedDifficulty('ALL');
              }}
              className="w-full px-4 py-2 border border-theme-border-primary rounded-md shadow-sm text-sm font-medium text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-6 py-4 bg-theme-bg-danger border-b border-theme-border-danger">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-theme-text-danger" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-theme-text-danger">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="divide-y divide-theme-border-primary">
        {paginatedQuestions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No questions found</h3>
            <p className="mt-1 text-sm text-theme-text-tertiary">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        ) : (
          paginatedQuestions.map((question) => {
            const isSelected = selectedQuestionIds.includes(question.id);
            return (
              <div
                key={question.id}
                className={`p-3 group hover:bg-theme-bg-secondary cursor-pointer transition-colors ${
                  isSelected ? 'bg-theme-bg-tertiary border-l-4 border-theme-interactive-primary' : ''
                }`}
                onClick={() => handleQuestionSelect(question)}
              >
                <div className="flex items-start space-x-4">
                  {/* Selection Checkbox */}
                  <div className="flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleQuestionSelect(question)}
                      className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getQuestionTypeIcon(question.type)}</span>
                      <Badge
                        variant={
                          question.difficulty === 'EASY'
                            ? 'success'
                            : question.difficulty === 'MEDIUM'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {question.difficulty}
                      </Badge>
                      <Badge variant="info" size="sm">{question.type.replace('_', ' ')}</Badge>
                    </div>
                    
                    <h4 className="text-sm font-medium text-theme-text-primary mb-1 group-hover:text-theme-interactive-primary">
                      {truncateText(question.questionText, 100)}
                    </h4>
                    
                    {question.hint && (
                      <p className="text-xs text-theme-text-tertiary mb-1">
                        Hint: {truncateText(question.hint, 80)}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-theme-text-tertiary">
                      <span>ID: {question.id}</span>
                      {question.quizIds.length > 0 && (
                        <span>Used in {question.quizIds.length} quiz{question.quizIds.length !== 1 ? 'zes' : ''}</span>
                      )}
                      {question.tagIds.length > 0 && (
                        <span>{question.tagIds.length} tag{question.tagIds.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title={isSelected ? 'Deselect' : 'Select'}
                      aria-label={isSelected ? 'Deselect question' : 'Select question'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuestionSelect(question);
                      }}
                    >
                      {isSelected ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-theme-border-primary bg-theme-bg-secondary">
          <div className="flex items-center justify-between">
            <div className="text-sm text-theme-text-secondary">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredQuestions.length)} of {filteredQuestions.length} results
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-theme-border-primary rounded-md text-sm font-medium text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-theme-text-secondary">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-theme-border-primary rounded-md text-sm font-medium text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank; 
