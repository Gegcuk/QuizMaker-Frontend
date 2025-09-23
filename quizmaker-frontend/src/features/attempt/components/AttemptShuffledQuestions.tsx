// src/components/attempt/AttemptShuffledQuestions.tsx
// ---------------------------------------------------------------------------
// Component for displaying shuffled questions in quiz attempts
// Handles question ordering, navigation, and answer tracking
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { AttemptService } from '@/services';
import { QuestionForAttemptDto } from '@/types';
import { getQuestionTypeIcon } from '@/utils/questionUtils';
import { api } from '@/services';
import { HintDisplay } from './';

interface AttemptShuffledQuestionsProps {
  quizId: string;
  attemptId: string;
  onQuestionsLoaded: (questions: QuestionForAttemptDto[]) => void;
  onQuestionChange: (questionIndex: number) => void;
  currentQuestionIndex: number;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  className?: string;
}

const AttemptShuffledQuestions: React.FC<AttemptShuffledQuestionsProps> = ({
  quizId,
  attemptId,
  onQuestionsLoaded,
  onQuestionChange,
  currentQuestionIndex,
  answers,
  onAnswerChange,
  className = ''
}) => {
  const [questions, setQuestions] = useState<QuestionForAttemptDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionOrder, setQuestionOrder] = useState<number[]>([]);

  const attemptService = new AttemptService(api);

  useEffect(() => {
    loadShuffledQuestions();
  }, [quizId]);

  const loadShuffledQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const shuffledQuestions = await attemptService.getShuffledQuestions(quizId);
      setQuestions(shuffledQuestions);
      
      // Create question order array (0-based indices)
      const order = Array.from({ length: shuffledQuestions.length }, (_, i) => i);
      setQuestionOrder(order);
      
      onQuestionsLoaded(shuffledQuestions);
    } catch (err: any) {
      setError(err.message || 'Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getQuestionStatus = (questionIndex: number): 'answered' | 'current' | 'unanswered' => {
    const question = questions[questionIndex];
    if (!question) return 'unanswered';
    
    if (questionIndex === currentQuestionIndex) return 'current';
    if (answers[question.id]) return 'answered';
    return 'unanswered';
  };

  const getQuestionButtonClass = (questionIndex: number): string => {
    const status = getQuestionStatus(questionIndex);
    const baseClass = 'w-10 h-10 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (status) {
      case 'answered':
        return `${baseClass} bg-green-500 text-white hover:bg-green-600 focus:ring-green-500`;
      case 'current':
        return `${baseClass} bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-indigo-500`;
      case 'unanswered':
        return `${baseClass} bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500`;
    }
  };

  const handleQuestionClick = (questionIndex: number) => {
    onQuestionChange(questionIndex);
  };


  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'EASY':
        return 'text-green-600 bg-green-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'HARD':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-4">❌</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadShuffledQuestions}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <p className="text-gray-600">No questions available for this quiz.</p>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
          <p className="text-sm text-gray-600">
            {answeredCount} of {totalQuestions} answered
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Questions are shuffled
        </div>
      </div>

      {/* Question Navigation Grid */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {questionOrder.map((questionIndex) => {
          const question = questions[questionIndex];
          if (!question) return null;

          return (
            <button
              key={questionIndex}
              onClick={() => handleQuestionClick(questionIndex)}
              className={getQuestionButtonClass(questionIndex)}
              title={`Question ${questionIndex + 1}: ${question.questionText.substring(0, 50)}...`}
            >
              {questionIndex + 1}
            </button>
          );
        })}
      </div>

      {/* Current Question Info */}
      {questions[currentQuestionIndex] && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {getQuestionTypeIcon(questions[currentQuestionIndex].type)}
              </span>
              <span className="text-sm font-medium text-gray-900">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(questions[currentQuestionIndex].difficulty)}`}>
              {questions[currentQuestionIndex].difficulty}
            </span>
          </div>

          <div className="text-sm text-gray-700 mb-2">
            {questions[currentQuestionIndex].questionText}
          </div>

          {questions[currentQuestionIndex].hint && (
            <HintDisplay hint={questions[currentQuestionIndex].hint} />
          )}
        </div>
      )}

      {/* Progress Summary */}
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Progress: {Math.round((answeredCount / totalQuestions) * 100)}%</span>
          <span>Remaining: {totalQuestions - answeredCount}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
          <div
            className="bg-green-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-200 rounded-full" />
            <span>Unanswered</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-indigo-500 rounded-full" />
            <span>Current</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span>Answered</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttemptShuffledQuestions; 
