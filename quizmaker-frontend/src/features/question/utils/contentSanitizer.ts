import type { FillGapContent, GapAnswer, McqMultiContent, McqSingleContent } from '../types/question.types';

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

const normalizeOptionValue = (value: string) => value.trim();

const normalizeOptionKey = (value: string) => normalizeOptionValue(value).toLowerCase();

export const dedupeFillGapOptions = (options: string[]): string[] => {
  const seen = new Set<string>();

  return options.reduce<string[]>((acc, option) => {
    const normalizedOption = normalizeOptionValue(option);
    const key = normalizeOptionKey(normalizedOption);

    if (!normalizedOption || seen.has(key)) {
      return acc;
    }

    seen.add(key);
    acc.push(normalizedOption);
    return acc;
  }, []);
};

export const sanitizeFillGapContentForSubmission = (content: FillGapContent): FillGapContent => {
  const gaps: GapAnswer[] = (content?.gaps || []).map((gap) => ({
    id: gap.id,
    answer: normalizeOptionValue(gap.answer || ''),
  }));

  const options = dedupeFillGapOptions(content?.options || []);
  const baseContent: FillGapContent = {
    text: content?.text || '',
    gaps,
  };

  return options.length > 0
    ? { ...baseContent, options }
    : baseContent;
};
