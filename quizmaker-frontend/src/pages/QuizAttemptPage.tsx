// src/pages/QuizAttemptPage.tsx
// ---------------------------------------------------------------------------
// ONE_BY_ONE quiz flow for MCQ_SINGLE and TRUE_FALSE questions only.
// Auth & ProtectedRoute are assumed to be in place.
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import Spinner from '../components/Spinner';
import type {
  StartAttemptDto,
  QuestionDto,
  AnswerSubmissionDto,
  AnswerSubmissionRequest,
} from '../types/api';

type AnswerInput = string | boolean | null;

const QuizAttemptPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionDto | null>(
    null,
  );
  const [answerInput, setAnswerInput] = useState<AnswerInput>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /* -------------------------------------------------------------------- */
  /*  Kick-off attempt & fetch first question                              */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    if (!quizId) return;

    const startAttempt = async () => {
      try {
        // 1. Create attempt
        const { data: attempt } = await api.post<AttemptDto>(
          `/attempts/quizzes/${quizId}`,
          { mode: 'ONE_BY_ONE' },
        );
        setAttemptId(attempt.attemptId);

        setCurrentQuestion(attempt.firstQuestion);

      } catch {
        setError('Failed to start quiz attempt.');
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

    const payload: AnswerSubmissionRequest =
      currentQuestion.type === 'MCQ_SINGLE'
        ? {
            questionId: currentQuestion.id,
            response: { selectedOptionId: answerInput },
          }
        : {
            questionId: currentQuestion.id,
            response: { answer: answerInput },
          };

    try {
      const { data } = await api.post<AnswerSubmissionDto>(
        `/attempts/${attemptId}/answers`,
        payload,
      );

      // nextQuestion present → continue; otherwise finish attempt
      if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
        setAnswerInput(null);
      } else {
        await api.post(`/attempts/${attemptId}/complete`);
        navigate(`/quizzes/${quizId}/results?attemptId=${attemptId}`);
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.error || 'Failed to submit answer. Please retry.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Rendering helpers                                                   */
  /* -------------------------------------------------------------------- */
  const renderOptions = () => {
    if (!currentQuestion) return null;

    if (currentQuestion.type === 'MCQ_SINGLE') {
      return currentQuestion.content.options.map((opt: any) => (
        <label key={opt.id} className="flex items-center mb-2">
          <input
            type="radio"
            name={currentQuestion.id}
            value={opt.id}
            checked={answerInput === opt.id}
            onChange={() => setAnswerInput(opt.id)}
            className="mr-2"
          />
          {opt.text}
        </label>
      ));
    }

    // TRUE_FALSE
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
  };

  /* -------------------------------------------------------------------- */
  /*  JSX                                                                 */
  /* -------------------------------------------------------------------- */
  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500 text-center py-10">{error}</p>;
  if (!currentQuestion) return <p className="text-center py-10">No question available.</p>;

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
        disabled={submitting || answerInput === null}
        className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Answer'}
      </button>
    </div>
  );
};

export default QuizAttemptPage;
