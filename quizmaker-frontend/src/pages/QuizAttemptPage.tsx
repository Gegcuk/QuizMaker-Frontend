// src/pages/QuizAttemptPage.tsx
// ---------------------------------------------------------------------------
// Quiz attempt page - handles individual question answering
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AttemptService } from "../api/attempt.service";
import { AnswerSubmissionRequest } from "../types/attempt.types";
import api from "../api/axiosInstance";
import { Spinner } from "../components/ui";
import { 
  McqAnswer, 
  TrueFalseAnswer, 
  OpenAnswer, 
  FillGapAnswer, 
  ComplianceAnswer, 
  OrderingAnswer, 
  HotspotAnswer 
} from "../components/attempt";

// Shape of user answer input; varies by question type
type AnswerInput = any;

const QuizAttemptPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const attemptService = new AttemptService(api);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [answerInput, setAnswerInput] = useState<AnswerInput>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Progress tracking state
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(1);

  const isAnswerProvided = () => {
    if (!currentQuestion) return false;

    // Debug logging for ordering questions
    if (currentQuestion.type === "ORDERING") {
      console.log("Ordering answer validation:", {
        answerInput,
        isArray: Array.isArray(answerInput),
        length: answerInput?.length,
        isValid: Array.isArray(answerInput) && answerInput.length > 0
      });
    }

    // Debug logging for fill gap questions
    if (currentQuestion.type === "FILL_GAP") {
      console.log("Fill gap answer validation:", {
        answerInput,
        isObject: typeof answerInput === 'object',
        keys: answerInput ? Object.keys(answerInput) : [],
        values: answerInput ? Object.values(answerInput) : [],
        isValid: answerInput && Object.keys(answerInput).length > 0
      });
    }

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
      case "FILL_GAP":
        return answerInput && Object.keys(answerInput).length > 0;
      case "HOTSPOT":
        return Boolean(answerInput);
      case "ORDERING":
        return Array.isArray(answerInput) && answerInput.length > 0;
      default:
        return Object.keys(answerInput).length > 0;
    }

    return true;
  };

  /* -------------------------------------------------------------------- */
  /*  Progress tracking functions                                          */
  /* -------------------------------------------------------------------- */
  const fetchAttemptStats = async () => {
    if (!attemptId) return;
    
    try {
      const stats = await attemptService.getAttemptStats(attemptId);
      console.log("Attempt stats received:", stats);
      
      setQuestionsAnswered(stats.questionsAnswered);
      setCurrentQuestionNumber(stats.questionsAnswered + 1);
      
      // Estimate total questions based on completion percentage
      if (totalQuestions === 0 && stats.completionPercentage > 0) {
        const estimatedTotal = Math.round(stats.questionsAnswered / (stats.completionPercentage / 100));
        console.log("Estimated total questions:", {
          questionsAnswered: stats.questionsAnswered,
          completionPercentage: stats.completionPercentage,
          estimatedTotal
        });
        setTotalQuestions(estimatedTotal);
      }
    } catch (error) {
      console.warn("Could not fetch attempt stats:", error);
    }
  };

  const updateProgress = () => {
    setQuestionsAnswered(prev => prev + 1);
    setCurrentQuestionNumber(prev => prev + 1);
  };

  /* -------------------------------------------------------------------- */
  /*  Fetch stats when attemptId changes                                   */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    if (attemptId) {
      fetchAttemptStats();
    }
  }, [attemptId]);

  /* -------------------------------------------------------------------- */
  /*  Kick-off attempt & fetch first question                              */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    if (!quizId) return;

    const startAttempt = async () => {
      try {
        // 1. Create attempt using AttemptService
        const attempt = await attemptService.startAttempt(quizId, { mode: "ONE_BY_ONE" });
        setAttemptId(attempt.attemptId);
        setCurrentQuestion(attempt.firstQuestion || null);
        
        // Debug logging for the first question
        if (attempt.firstQuestion) {
          console.log("First question received:", {
            type: attempt.firstQuestion.type,
            questionText: attempt.firstQuestion.questionText,
            safeContent: attempt.firstQuestion.safeContent
          });
        }
        
        // Fetch initial attempt stats
        await fetchAttemptStats();
      } catch {
        setError("Failed to start quiz attempt.");
      } finally {
        setLoading(false);
      }
    };

    startAttempt();
  }, [quizId]);

  /* -------------------------------------------------------------------- */
  /*  Submit current answer                                               */
  /* -------------------------------------------------------------------- */
  const handleSubmit = async () => {
    if (!attemptId || !currentQuestion) return;

    setSubmitting(true);
    setError(null);

    // Build response object depending on question type
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
        default:
          return { answer: answerInput };
      }
    };

    const payload: AnswerSubmissionRequest = {
      questionId: currentQuestion.id,
      response: buildResponse(),
    };

    // Debug logging for the payload
    console.log("Submitting answer payload:", {
      questionType: currentQuestion.type,
      questionId: currentQuestion.id,
      answerInput: answerInput,
      response: payload.response
    });

    try {
      const data = await attemptService.submitAnswer(attemptId, payload);
      console.log("Answer submitted:", data);

      // nextQuestion present → continue; otherwise finish attempt
      if (data.nextQuestion) {
        console.log("Next question received:", {
          type: data.nextQuestion.type,
          questionText: data.nextQuestion.questionText,
          safeContent: data.nextQuestion.safeContent
        });
        setCurrentQuestion(data.nextQuestion);
        setAnswerInput(null);
        
        // Update progress for next question
        updateProgress();
        
        // Fetch updated stats
        await fetchAttemptStats();
      } else {
        await attemptService.completeAttempt(attemptId);
        navigate(`/quizzes/${quizId}/results?attemptId=${attemptId}`);
      }
    } catch (e: any) {
      console.error('Submission error:', e.response);
      const backendMessage = e?.response?.data?.details?.[0] || e?.response?.data?.error;
      setError(backendMessage || 'Failed to submit answer. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Rendering helpers                                                   */
  /* -------------------------------------------------------------------- */
  const renderOptions = () => {
    const { safeContent } = currentQuestion;

    switch (currentQuestion.type) {
      case "MCQ_SINGLE":
        return safeContent.options.map((opt: any) => (
          <label key={opt.id} className="flex items-center mb-2">
            <input
              type="radio"
              name="option"
              value={opt.id}
              checked={answerInput === opt.id}
              onChange={() => setAnswerInput(opt.id)}
              className="mr-2"
            />
            {opt.text}
          </label>
        ));

      case "MCQ_MULTI":
        return safeContent.options.map((opt: any) => (
          <label key={opt.id} className="flex items-center mb-2">
            <input
              type="checkbox"
              value={opt.id}
              checked={answerInput?.includes(opt.id) || false}
              onChange={(e) => {
                const current = answerInput || [];
                if (e.target.checked) {
                  setAnswerInput([...current, opt.id]);
                } else {
                  setAnswerInput(current.filter((id: any) => id !== opt.id));
                }
              }}
              className="mr-2"
            />
            {opt.text}
          </label>
        ));

      case "TRUE_FALSE":
        return (
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="trueFalse"
                value="true"
                checked={answerInput === true}
                onChange={() => setAnswerInput(true)}
                className="mr-2"
              />
              True
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="trueFalse"
                value="false"
                checked={answerInput === false}
                onChange={() => setAnswerInput(false)}
                className="mr-2"
              />
              False
            </label>
          </div>
        );

      case "OPEN":
        return (
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={4}
            value={answerInput || ""}
            onChange={(e) => setAnswerInput(e.target.value)}
            placeholder="Enter your answer here..."
          />
        );

      case "COMPLIANCE":
        return safeContent.statements.map((stmt: any) => (
          <label key={stmt.id} className="flex items-center mb-2">
            <input
              type="checkbox"
              value={stmt.id}
              checked={answerInput?.includes(stmt.id) || false}
              onChange={(e) => {
                const current = answerInput || [];
                if (e.target.checked) {
                  setAnswerInput([...current, stmt.id]);
                } else {
                  setAnswerInput(current.filter((id: any) => id !== stmt.id));
                }
              }}
              className="mr-2"
            />
            {stmt.text}
          </label>
        ));

      case "FILL_GAP":
        return (
          <FillGapAnswer
            question={currentQuestion}
            currentAnswer={answerInput}
            onAnswerChange={setAnswerInput}
            disabled={submitting}
          />
        );

      case "HOTSPOT":
        return safeContent.regions.map((region: any) => (
          <label key={region.id} className="flex items-center mb-2">
            <input
              type="radio"
              name="region"
              value={region.id}
              checked={answerInput === region.id}
              onChange={() => setAnswerInput(region.id)}
              className="mr-2"
            />
            Region {region.id}
          </label>
        ));

      case "ORDERING":
        return (
          <OrderingAnswer
            question={currentQuestion}
            currentAnswer={answerInput}
            onAnswerChange={setAnswerInput}
            disabled={submitting}
          />
        );

      default:
        return <p>Unsupported question type</p>;
    }
  };

  /* -------------------------------------------------------------------- */
  /*  JSX                                                                 */
  /* -------------------------------------------------------------------- */
  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500 text-center py-10">{error}</p>;
  if (!currentQuestion)
    return <p className="text-center py-10">No question available.</p>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Progress Indicator */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-700">
            Question {currentQuestionNumber} of {totalQuestions || '?'}
          </div>
          <div className="text-sm text-gray-600">
            {questionsAnswered} answered
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${totalQuestions > 0 ? (questionsAnswered / totalQuestions) * 100 : 0}%` 
            }}
          />
        </div>
        
        {/* Progress Details */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {questionsAnswered} of {totalQuestions || '?'} questions completed
          </span>
          <span>
            {totalQuestions > 0 ? Math.round((questionsAnswered / totalQuestions) * 100) : 0}% complete
          </span>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">
        {currentQuestion.questionText}
      </h2>

      {currentQuestion.hint && (
        <p className="text-sm text-gray-500 mb-4 italic">
          Hint: {currentQuestion.hint}
        </p>
      )}

      {/* Options */}
      <div className="space-y-2">{renderOptions()}</div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting || !isAnswerProvided()}
        className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Answer"}
      </button>
    </div>
  );
};

export default QuizAttemptPage;
