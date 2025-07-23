import React, { useState, useEffect } from 'react';
import { QuizService } from '../../api/quiz.service';
import { QuestionService } from '../../api/question.service';
import api from '../../api/axiosInstance';
import { 
  QuizDto,
  QuizStatus,
  Visibility
} from '../../types/quiz.types';
import { QuestionDto, QuestionType } from '../../types/question.types';

interface GeneratedQuizPreviewProps {
  quizId: string;
  onQuizPublished?: (quizId: string) => void;
  onQuizEdited?: (quizId: string) => void;
  onQuizDeleted?: () => void;
  className?: string;
}

const GeneratedQuizPreview: React.FC<GeneratedQuizPreviewProps> = ({ 
  quizId, 
  onQuizPublished, 
  onQuizEdited, 
  onQuizDeleted,
  className = '' 
}) => {
  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [showQuestionDetails, setShowQuestionDetails] = useState(false);

  const quizService = new QuizService(api);
  const questionService = new QuestionService(api);

  useEffect(() => {
    if (quizId) {
      loadQuiz();
      loadQuestions();
    }
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const quizData = await quizService.getQuizById(quizId);
      setQuiz(quizData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quiz';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      setIsLoadingQuestions(true);
      setError(null);
      const response = await questionService.getQuestions({ quizId });
      setQuestions(response.content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load questions';
      setError(errorMessage);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handlePublishQuiz = async () => {
    if (!quiz) return;

    try {
      setIsPublishing(true);
      setError(null);
      
      // Update quiz status to PUBLISHED and visibility to PUBLIC
      await quizService.updateQuizStatus(quizId, { status: 'PUBLISHED' as QuizStatus });
      await quizService.updateQuizVisibility(quizId, { visibility: 'PUBLIC' as Visibility });
      
      // Reload quiz to get updated data
      await loadQuiz();
      onQuizPublished?.(quizId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish quiz';
      setError(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quiz) return;

    if (!window.confirm('Are you sure you want to delete this generated quiz? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await quizService.deleteQuiz(quizId);
      onQuizDeleted?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete quiz';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'MCQ_SINGLE': return 'Multiple Choice (Single)';
      case 'MCQ_MULTI': return 'Multiple Choice (Multiple)';
      case 'TRUE_FALSE': return 'True/False';
      case 'OPEN': return 'Open Ended';
      case 'FILL_GAP': return 'Fill in the Gap';
      case 'COMPLIANCE': return 'Compliance';
      case 'ORDERING': return 'Ordering';
      case 'HOTSPOT': return 'Hotspot';
      default: return type;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'HARD': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: QuizStatus) => {
    switch (status) {
      case 'PUBLISHED': return 'text-green-600 bg-green-50';
      case 'DRAFT': return 'text-yellow-600 bg-yellow-50';
      case 'ARCHIVED': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const renderQuestionContent = (question: QuestionDto) => {
    switch (question.type) {
      case 'MCQ_SINGLE':
      case 'MCQ_MULTI':
        const options = question.content as any;
        return (
          <div className="space-y-2">
            {options.options?.map((option: any) => (
              <div key={option.id} className="flex items-center">
                <div className={`w-4 h-4 rounded border mr-3 ${option.correct ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                  {option.correct && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{option.text}</span>
              </div>
            ))}
          </div>
        );

      case 'TRUE_FALSE':
        const answer = question.content as any;
        return (
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Correct Answer:</span>
            <span className={`px-2 py-1 rounded text-sm ${answer.answer ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {answer.answer ? 'True' : 'False'}
            </span>
          </div>
        );

      case 'OPEN':
        const openAnswer = question.content as any;
        return (
          <div>
            <p className="text-sm font-medium mb-2">Model Answer:</p>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{openAnswer.answer}</p>
          </div>
        );

      case 'FILL_GAP':
        const gapContent = question.content as any;
        return (
          <div>
            <p className="text-sm mb-2">Text with gaps:</p>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{gapContent.text}</p>
            <div className="mt-2">
              <p className="text-sm font-medium">Answers:</p>
              {gapContent.gaps?.map((gap: any) => (
                <div key={gap.id} className="text-sm text-gray-600">
                  Gap {gap.id}: {gap.answer}
                </div>
              ))}
            </div>
          </div>
        );

      case 'COMPLIANCE':
        const complianceContent = question.content as any;
        return (
          <div className="space-y-2">
            {complianceContent.statements?.map((statement: any) => (
              <div key={statement.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{statement.text}</span>
                <span className={`px-2 py-1 rounded text-xs ${statement.compliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {statement.compliant ? 'Compliant' : 'Non-compliant'}
                </span>
              </div>
            ))}
          </div>
        );

      case 'ORDERING':
        const orderingContent = question.content as any;
        return (
          <div className="space-y-2">
            {orderingContent.items?.map((item: any, index: number) => (
              <div key={item.id} className="flex items-center p-2 bg-gray-50 rounded">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-3">
                  {index + 1}
                </span>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        );

      default:
        return <p className="text-sm text-gray-500">Content preview not available</p>;
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white border rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className={`bg-white border rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p>Quiz not found or failed to load</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg ${className}`}>
      {/* Quiz Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{quiz.title}</h3>
            {quiz.description && (
              <p className="text-gray-600 mb-3">{quiz.description}</p>
            )}
            <div className="flex items-center space-x-4 text-sm">
              <span className={`px-2 py-1 rounded-full ${getDifficultyColor(quiz.difficulty)}`}>
                {quiz.difficulty}
              </span>
              <span className={`px-2 py-1 rounded-full ${getStatusColor(quiz.status)}`}>
                {quiz.status}
              </span>
              <span className="text-gray-500">
                {quiz.estimatedTime} min • {questions.length} questions
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => window.open(`/quizzes/${quiz.id}/edit`, '_blank')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Edit Quiz
            </button>
            {quiz.status === 'DRAFT' && (
              <button
                type="button"
                onClick={handlePublishQuiz}
                disabled={isPublishing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isPublishing ? 'Publishing...' : 'Publish Quiz'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Generated Questions</h4>
          <button
            type="button"
            onClick={loadQuestions}
            disabled={isLoadingQuestions}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {isLoadingQuestions ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {isLoadingQuestions ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No questions found for this quiz</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(question.difficulty)}`}>
                        {getQuestionTypeLabel(question.type)}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {question.difficulty}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuestion(selectedQuestion === question.id ? null : question.id);
                      setShowQuestionDetails(!showQuestionDetails);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedQuestion === question.id ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
                
                <div className="mb-3">
                  <p className="text-gray-900 font-medium">{question.questionText}</p>
                </div>

                {selectedQuestion === question.id && showQuestionDetails && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    {renderQuestionContent(question)}
                    {question.hint && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium text-gray-700">Hint:</p>
                        <p className="text-sm text-gray-600">{question.hint}</p>
                      </div>
                    )}
                    {question.explanation && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium text-gray-700">Explanation:</p>
                        <p className="text-sm text-gray-600">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-6 border-t">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
        </div>
      )}

      {/* Action Footer */}
      <div className="p-6 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Generated on {new Date(quiz.createdAt).toLocaleDateString()}
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => window.open(`/quizzes/${quiz.id}`, '_blank')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View Quiz
            </button>
            <button
              type="button"
              onClick={handleDeleteQuiz}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedQuizPreview; 