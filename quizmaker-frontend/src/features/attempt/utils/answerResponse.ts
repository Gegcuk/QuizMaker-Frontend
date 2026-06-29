import type { QuestionForAttemptDto } from '../types/attempt.types';

export type AnswerInput = unknown;

type AttemptQuestionLike = Pick<QuestionForAttemptDto, 'type' | 'safeContent'>;

export interface FillGapSubmissionResponse {
  answers: Array<{
    gapId: number;
    answer: string;
  }>;
}

const isFillGapSubmissionResponse = (
  answer: AnswerInput,
): answer is FillGapSubmissionResponse =>
  !!answer &&
  typeof answer === 'object' &&
  !Array.isArray(answer) &&
  Array.isArray((answer as Partial<FillGapSubmissionResponse>).answers);

export const buildFillGapResponse = (
  answer: AnswerInput,
): FillGapSubmissionResponse => {
  if (isFillGapSubmissionResponse(answer)) {
    return answer;
  }

  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) {
    return { answers: [] };
  }

  return {
    answers: Object.entries(answer as Record<string, unknown>)
      .map(([id, value]) => ({
        gapId: Number(id),
        answer: String(value).trim(),
      }))
      .filter((gap) => Number.isFinite(gap.gapId) && gap.answer.length > 0)
      .sort((a, b) => a.gapId - b.gapId),
  };
};

export const buildQuestionResponse = (
  question: AttemptQuestionLike,
  answer: AnswerInput,
): unknown => {
  switch (question.type) {
    case 'MCQ_SINGLE':
      return { selectedOptionId: answer };
    case 'MCQ_MULTI':
      return { selectedOptionIds: Array.isArray(answer) ? answer : [] };
    case 'TRUE_FALSE':
      return { answer: Boolean(answer) };
    case 'OPEN':
      return { answer };
    case 'COMPLIANCE':
      return { selectedStatementIds: Array.isArray(answer) ? answer : [] };
    case 'FILL_GAP':
      return buildFillGapResponse(answer);
    case 'HOTSPOT':
      return {
        selectedRegionId:
          typeof answer === 'number' && Number.isFinite(answer) ? answer : null,
      };
    case 'ORDERING':
      return { orderedItemIds: Array.isArray(answer) ? answer : [] };
    case 'MATCHING':
      return answer && typeof answer === 'object' && !Array.isArray(answer)
        ? answer
        : { matches: [] };
    default:
      return { answer };
  }
};

export const isQuestionAnswerProvided = (
  question: AttemptQuestionLike,
  answer: AnswerInput,
): boolean => {
  switch (question.type) {
    case 'MCQ_SINGLE':
      return typeof answer === 'string' && answer.length > 0;
    case 'MCQ_MULTI':
      return Array.isArray(answer) && answer.length > 0;
    case 'TRUE_FALSE':
      return answer !== null && answer !== undefined;
    case 'OPEN':
      return typeof answer === 'string' && answer.trim().length > 0;
    case 'COMPLIANCE':
      return Array.isArray(answer) && answer.length > 0;
    case 'FILL_GAP': {
      const totalGaps = Array.isArray(question.safeContent?.gaps)
        ? question.safeContent.gaps.length
        : 0;

      return totalGaps > 0 && buildFillGapResponse(answer).answers.length === totalGaps;
    }
    case 'HOTSPOT':
      return typeof answer === 'number' && Number.isFinite(answer);
    case 'ORDERING':
      return Array.isArray(answer) && answer.length > 0;
    case 'MATCHING': {
      const totalPairs = Array.isArray(question.safeContent?.left)
        ? question.safeContent.left.length
        : 0;
      const matches =
        answer && typeof answer === 'object' && !Array.isArray(answer)
          ? (answer as { matches?: unknown }).matches
          : null;

      return Array.isArray(matches) && totalPairs > 0 && matches.length === totalPairs;
    }
    default:
      return !!answer && typeof answer === 'object' && Object.keys(answer).length > 0;
  }
};
