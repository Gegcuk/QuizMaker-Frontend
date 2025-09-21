// src/pages/QuizResultPage.tsx
// ---------------------------------------------------------------------------
// Displays the outcome of a completed quiz attempt with detailed question information.
// Route: /quizzes/:quizId/results?attemptId=<uuid>   (wrapped by ProtectedRoute)
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import {
  useParams,
  useSearchParams,
  Link,
  useNavigate,
} from 'react-router-dom';
import { AttemptService } from '../features/attempt';
import { QuestionService } from '../api/question.service';
import { Spinner } from '../components/ui';
import type { AttemptResultDto, AnswerSubmissionDto } from '../features/attempt';
import type { QuestionDto } from '../types/question.types';
import api from '../api/axiosInstance';

interface EnhancedAnswerResult {
  answer: AnswerSubmissionDto;
  question: QuestionDto;
}

const QuizResultPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const attemptService = new AttemptService(api);
  const questionService = new QuestionService(api);

  const attemptId = searchParams.get('attemptId');
  const backUrl = quizId ? `/quizzes/${quizId}` : '/quizzes';

  const [results, setResults] = useState<AttemptResultDto | null>(null);
  const [enhancedAnswers, setEnhancedAnswers] = useState<EnhancedAnswerResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /*  Fetch attempt results and question details                        */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!attemptId) return;

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        // First, get the attempt results
        const attemptData = await attemptService.getAttemptDetails(attemptId);
        
        // Convert to AttemptResultDto format if needed
        const resultData: AttemptResultDto = {
          attemptId: attemptData.attemptId,
          quizId: attemptData.quizId,
          userId: attemptData.userId,
          startedAt: attemptData.startedAt,
          completedAt: attemptData.completedAt || new Date().toISOString(),
          totalScore: 0, // Will calculate from answers
          correctCount: 0, // Will calculate from answers
          totalQuestions: attemptData.answers.length,
          answers: attemptData.answers
        };

        // Calculate totals
        resultData.totalScore = attemptData.answers.reduce((sum, answer) => sum + answer.score, 0);
        resultData.correctCount = attemptData.answers.filter(answer => answer.isCorrect).length;
        
        setResults(resultData);

        // Then, fetch question details for each answer
        const questionPromises = attemptData.answers.map(async (answer) => {
          try {
            const question = await questionService.getQuestionById(answer.questionId);
            return { answer, question };
          } catch (error) {
            console.error(`Failed to fetch question ${answer.questionId}:`, error);
                         // Return a placeholder question if we can't fetch it
             return {
               answer,
               question: {
                 id: answer.questionId,
                 type: 'MCQ_SINGLE',
                 difficulty: 'MEDIUM',
                 questionText: `Question ${answer.questionId} (Unable to load)`,
                 content: { options: [] },
                 explanation: 'Question details could not be loaded.',
                 attachmentUrl: null,
                 quizIds: [resultData.quizId],
                 tagIds: [],
                 createdAt: '',
                 updatedAt: ''
               } as unknown as QuestionDto
             };
          }
        });

        const enhancedAnswersData = await Promise.all(questionPromises);
        setEnhancedAnswers(enhancedAnswersData);

      } catch (e: any) {
        setError(
          e?.response?.data?.error || 'Failed to fetch results. Please retry.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [attemptId]);

  /* ------------------------------------------------------------------ */
  /*  Helper functions                                                  */
  /* ------------------------------------------------------------------ */
  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-100 border-green-300';
    if (percentage >= 60) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  const formatCorrectAnswer = (question: QuestionDto) => {
    // Extract correct answer from question content based on type
    switch (question.type) {
      case 'MCQ_SINGLE':
        const mcqSingleContent = question.content as any;
        return mcqSingleContent.options?.filter((opt: any) => opt.correct)?.map((opt: any) => opt.text)?.join(', ') || 'N/A';
      
      case 'MCQ_MULTI':
        const mcqMultiContent = question.content as any;
        return mcqMultiContent.options?.filter((opt: any) => opt.correct)?.map((opt: any) => opt.text)?.join(', ') || 'N/A';
      
      case 'TRUE_FALSE':
        const trueFalseContent = question.content as any;
        return trueFalseContent.answer ? 'True' : 'False';
      
      case 'OPEN':
        const openContent = question.content as any;
        return openContent.answer || 'N/A';
      
      case 'FILL_GAP':
        const fillGapContent = question.content as any;
        if (fillGapContent.text && fillGapContent.gaps) {
          // Replace ___ with the correct answers
          let resultText = fillGapContent.text;
          fillGapContent.gaps.forEach((gap: any) => {
            resultText = resultText.replace(/_{3,}/g, `**${gap.answer}**`);
          });
          return resultText;
        }
        return fillGapContent.gaps?.map((gap: any) => gap.answer)?.join(', ') || 'N/A';
      
      case 'ORDERING':
        const orderingContent = question.content as any;
        return orderingContent.items?.map((item: any) => item.text)?.join(' → ') || 'N/A';
      
      case 'COMPLIANCE':
        const complianceContent = question.content as any;
        return complianceContent.statements?.filter((stmt: any) => stmt.compliant)?.map((stmt: any) => stmt.text)?.join(', ') || 'N/A';
      
      case 'HOTSPOT':
        return 'Click on the correct area of the image';
      
      default:
        return 'N/A';
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Early exits                                                       */
  /* ------------------------------------------------------------------ */
  if (!attemptId) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <p className="text-red-600">No attempt ID provided.</p>
        <Link to={backUrl} className="text-indigo-600 hover:underline mt-4">
          ← Back to Quizzes
        </Link>
      </div>
    );
  }

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => navigate(0)}
          className="mt-4 text-indigo-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <p>No results found.</p>
        <Link to={backUrl} className="text-indigo-600 hover:underline mt-4">
          ← Back to Quizzes
        </Link>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render results                                                    */
  /* ------------------------------------------------------------------ */
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Results</h1>
        <p className="text-gray-600">
          Attempt completed on {new Date(results.completedAt).toLocaleDateString()} at {new Date(results.completedAt).toLocaleTimeString()}
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{results.totalScore}</div>
            <div className="text-sm text-gray-600">Total Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{results.correctCount}/{results.totalQuestions}</div>
            <div className="text-sm text-gray-600">Correct Answers</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(results.totalScore, results.totalQuestions)}`}>
              {Math.round((results.correctCount / results.totalQuestions) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round((results.totalScore / results.totalQuestions) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Score Percentage</div>
          </div>
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Question Breakdown</h2>
        
        {enhancedAnswers.map((item, index) => (
          <div 
            key={item.answer.answerId} 
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              item.answer.isCorrect ? 'border-l-green-500' : 'border-l-red-500'
            }`}
          >
            {/* Question Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    Question {index + 1}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.answer.isCorrect 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.answer.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {item.question.type.replace('_', ' ')}
                  </span>
                </div>
                                 <h3 className="text-lg font-medium text-gray-900">
                   {item.question.type === 'FILL_GAP' ? (
                     <div>
                       <div className="mb-2 text-gray-600">Complete the sentence:</div>
                       <div 
                         className="text-gray-900"
                         dangerouslySetInnerHTML={{
                           __html: (item.question.content as any)?.text?.replace(/_{3,}/g, '<span class="bg-gray-200 px-2 py-1 rounded text-gray-600">___</span>') || item.question.questionText
                         }}
                       />
                     </div>
                   ) : (
                     item.question.questionText
                   )}
                 </h3>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${getScoreColor(item.answer.score, 1)}`}>
                  {item.answer.score} pt{item.answer.score !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

                         {/* Answer Details */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Result Status */}
               <div>
                 <h4 className="font-medium text-gray-900 mb-2">Result:</h4>
                 <div className={`p-3 rounded-md border ${
                   item.answer.isCorrect 
                     ? 'bg-green-50 border-green-200' 
                     : 'bg-red-50 border-red-200'
                 }`}>
                   <p className="text-sm font-medium">
                     {item.answer.isCorrect ? 'Correct' : 'Incorrect'}
                   </p>
                   <p className="text-xs text-gray-600 mt-1">
                     Score: {item.answer.score} point{item.answer.score !== 1 ? 's' : ''}
                   </p>
                 </div>
               </div>

               {/* Correct Answer */}
               <div>
                 <h4 className="font-medium text-gray-900 mb-2">Correct Answer:</h4>
                 <div className="p-3 rounded-md border bg-green-50 border-green-200">
                   {item.question.type === 'FILL_GAP' ? (
                     <div className="text-sm">
                       <div className="mb-2 text-gray-600">Complete the sentence:</div>
                       <div 
                         className="text-gray-900"
                         dangerouslySetInnerHTML={{
                           __html: formatCorrectAnswer(item.question)
                             .replace(/\*\*(.*?)\*\*/g, '<span class="bg-green-200 px-1 rounded font-medium">$1</span>')
                         }}
                       />
                     </div>
                   ) : (
                     <p className="text-sm">
                       {formatCorrectAnswer(item.question)}
                     </p>
                   )}
                 </div>
               </div>
             </div>

            {/* Explanation */}
            {item.question.explanation && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Explanation:</h4>
                <div className="p-3 rounded-md border bg-blue-50 border-blue-200">
                  <p className="text-sm text-gray-700">
                    {item.question.explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Timing Info */}
            <div className="mt-4 text-xs text-gray-500">
              Answered at: {new Date(item.answer.answeredAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Link
          to={backUrl}
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          ← Back to Quizzes
        </Link>
        {quizId && (
          <Link
            to={`/quizzes/${quizId}`}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View Quiz Details
          </Link>
        )}
      </div>
    </div>
  );
};

export default QuizResultPage;
