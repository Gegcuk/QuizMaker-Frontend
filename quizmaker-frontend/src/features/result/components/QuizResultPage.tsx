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
import { AttemptService, QuestionService, ResultService } from '@/services';
import { Spinner } from '@/components';
import type { AttemptResultDto, AnswerSubmissionDto, QuestionDto } from '@/types';
import { api } from '@/services';

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
        resultData.totalScore = attemptData.answers.reduce((sum, answer) => sum + (answer.score ?? 0), 0);
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
    if (percentage >= 80) return 'text-theme-interactive-success';
    if (percentage >= 60) return 'text-theme-text-warning';
    return 'text-theme-text-danger';
  };

  const getScoreBackground = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-theme-bg-success border-theme-border-success';
    if (percentage >= 60) return 'bg-theme-bg-warning border-theme-border-warning';
    return 'bg-theme-bg-danger border-theme-border-danger';
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
          // Replace ___ with the correct answers in order
          let resultText = fillGapContent.text;
          let gapIndex = 0;
          
          // Find all gaps marked with ___ and replace them with the corresponding gap answers
          const gapRegex = /_{3,}/g;
          let match;
          
          while ((match = gapRegex.exec(resultText)) !== null && gapIndex < fillGapContent.gaps.length) {
            const gap = fillGapContent.gaps[gapIndex];
            const beforeGap = resultText.substring(0, match.index);
            const afterGap = resultText.substring(match.index + match[0].length);
            resultText = beforeGap + `**${gap.answer}**` + afterGap;
            gapIndex++;
            
            // Reset regex lastIndex since we modified the string
            gapRegex.lastIndex = match.index + `**${gap.answer}**`.length;
          }
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
      
      case 'MATCHING':
        const matchingContent = question.content as any;
        if (matchingContent.left && matchingContent.right) {
          const matches = matchingContent.left.map((leftItem: any) => {
            const rightItem = matchingContent.right.find((right: any) => right.id === leftItem.matchId);
            return `${leftItem.text} → ${rightItem?.text || 'N/A'}`;
          });
          return matches.join(', ');
        }
        return 'N/A';
      
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
        <p className="text-theme-text-danger">No attempt ID provided.</p>
        <Link to={backUrl} className="text-theme-interactive-primary hover:underline mt-4">
          ← Back to Quizzes
        </Link>
      </div>
    );
  }

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <p className="text-theme-text-danger">{error}</p>
        <button
          onClick={() => navigate(0)}
          className="mt-4 text-theme-interactive-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <p className="text-theme-text-primary">No results found.</p>
        <Link to={backUrl} className="text-theme-interactive-primary hover:underline mt-4">
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
        <h1 className="text-3xl font-bold text-theme-text-primary mb-2">Quiz Results</h1>
        <p className="text-theme-text-secondary">
          Attempt completed on {new Date(results.completedAt).toLocaleDateString()} at {new Date(results.completedAt).toLocaleTimeString()}
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-theme-bg-primary rounded-lg shadow-theme p-6 mb-8 border border-theme-border-primary">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-text-primary">{results.totalScore}</div>
            <div className="text-sm text-theme-text-secondary">Total Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-text-primary">{results.correctCount}/{results.totalQuestions}</div>
            <div className="text-sm text-theme-text-secondary">Correct Answers</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(results.totalScore, results.totalQuestions)}`}>
              {Math.round((results.correctCount / results.totalQuestions) * 100)}%
            </div>
            <div className="text-sm text-theme-text-secondary">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-text-primary">
              {Math.round((results.totalScore / results.totalQuestions) * 100)}%
            </div>
            <div className="text-sm text-theme-text-secondary">Score Percentage</div>
          </div>
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-theme-text-primary">Question Breakdown</h2>
        
        {enhancedAnswers.map((item, index) => (
          <div 
            key={item.answer.answerId} 
            className={`bg-theme-bg-primary rounded-lg shadow-theme p-6 border-l-4 border border-theme-border-primary ${
              item.answer.isCorrect ? 'border-l-theme-interactive-success' : 'border-l-theme-interactive-danger'
            }`}
          >
            {/* Question Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-theme-bg-tertiary text-theme-text-secondary px-3 py-1 rounded-full text-sm font-medium">
                    Question {index + 1}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.answer.isCorrect 
                      ? 'bg-theme-bg-success text-theme-text-success' 
                      : 'bg-theme-bg-danger text-theme-text-danger'
                  }`}>
                    {item.answer.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                  <span className="text-sm text-theme-text-tertiary">
                    {item.question.type.replace('_', ' ')}
                  </span>
                </div>
                                 <h3 className="text-lg font-medium text-theme-text-primary">
                   {item.question.type === 'FILL_GAP' ? (
                     <div>
                       <div className="mb-2 text-theme-text-secondary">Complete the sentence:</div>
                       <div 
                         className="text-theme-text-primary"
                         dangerouslySetInnerHTML={{
                           __html: (item.question.content as any)?.text?.replace(/_{3,}/g, '<span class="bg-theme-bg-tertiary px-2 py-1 rounded text-theme-text-secondary">___</span>') || item.question.questionText
                         }}
                       />
                     </div>
                   ) : (
                     item.question.questionText
                   )}
                 </h3>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${getScoreColor(item.answer.score ?? 0, 1)}`}>
                  {item.answer.score ?? 0} pt{(item.answer.score ?? 0) !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

                         {/* Answer Details */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Result Status */}
               <div>
                 <h4 className="font-medium text-theme-text-primary mb-2">Result:</h4>
                 <div className="flex items-center space-x-3">
                   <span className={`px-2 py-1 rounded text-sm font-medium ${
                     item.answer.isCorrect 
                       ? 'bg-theme-bg-success text-theme-text-success border border-theme-border-success' 
                       : 'bg-theme-bg-danger text-theme-text-danger border border-theme-border-danger'
                   }`}>
                     {item.answer.isCorrect ? 'Correct' : 'Incorrect'}
                   </span>
                   <span className="text-xs text-theme-text-tertiary">
                     {item.answer.score} point{item.answer.score !== 1 ? 's' : ''}
                   </span>
                 </div>
               </div>

               {/* Correct Answer */}
               <div>
                 <h4 className="font-medium text-theme-text-primary mb-2">Correct Answer:</h4>
                 <div className="p-3 rounded-md border bg-theme-bg-tertiary border-theme-border-primary">
                   {item.question.type === 'FILL_GAP' ? (
                     <div className="text-sm">
                       <div className="mb-2 text-theme-text-secondary">Complete the sentence:</div>
                       <div 
                         className="text-theme-text-primary"
                         dangerouslySetInnerHTML={{
                           __html: formatCorrectAnswer(item.question)
                             .replace(/\*\*(.*?)\*\*/g, '<span class="bg-theme-bg-success px-1 rounded font-medium">$1</span>')
                         }}
                       />
                     </div>
                   ) : (
                     <p className="text-sm text-theme-text-primary">
                       {formatCorrectAnswer(item.question)}
                     </p>
                   )}
                 </div>
               </div>
             </div>

            {/* Explanation */}
            {item.question.explanation && (
              <div className="mt-4">
                <h4 className="font-medium text-theme-text-primary mb-2">Explanation:</h4>
                <div className="p-3 rounded-md border bg-theme-bg-secondary border-theme-border-primary">
                  <p className="text-sm text-theme-text-secondary">
                    {item.question.explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Timing Info */}
            <div className="mt-4 text-xs text-theme-text-tertiary">
              Answered at: {new Date(item.answer.answeredAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Link
          to={backUrl}
          className="inline-flex items-center justify-center px-6 py-3 border border-theme-border-primary shadow-sm text-base font-medium rounded-md text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary"
        >
          ← Back to Quizzes
        </Link>
        {quizId && (
          <Link
            to={`/quizzes/${quizId}`}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-theme-text-inverse bg-theme-interactive-primary hover:bg-theme-interactive-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary"
          >
            View Quiz Details
          </Link>
        )}
      </div>
    </div>
  );
};

export default QuizResultPage;
