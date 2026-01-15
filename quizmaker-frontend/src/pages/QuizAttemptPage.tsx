// src/pages/QuizAttemptPage.tsx
// ---------------------------------------------------------------------------
// Quiz attempt page - handles different attempt modes and paused attempts
// Supports ONE_BY_ONE, ALL_AT_ONCE, and TIMED modes
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { AttemptService } from '@/services';
import { QuizService, api } from "@/services";
import { AnswerSubmissionRequest, AttemptMode, AttemptStatus } from '@/types';
import { QuizDto } from "@/types";
import { Spinner, Button } from "@/components";
import { 
  McqAnswer, 
  TrueFalseAnswer, 
  OpenAnswer, 
  FillGapAnswer, 
  ComplianceAnswer, 
  OrderingAnswer, 
  HotspotAnswer,
  MatchingAnswer,
  AttemptPause,
  AttemptBatchAnswers,
  AttemptTimer,
  HintDisplay
} from '@/features/attempt';
import { Seo } from '@/features/seo';
import SafeContent from '@/components/common/SafeContent';

// Shape of user answer input; varies by question type
type AnswerInput = any;

const QuizAttemptPage: React.FC = () => {
  console.log('QuizAttemptPage: Component rendering...');
  
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const attemptService = new AttemptService(api);
  const quizService = new QuizService(api);
  
  // State for attempt management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptMode, setAttemptMode] = useState<AttemptMode>('ONE_BY_ONE');
  const [attemptStatus, setAttemptStatus] = useState<AttemptStatus>('IN_PROGRESS');
  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  
  // State for questions and answers
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [existingAnswers, setExistingAnswers] = useState<Record<string, any>>({});
  const [answerInput, setAnswerInput] = useState<AnswerInput>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Progress tracking state
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(1);
  
  // Answer result state (for showing result after submission)
  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean;
    correctAnswer?: any;
    userAnswer: any;
    score: number | null;
    explanation?: string | null;
    nextQuestion?: any | null;
  } | null>(null);

  // Check for existing attempts
  const checkExistingAttempts = async (): Promise<string | null> => {
    if (!quizId) return null;
    
    try {
      const response = await attemptService.getAttempts({ quizId });
      const existingAttempt = response.content.find(
        attempt => attempt.status === 'PAUSED' || attempt.status === 'IN_PROGRESS'
      );
      return existingAttempt ? existingAttempt.attemptId : null;
    } catch (error) {
      console.warn('Could not check for existing attempts:', error);
      return null;
    }
  };

  // Load quiz details
  const loadQuizDetails = async () => {
    if (!quizId) return;
    
    try {
      const quizData = await quizService.getQuizById(quizId);
      setQuiz(quizData);
    } catch (error) {
      console.warn('Could not load quiz details:', error);
    }
  };

  // Initialize attempt
  const initializeAttempt = async () => {
    if (!quizId) return;

    try {
      // First check if attemptId is provided in URL parameters (from resume flow)
      const attemptIdFromUrl = searchParams.get('attemptId');
      
      console.log('QuizAttemptPage: Initializing attempt...');
      console.log('QuizAttemptPage: quizId:', quizId);
      console.log('QuizAttemptPage: attemptIdFromUrl:', attemptIdFromUrl);
      console.log('QuizAttemptPage: all search params:', Object.fromEntries(searchParams.entries()));
      
      if (attemptIdFromUrl) {
        console.log(`Resuming attempt from URL: ${attemptIdFromUrl}`);
        console.log('About to call getCurrentQuestion API...');
        
        try {
          // Get current question for the attempt
          console.log('Calling attemptService.getCurrentQuestion...');
          const currentQuestionData = await attemptService.getCurrentQuestion(attemptIdFromUrl);
          console.log('getCurrentQuestion response:', currentQuestionData);
          
          console.log('Calling attemptService.getAttemptDetails...');
          const attemptDetails = await attemptService.getAttemptDetails(attemptIdFromUrl);
          console.log('getAttemptDetails response:', attemptDetails);
          
          setAttemptId(attemptIdFromUrl);
          setAttemptMode(attemptDetails.mode);
          setAttemptStatus(attemptDetails.status);
          
          // Load existing answers
          const existingAnswers: Record<string, any> = {};
          // Note: API response doesn't include the original response data, only answer metadata
          // attemptDetails.answers.forEach(answer => {
          //   existingAnswers[answer.questionId] = answer.response;
          // });
          setAnswers(existingAnswers);
          setExistingAnswers(existingAnswers);
          
          // Set current question and progress
          if (attemptDetails.mode === 'ONE_BY_ONE' || attemptDetails.mode === 'TIMED') {
            setCurrentQuestion(currentQuestionData.question);
            setCurrentQuestionNumber(currentQuestionData.questionNumber);
            setTotalQuestions(currentQuestionData.totalQuestions);
          } else {
            // For ALL_AT_ONCE mode, load all questions
            const shuffledQuestions = await attemptService.getShuffledQuestions(quizId);
            setAllQuestions(shuffledQuestions);
            setTotalQuestions(shuffledQuestions.length);
          }
          
          setQuestionsAnswered(attemptDetails.answers.length);
          console.log(`Successfully resumed attempt. Current question: ${currentQuestionData.questionNumber}/${currentQuestionData.totalQuestions}`);
        } catch (error) {
          console.error('Failed to resume attempt from URL:', error);
          // Fall back to normal flow
          await initializeAttemptNormal();
        }
      } else {
        console.log('No attemptId in URL, using normal flow...');
        // Normal flow - check for existing attempts or start new one
        await initializeAttemptNormal();
      }
    } catch (error) {
      setError("Failed to initialize quiz attempt.");
    } finally {
      setLoading(false);
    }
  };

  // Normal attempt initialization (existing logic)
  const initializeAttemptNormal = async () => {
    if (!quizId) return;

    try {
      // Check for existing attempts first
      const existingAttemptId = await checkExistingAttempts();
      
      if (existingAttemptId) {
        // Resume existing attempt
        const attemptDetails = await attemptService.getAttemptDetails(existingAttemptId);
        setAttemptId(existingAttemptId);
        setAttemptMode(attemptDetails.mode);
        setAttemptStatus(attemptDetails.status);
        
        // Load existing answers
        const existingAnswers: Record<string, any> = {};
        // Note: API response doesn't include the original response data, only answer metadata
        // attemptDetails.answers.forEach(answer => {
        //   // Convert answer back to input format based on question type
        //   // This is a simplified conversion - you might need more complex logic
        //   existingAnswers[answer.questionId] = answer.response;
        // });
        setAnswers(existingAnswers);
        setExistingAnswers(existingAnswers); // Track what was originally loaded
        
        // For ONE_BY_ONE and TIMED modes, get the next question
        if (attemptDetails.mode === 'ONE_BY_ONE' || attemptDetails.mode === 'TIMED') {
          // Get current question for the attempt
          const currentQuestionData = await attemptService.getCurrentQuestion(existingAttemptId);
          setCurrentQuestion(currentQuestionData.question);
          setCurrentQuestionNumber(currentQuestionData.questionNumber);
          setTotalQuestions(currentQuestionData.totalQuestions);
        } else {
          // For ALL_AT_ONCE mode, load all questions
          const shuffledQuestions = await attemptService.getShuffledQuestions(quizId);
          setAllQuestions(shuffledQuestions);
          setTotalQuestions(shuffledQuestions.length);
        }
        
        setQuestionsAnswered(attemptDetails.answers.length);
      } else {
        // Start new attempt
        const mode = searchParams.get('mode') as AttemptMode || 'ONE_BY_ONE';
        const attempt = await attemptService.startAttempt(quizId, { mode });
        setAttemptId(attempt.attemptId);
        setAttemptMode(mode);
        setAttemptStatus('IN_PROGRESS');
        
        if (mode === 'ONE_BY_ONE' || mode === 'TIMED') {
          // Get current question after starting attempt
          const currentQuestionData = await attemptService.getCurrentQuestion(attempt.attemptId);
          setCurrentQuestion(currentQuestionData.question);
          setCurrentQuestionNumber(currentQuestionData.questionNumber);
          setTotalQuestions(currentQuestionData.totalQuestions);
        } else {
          // For ALL_AT_ONCE mode, load all questions
          const shuffledQuestions = await attemptService.getShuffledQuestions(quizId);
          setAllQuestions(shuffledQuestions);
          setTotalQuestions(shuffledQuestions.length);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const isAnswerProvided = () => {
    if (!currentQuestion) return false;

    switch (currentQuestion.type) {
      case "MCQ_SINGLE":
        return Boolean(answerInput);
      case "MCQ_MULTI":
        return Array.isArray(answerInput) && answerInput.length > 0;
      case "TRUE_FALSE":
        return answerInput !== null && answerInput !== undefined;
      case "OPEN":
        return typeof answerInput === "string" && answerInput.trim().length > 0;
      case "COMPLIANCE":
        return Array.isArray(answerInput) && answerInput.length > 0;
      case "FILL_GAP": {
        // Check that ALL gaps are filled
        const totalGaps = currentQuestion?.safeContent?.gaps?.length || 0;
        if (totalGaps === 0) return false;
        
        const filledGaps = Object.values(answerInput || {}).filter(
          (answer) => typeof answer === 'string' && answer.trim().length > 0
        ).length;
        
        return filledGaps === totalGaps;
      }
      case "HOTSPOT":
        return Boolean(answerInput);
      case "ORDERING":
        return Array.isArray(answerInput) && answerInput.length > 0;
      default:
        return Object.keys(answerInput || {}).length > 0;
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Progress tracking functions                                          */
  /* -------------------------------------------------------------------- */
  const fetchAttemptStats = async () => {
    if (!attemptId) return;
    
    try {
      const stats = await attemptService.getAttemptStats(attemptId);
      setQuestionsAnswered(stats.questionsAnswered);
      
      if (attemptMode === 'ONE_BY_ONE') {
        setCurrentQuestionNumber(stats.questionsAnswered + 1);
      }
    } catch (error) {
      console.warn("Could not fetch attempt stats:", error);
    }
  };

  const updateProgress = () => {
    setQuestionsAnswered(prev => prev + 1);
    if (attemptMode === 'ONE_BY_ONE') {
      setCurrentQuestionNumber(prev => prev + 1);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Submit current answer (ONE_BY_ONE mode)                             */
  /* -------------------------------------------------------------------- */
  const handleSubmitAnswer = async () => {
    if (!attemptId || !currentQuestion) return;

    setSubmitting(true);
    setError(null);

    const buildResponse = () => {
      switch (currentQuestion.type) {
        case "MCQ_SINGLE":
          return { selectedOptionId: answerInput };
        case "MCQ_MULTI":
          return { selectedOptionIds: answerInput ?? [] };
        case "TRUE_FALSE":
          return { answer: Boolean(answerInput) };
        case "OPEN":
          return { answer: answerInput };
        case "COMPLIANCE":
          return { selectedStatementIds: answerInput ?? [] };
        case "FILL_GAP":
          return {
            answers: Object.entries(answerInput || {}).map(([id, ans]) => ({
              gapId: Number(id),
              answer: String(ans).trim(),
            })),
          };
        case "HOTSPOT":
          return { regionId: answerInput };
        case "ORDERING":
          return { orderedItemIds: answerInput ?? [] };
        case "MATCHING":
          return answerInput ?? { matches: [] };
        default:
          return { answer: answerInput };
      }
    };

    const payload: AnswerSubmissionRequest = {
      questionId: currentQuestion.id,
      response: buildResponse(),
      includeCorrectness: true,  // Always include correctness to show result
      includeCorrectAnswer: true, // Always include correct answer to show if incorrect
      includeExplanation: true,   // Always include explanation to display after submission
    };

    try {
      const data = await attemptService.submitAnswer(attemptId, payload);
      
      // Update answers for ALL_AT_ONCE mode
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: buildResponse()
      }));

      // Store the result to display to the user
      if (data.isCorrect !== undefined) {
        setAnswerResult({
          isCorrect: data.isCorrect,
          correctAnswer: data.correctAnswer,
          userAnswer: buildResponse(),
          score: data.score,
          explanation: data.explanation || null,
          nextQuestion: data.nextQuestion,
        });
      } else if (!data.nextQuestion) {
        // If no result but also no next question, we need to complete the attempt
        await attemptService.completeAttempt(attemptId);
        navigate(`/quizzes/${quizId}/results?attemptId=${attemptId}`);
      }

      // Don't proceed to next question automatically - wait for user to click "Next Question"
    } catch (e: any) {
      console.error('Submission error:', e.response);
      const backendMessage = e?.response?.data?.details?.[0] || e?.response?.data?.error;
      setError(backendMessage || 'Failed to submit answer. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Handle proceeding to next question after viewing result             */
  /* -------------------------------------------------------------------- */
  const handleNextQuestion = async () => {
    if (!attemptId || !answerResult) return;

    // Check if there's a next question from the stored result
    if (answerResult.nextQuestion) {
      // Move to next question
      setCurrentQuestion(answerResult.nextQuestion);
      setAnswerInput(null);
      setAnswerResult(null); // Clear result
      updateProgress();
    } else {
      // No more questions - complete attempt
      try {
        await attemptService.completeAttempt(attemptId);
        navigate(`/quizzes/${quizId}/results?attemptId=${attemptId}`);
      } catch (e: any) {
        console.error('Error completing attempt:', e);
        setError('Failed to complete attempt. Please try again.');
      }
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Submit all answers (ALL_AT_ONCE mode)                               */
  /* -------------------------------------------------------------------- */
  const handleSubmitAllAnswers = async (results: any[]) => {
    try {
      await attemptService.completeAttempt(attemptId!);
      navigate(`/quizzes/${quizId}/results?attemptId=${attemptId}`);
    } catch (error) {
      setError('Failed to complete attempt. Please try again.');
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Handle answer changes (ALL_AT_ONCE mode)                            */
  /* -------------------------------------------------------------------- */
  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  /* -------------------------------------------------------------------- */
  /*  Handle pause/resume                                                  */
  /* -------------------------------------------------------------------- */
  const handleStatusChange = (status: AttemptStatus) => {
    setAttemptStatus(status);
  };

  const handlePause = () => {
    // Could show a message or redirect
    console.log('Attempt paused');
  };

  const handleResume = () => {
    // Refresh attempt data
    fetchAttemptStats();
  };

  /* -------------------------------------------------------------------- */
  /*  Effects                                                              */
  /* -------------------------------------------------------------------- */
  
  // Debug effect to see when component mounts and searchParams change
  useEffect(() => {
    console.log('QuizAttemptPage: Component mounted or searchParams changed');
    console.log('QuizAttemptPage: Current searchParams:', Object.fromEntries(searchParams.entries()));
    console.log('QuizAttemptPage: Current quizId:', quizId);
  }, [searchParams, quizId]);

  useEffect(() => {
    if (quizId) {
      loadQuizDetails();
      initializeAttempt();
    }
  }, [quizId, searchParams]);

  useEffect(() => {
    if (attemptId) {
      fetchAttemptStats();
    }
  }, [attemptId]);

  // Scroll to top when a new question is loaded
  useEffect(() => {
    if (currentQuestion) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentQuestion]);

  /* -------------------------------------------------------------------- */
  /*  Rendering helpers                                                   */
  /* -------------------------------------------------------------------- */
  
  // Format correct answer for display
  const formatCorrectAnswer = (answer: any, type: string, safeContent: any): React.ReactNode => {
    if (!answer) return <span className="text-theme-text-tertiary italic">N/A</span>;
    
    switch (type) {
      case 'MCQ_SINGLE':
        if (answer.correctOptionId !== undefined && safeContent?.options) {
          const option = safeContent.options.find((opt: any) => opt.id === answer.correctOptionId || String(opt.id) === String(answer.correctOptionId));
          return option?.text || `Option ${answer.correctOptionId}`;
        }
        return <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'MCQ_MULTI':
        if (Array.isArray(answer.correctOptionIds) && answer.correctOptionIds.length > 0 && safeContent?.options) {
          return (
            <ul className="list-disc list-inside space-y-1">
              {answer.correctOptionIds.map((optId: any, idx: number) => {
                const option = safeContent.options.find((opt: any) => opt.id === optId || String(opt.id) === String(optId));
                return <li key={idx}>{option?.text || `Option ${optId}`}</li>;
              })}
            </ul>
          );
        }
        return <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'TRUE_FALSE':
        return answer.answer !== undefined ? (answer.answer ? 'True' : 'False') : <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'OPEN':
        return answer.answer ? (
          <div className="whitespace-pre-wrap">{answer.answer}</div>
        ) : <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'FILL_GAP':
        if (Array.isArray(answer.answers) && answer.answers.length > 0) {
          return (
            <div className="space-y-1">
              {answer.answers.map((gap: any) => (
                <div key={gap.id || gap.gapId} className="text-sm">
                  Gap {gap.id || gap.gapId}: <span className="font-medium">{gap.text || gap.answer}</span>
                </div>
              ))}
            </div>
          );
        }
        return <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'ORDERING':
        if (Array.isArray(answer.order) && answer.order.length > 0 && safeContent?.items) {
          return (
            <div className="flex items-center gap-2 flex-wrap">
              {answer.order.map((itemId: number, idx: number) => {
                const item = safeContent.items.find((i: any) => i.id === itemId);
                return (
                  <React.Fragment key={itemId}>
                    <span className="px-2 py-1 bg-theme-bg-tertiary rounded text-sm font-medium">
                      {item?.text || `Item ${itemId}`}
                    </span>
                    {idx < answer.order.length - 1 && <span className="text-theme-text-tertiary">→</span>}
                  </React.Fragment>
                );
              })}
            </div>
          );
        }
        return <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'COMPLIANCE':
        if (Array.isArray(answer.compliantIds) && answer.compliantIds.length > 0 && safeContent?.statements) {
          return (
            <ul className="space-y-1">
              {answer.compliantIds.map((stmtId: number) => {
                const statement = safeContent.statements.find((s: any) => s.id === stmtId);
                return (
                  <li key={stmtId} className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs bg-theme-bg-success text-theme-text-primary">
                      Compliant
                    </span>
                    <span className="text-sm">{statement?.text || `Statement ${stmtId}`}</span>
                  </li>
                );
              })}
            </ul>
          );
        }
        return <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'HOTSPOT':
        if (answer.correctRegionId !== undefined && safeContent?.regions) {
          const region = safeContent.regions.find((r: any) => r.id === answer.correctRegionId);
          return region?.label || `Region ${answer.correctRegionId}`;
        }
        if (answer.correctRegionId !== undefined) return `Region ${answer.correctRegionId}`;
        return <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'MATCHING':
        if (Array.isArray(answer.pairs) && answer.pairs.length > 0 && safeContent?.left && safeContent?.right) {
          return (
            <ul className="space-y-1">
              {answer.pairs.map((pair: any, idx: number) => {
                const leftItem = safeContent.left.find((l: any) => l.id === pair.leftId);
                const rightItem = safeContent.right.find((r: any) => r.id === pair.rightId);
                return (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-theme-bg-tertiary rounded">{leftItem?.text || pair.leftId}</span>
                    <span className="text-theme-text-tertiary">→</span>
                    <span className="px-2 py-1 bg-theme-bg-tertiary rounded font-medium">{rightItem?.text || pair.rightId}</span>
                  </li>
                );
              })}
            </ul>
          );
        }
        return <span className="text-theme-text-tertiary">N/A</span>;
      
      default:
        return <span className="text-theme-text-tertiary">Unknown question type</span>;
    }
  };

  const renderQuestion = (question: any, isCurrent: boolean = false) => {
    // For ONE_BY_ONE and TIMED modes, use answerInput; for ALL_AT_ONCE mode, use answers state
    let currentAnswer;
    let onAnswerChange;
    
    if (attemptMode === 'ALL_AT_ONCE') {
      // For ALL_AT_ONCE mode, use answers state
      currentAnswer = answers[question.id];
      if (currentAnswer === null || currentAnswer === undefined) {
        // Set appropriate default based on question type
        switch (question.type) {
          case "MCQ_SINGLE":
          case "MCQ_MULTI":
          case "OPEN":
          case "FILL_GAP":
          case "COMPLIANCE":
          case "HOTSPOT":
            currentAnswer = '';
            break;
          case "TRUE_FALSE":
            currentAnswer = null; // null is valid for boolean questions
            break;
          case "ORDERING":
            currentAnswer = [];
            break;
          default:
            currentAnswer = '';
        }
      }
      onAnswerChange = (answer: any) => handleAnswerChange(question.id, answer);
    } else {
      // For ONE_BY_ONE and TIMED modes, use answerInput
      currentAnswer = answerInput;
      onAnswerChange = (answer: any) => setAnswerInput(answer);
    }
    
    // Disable input if submitted (show feedback mode)
    const isDisabled = submitting || !isCurrent || answerResult !== null;
    
    // Determine if we should show feedback (answer was submitted for this question)
    const showFeedback = answerResult !== null && answerResult.userAnswer !== undefined;

    switch (question.type) {
      case "MCQ_SINGLE":
        return (
          <McqAnswer
            question={question}
            currentAnswer={currentAnswer}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            singleChoice={true}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "MCQ_MULTI":
        return (
          <McqAnswer
            question={question}
            currentAnswer={currentAnswer}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            singleChoice={false}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "TRUE_FALSE":
        return (
          <TrueFalseAnswer
            question={question}
            currentAnswer={currentAnswer}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "OPEN":
        return (
          <OpenAnswer
            question={question}
            currentAnswer={currentAnswer}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "COMPLIANCE":
        return (
          <ComplianceAnswer
            question={question}
            currentAnswer={currentAnswer}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "FILL_GAP":
        return (
          <FillGapAnswer
            question={question}
            currentAnswer={currentAnswer}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "HOTSPOT":
        return (
          <HotspotAnswer
            question={question}
            currentAnswer={currentAnswer}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "ORDERING":
        return (
          <OrderingAnswer
            question={question}
            currentAnswer={currentAnswer}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      case "MATCHING":
        return (
          <MatchingAnswer
            question={question}
            currentAnswer={currentAnswer}
            onAnswerChange={onAnswerChange}
            disabled={isDisabled}
            showFeedback={showFeedback}
            isCorrect={answerResult?.isCorrect}
            correctAnswer={answerResult?.correctAnswer}
          />
        );
      default:
        return <p>Unsupported question type: {question.type}</p>;
    }
  };

  const renderONE_BY_ONE_Mode = () => {
    if (!currentQuestion) return <p>No question available.</p>;

    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Progress Indicator */}
        <div className="mb-6 p-4 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
          <div className="mb-2">
            <div className="text-sm font-medium text-theme-text-primary">
              Question {currentQuestionNumber} of {totalQuestions || '?'}
            </div>
          </div>
          
          <div className="w-full bg-theme-bg-secondary rounded-full h-2">
            <div 
              className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${totalQuestions > 0 ? (questionsAnswered / totalQuestions) * 100 : 0}%` 
              }}
            />
          </div>
        </div>

        {/* Question Text - Skip for FILL_GAP as it's embedded in the answer component */}
        {currentQuestion.type !== 'FILL_GAP' && (
          <h2 className="text-xl font-semibold mb-4 text-theme-text-primary">
            {currentQuestion.questionText}
          </h2>
        )}

        {currentQuestion.hint && (
          <HintDisplay hint={currentQuestion.hint} />
        )}

        {/* Question Options */}
        <div className="space-y-2 mb-6">
          {renderQuestion(currentQuestion, true)}
        </div>

        {error && <p className="text-theme-interactive-danger mt-4">{error}</p>}

        {/* Explanation (shown when answer result is available) */}
        {answerResult && answerResult.explanation && (
          <div className="mt-4 p-4 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-theme-interactive-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-theme-text-primary mb-1">Explanation</p>
                <SafeContent 
                  content={answerResult.explanation} 
                  allowHtml={true}
                  className="text-sm text-theme-text-secondary prose prose-sm max-w-none"
                />
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={answerResult ? handleNextQuestion : handleSubmitAnswer}
          disabled={answerResult ? false : (submitting || !isAnswerProvided())}
          loading={submitting && !answerResult}
          variant="primary"
          size="md"
          className="mt-4 w-full"
        >
          {answerResult 
            ? (answerResult.nextQuestion ? "Next Question →" : "View Results")
            : (submitting ? "Submitting..." : "Submit Answer")
          }
        </Button>
      </div>
    );
  };

  const renderALL_AT_ONCE_Mode = () => {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Progress and Timer */}
        <div className="mb-6 p-4 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-theme-text-primary">
              All Questions Mode
            </div>
            <div className="text-sm text-theme-text-secondary">
              {Object.keys(answers).length} of {totalQuestions} answered
            </div>
          </div>
          
          <div className="w-full bg-theme-bg-secondary rounded-full h-2 mb-2">
            <div 
              className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${totalQuestions > 0 ? (Object.keys(answers).length / totalQuestions) * 100 : 0}%` 
              }}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {allQuestions.map((question, index) => (
            <div key={question.id} className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 bg-theme-bg-primary text-theme-text-primary">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-medium text-theme-text-primary">
                  Question {index + 1}
                </h3>
                {answers[question.id] && (
                  <span className="text-sm text-theme-interactive-success bg-theme-bg-success px-2 py-1 rounded">
                    ✓ Answered
                  </span>
                )}
              </div>
              
              <p className="text-theme-text-secondary mb-4">{question.questionText}</p>
              
              {question.hint && (
                <HintDisplay hint={question.hint} />
              )}

              {renderQuestion(question, true)}
            </div>
          ))}
        </div>

        {/* Submit All Button */}
        <div className="mt-8">
          <AttemptBatchAnswers
            attemptId={attemptId!}
            answers={answers}
            totalQuestions={totalQuestions}
            existingAnswers={existingAnswers}
            onSubmissionComplete={handleSubmitAllAnswers}
            onSubmissionError={setError}
          />
        </div>
      </div>
    );
  };

  const renderTIMED_Mode = () => {
    if (!currentQuestion) return <p>No question available.</p>;

    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Timer and Progress */}
        <div className="mb-6 p-4 bg-theme-bg-tertiary border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary">
          <div className="mb-2">
            <div className="text-sm font-medium text-theme-text-primary">
              Question {currentQuestionNumber} of {totalQuestions || '?'}
            </div>
          </div>
          
          {quiz?.timerDuration && (
            <AttemptTimer
              durationMinutes={quiz.timerDuration}
              onTimeUp={() => {
                // Auto-submit current answer when time is up
                if (isAnswerProvided()) {
                  handleSubmitAnswer();
                } else {
                  // If no answer provided, submit empty answer and complete attempt
                  handleSubmitAnswer();
                }
              }}
            />
          )}
          
          <div className="w-full bg-theme-bg-secondary rounded-full h-2">
            <div 
              className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${totalQuestions > 0 ? (questionsAnswered / totalQuestions) * 100 : 0}%` 
              }}
            />
          </div>
        </div>

        {/* Question Text - Skip for FILL_GAP as it's embedded in the answer component */}
        {currentQuestion.type !== 'FILL_GAP' && (
          <h2 className="text-xl font-semibold mb-4 text-theme-text-primary">
            {currentQuestion.questionText}
          </h2>
        )}

        {currentQuestion.hint && (
          <HintDisplay hint={currentQuestion.hint} />
        )}

        {/* Render the current question */}
        {renderQuestion(currentQuestion, true)}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <Button
            onClick={handleSubmitAnswer}
            disabled={submitting || !isAnswerProvided()}
            loading={submitting}
            variant="primary"
            size="lg"
          >
            {submitting ? 'Submitting...' : 'Submit Answer'}
          </Button>
        </div>
      </div>
    );
  };

  /* -------------------------------------------------------------------- */
  /*  Main Render                                                         */
  /* -------------------------------------------------------------------- */
  if (loading) return <Spinner />;
  if (error) return <p className="text-theme-interactive-danger text-center py-10">{error}</p>;
  if (!attemptId) return <p className="text-center py-10">Failed to initialize attempt.</p>;

  return (
    <>
      <Seo title={quiz ? `Taking Quiz: ${quiz.title} | Quizzence` : 'Quiz Attempt | Quizzence'} noindex />
      <div className="min-h-screen bg-theme-bg-secondary">
        {/* Pause/Resume Controls */}
      {attemptId && (quiz?.timerEnabled || attemptMode === 'TIMED') && (
        <div className="max-w-4xl mx-auto pt-4 px-4">
          <AttemptPause
            attemptId={attemptId}
            currentStatus={attemptStatus}
            onStatusChange={handleStatusChange}
            onPause={handlePause}
            onResume={handleResume}
            className="mb-4"
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mb-4">
          <div className="bg-theme-bg-danger border border-theme-border-danger rounded-lg p-4">
            <p className="text-theme-interactive-danger">{error}</p>
          </div>
        </div>
      )}

      {/* Mode-specific rendering */}
      {attemptMode === 'ONE_BY_ONE' && renderONE_BY_ONE_Mode()}
      {attemptMode === 'ALL_AT_ONCE' && renderALL_AT_ONCE_Mode()}
      {attemptMode === 'TIMED' && renderTIMED_Mode()}
      </div>
    </>
  );
};

export default QuizAttemptPage;
