// src/pages/QuizAttemptPage.tsx
// ---------------------------------------------------------------------------
// ONE_BY_ONE quiz flow for MCQ_SINGLE and TRUE_FALSE questions only.
// ONE_BY_ONE quiz flow supporting all question types.
// Auth & ProtectedRoute are assumed to be in place.
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { Spinner } from "../components/ui";
import type {
  QuestionDto,
  AnswerSubmissionDto,
  AnswerSubmissionRequest,
  StartAttemptDto,
} from "../types/api";

// Shape of user answer input; varies by question type
type AnswerInput = any;

const QuizAttemptPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionDto | null>(
    null
  );
  const [answerInput, setAnswerInput] = useState<AnswerInput>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isAnswerProvided = () => {
    if (answerInput === null || answerInput === undefined) return false;
    if (typeof answerInput === "string") return answerInput.trim().length > 0;
    if (Array.isArray(answerInput)) return answerInput.length > 0;
    if (typeof answerInput === "object")
      return Object.keys(answerInput).length > 0;

    return true;
  };

  /* -------------------------------------------------------------------- */
  /*  Kick-off attempt & fetch first question                              */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    if (!quizId) return;

    const startAttempt = async () => {
      try {
        // 1. Create attempt
        const { data: attempt } = await api.post<StartAttemptDto>(
          `/attempts/quizzes/${quizId}`,
          { mode: "ONE_BY_ONE" }
        );
        setAttemptId(attempt.attemptId);

        setCurrentQuestion(attempt.firstQuestion);
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
            gaps: Object.entries(answerInput || {}).map(([id, ans]) => ({
              id: Number(id),
              answer: String(ans).trim(),
            })),
          };
        case "HOTSPOT":
          return { regionId: answerInput };
        case "ORDERING":
          return { itemIds: answerInput ?? [] };
        default:
          return { answer: answerInput };
      }
    };

    const payload: AnswerSubmissionRequest = {
      questionId: currentQuestion.id,
      response: buildResponse(),
    };

    try {
      const { data } = await api.post<AnswerSubmissionDto>(
        `/attempts/${attemptId}/answers`,
        payload
      );
      console.log("Answer submitted:", data);

      // nextQuestion present → continue; otherwise finish attempt
      if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
        setAnswerInput(null);
      } else {
        await api.post(`/attempts/${attemptId}/complete`);
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
    if (!currentQuestion) return null;
    const { type, content } = currentQuestion;

    switch (type) {
      case "MCQ_SINGLE":
        return content.options.map((opt: any, idx: number) => {
          const optionValue = opt.id ?? idx;
          return (
            <label key={optionValue} className="flex items-center mb-2">
              <input
                type="radio"
                name={currentQuestion.id}
                value={optionValue}
                checked={answerInput === optionValue}
                onChange={() => setAnswerInput(optionValue)}
                className="mr-2"
              />
              {opt.text}
            </label>
          );
        });

      case "MCQ_MULTI":
        return content.options.map((opt: any, idx: number) => {
          const optionValue = opt.id ?? idx;
          return (
            <label key={optionValue} className="flex items-center mb-2">
              <input
                type="checkbox"
                value={optionValue}
                checked={
                  Array.isArray(answerInput) && answerInput.includes(optionValue)
                }
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAnswerInput((prev: string[] = []) => {
                    if (checked) return [...prev, optionValue];
                    return prev.filter((id) => id !== optionValue);
                  });
                }}
                className="mr-2"
              />
              {opt.text}
            </label>
          );
        });

      case "TRUE_FALSE":
        return (
          <>
            <label className="flex items-center mb-2">
              <input
                type="radio"
                name={currentQuestion.id}
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
                name={currentQuestion.id}
                value="false"
                checked={answerInput === false}
                onChange={() => setAnswerInput(false)}
                className="mr-2"
              />
              False
            </label>
          </>
        );

      case "OPEN":
        return (
          <textarea
            className="w-full border px-3 py-2 rounded"
            value={typeof answerInput === "string" ? answerInput : ""}
            onChange={(e) => setAnswerInput(e.target.value)}
          />
        );

      case "COMPLIANCE":
        return content.statements.map((stmt: any) => (
          <label key={stmt.id} className="flex items-center mb-2">
            <input
              type="checkbox"
              value={stmt.id}
              checked={
                Array.isArray(answerInput) && answerInput.includes(stmt.id)
              }
              onChange={(e) => {
                const checked = e.target.checked;
                setAnswerInput((prev: number[] = []) => {
                  if (checked) return [...prev, stmt.id];
                  return prev.filter((id) => id !== stmt.id);
                });
              }}
              className="mr-2"
            />
            {stmt.text}
          </label>
        ));

      case "FILL_GAP":
        return content.gaps.map((gap: any) => (
          <div key={gap.id} className="mb-2">
            <label className="mr-2">Gap {gap.id}:</label>
            <input
              type="text"
              className="border px-2 py-1"
              value={answerInput?.[gap.id] || ""}
              onChange={(e) =>
                setAnswerInput({
                  ...(answerInput || {}),
                  [gap.id]: e.target.value,
                })
              }
            />
          </div>
        ));

      case "HOTSPOT":
        return content.regions.map((region: any) => (
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
        return content.items.map((it: any) => (
          <div key={it.id} className="flex items-center mb-2 space-x-2">
            <span className="flex-1">{it.text}</span>
            <input
              type="number"
              className="border px-2 py-1 w-20"
              value={answerInput?.[it.id] || ""}
              onChange={(e) =>
                setAnswerInput({
                  ...(answerInput || {}),
                  [it.id]: e.target.value,
                })
              }
            />
          </div>
        ));

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
