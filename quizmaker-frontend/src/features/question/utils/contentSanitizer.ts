import type { McqMultiContent, McqSingleContent } from '../types/question.types';

export const sanitizeMcqContentForSubmission = (
  content: McqSingleContent | McqMultiContent
): McqSingleContent | McqMultiContent => ({
  options: (content?.options || []).map((opt) => ({
    id: opt.id,
    text: opt.text,
    correct: opt.correct,
    media: opt.media?.assetId ? { assetId: opt.media.assetId } : undefined,
  })),
});
