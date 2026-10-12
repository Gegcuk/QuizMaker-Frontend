import type { QuizGenerationStatus } from '@/types';
import { ApplicationError } from '@/utils/applicationError';

export interface GenerationJobPage {
  content: QuizGenerationStatus[];
  number: number;
  size: number;
  totalPages: number;
  totalElements: number;
  last: boolean;
  numberOfElements: number;
}

const invalid = () => new ApplicationError({ category: 'unexpected' });
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();
  return value as Record<string, unknown>;
};
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const identifier = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);

export const isActiveGeneration = (job: QuizGenerationStatus | undefined) => job?.status === 'PENDING' || job?.status === 'PROCESSING';

/** Validate the fields we consume; discard unrelated transport/billing metadata. */
export function readGenerationStatus(value: unknown): QuizGenerationStatus {
  const item = object(value);
  if (!identifier(item.jobId) || !['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(String(item.status))) throw invalid();
  const job: QuizGenerationStatus = { jobId: item.jobId, status: item.status as QuizGenerationStatus['status'] };
  for (const key of ['totalChunks', 'processedChunks', 'progressPercentage', 'totalQuestionsGenerated', 'elapsedTimeSeconds', 'estimatedTimeRemainingSeconds'] as const) {
    const field = item[key];
    if (field === undefined || field === null) job[key] = field;
    else if (typeof field === 'number' && Number.isFinite(field) && field >= 0 && (key !== 'progressPercentage' || field <= 100)) job[key] = field;
    else throw invalid();
  }
  for (const key of ['currentChunk', 'estimatedCompletion', 'errorMessage', 'startedAt', 'completedAt'] as const) {
    const field = item[key];
    if (field === undefined || field === null || typeof field === 'string') job[key] = field;
    else throw invalid();
  }
  if (item.generatedQuizId != null && !identifier(item.generatedQuizId)) throw invalid();
  job.generatedQuizId = item.generatedQuizId as string | null | undefined;
  return job;
}

export function readGenerationPage(value: unknown, requestedPage: number): GenerationJobPage {
  const item = object(value);
  if (!Array.isArray(item.content) || !integer(item.number) || item.number !== requestedPage
    || !integer(item.size) || item.size === 0 || !integer(item.totalPages) || !integer(item.totalElements)
    || !integer(item.numberOfElements) || item.numberOfElements !== item.content.length
    || item.content.length > item.size || typeof item.last !== 'boolean'
    || item.totalPages !== Math.ceil(item.totalElements / item.size)
    || item.last !== (item.totalPages === 0 || item.number === item.totalPages - 1)
    || (item.totalPages > 0 && item.number >= item.totalPages)) throw invalid();
  return {
    content: item.content.map(readGenerationStatus), number: item.number, size: item.size,
    totalPages: item.totalPages, totalElements: item.totalElements, last: item.last,
    numberOfElements: item.numberOfElements,
  };
}

/** Only a complete, consistent traversal can establish absence. Never infer it from page 0. */
export async function discoverActiveGeneration(
  readPage: (page: number) => Promise<GenerationJobPage>,
): Promise<QuizGenerationStatus | null> {
  const seen = new Set<string>();
  let first: GenerationJobPage | undefined;
  for (let page = 0; ; page++) {
    const result = await readPage(page);
    first ??= result;
    if (result.totalElements !== first.totalElements || result.totalPages !== first.totalPages || result.size !== first.size) throw invalid();
    const active = result.content.find(isActiveGeneration);
    if (active) return active;
    for (const job of result.content) {
      if (seen.has(job.jobId)) throw invalid();
      seen.add(job.jobId);
    }
    if (result.last) {
      if (seen.size !== result.totalElements) throw invalid();
      return null;
    }
    if (result.content.length !== result.size) throw invalid();
  }
}
