// ---------------------------------------------------------------------------
// QuestionBank.tsx - Reusable question library component
// Browse and select questions from a question bank
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionDto, QuestionType, QuestionDifficulty } from '@/types';
import { QuestionService } from '@/services';
import { getQuestionTypeIcon } from '@/utils/questionUtils';
import { getDifficultyBadgeVariant } from '@/utils/statusHelpers';
import { Spinner, Badge, Button, Input, Dropdown, Checkbox, Alert } from '@/components';
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
      <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary">
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
      <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions..."
            label="Search"
            fullWidth
          />

          {/* Type Filter */}
          <Dropdown
            value={selectedType}
            onChange={(value) => setSelectedType(value as QuestionType | 'ALL')}
            options={[
              { label: 'All Types', value: 'ALL' },
              { label: 'Single Choice', value: 'MCQ_SINGLE' },
              { label: 'Multiple Choice', value: 'MCQ_MULTI' },
              { label: 'True/False', value: 'TRUE_FALSE' },
              { label: 'Open Ended', value: 'OPEN' },
              { label: 'Fill in the Blank', value: 'FILL_GAP' },
              { label: 'Compliance', value: 'COMPLIANCE' },
              { label: 'Ordering', value: 'ORDERING' },
              { label: 'Hotspot', value: 'HOTSPOT' },
              { label: 'Matching', value: 'MATCHING' }
            ]}
            label="Type"
            fullWidth
          />

          {/* Difficulty Filter */}
          <Dropdown
            value={selectedDifficulty}
            onChange={(value) => setSelectedDifficulty(value as QuestionDifficulty | 'ALL')}
            options={[
              { label: 'All Difficulties', value: 'ALL' },
              { label: 'Easy', value: 'EASY' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Hard', value: 'HARD' }
            ]}
            label="Difficulty"
            fullWidth
          />

          {/* Clear Filters */}
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('ALL');
                setSelectedDifficulty('ALL');
              }}
              fullWidth
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-6 py-4 border-b border-theme-border-primary">
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
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
                  <div 
                    className="flex-shrink-0 mt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleQuestionSelect(question)}
                      label=""
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
        <div className="px-6 py-4 border-t border-theme-border-primary bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary">
          <div className="flex items-center justify-between">
            <div className="text-sm text-theme-text-secondary">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredQuestions.length)} of {filteredQuestions.length} results
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                title="Previous page"
                aria-label="Go to previous page"
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm text-theme-text-secondary">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                title="Next page"
                aria-label="Go to next page"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank; 
