import type {
  ComplianceContent,
  FillGapContent,
  GapAnswer,
  MatchingContent,
  McqMultiContent,
  McqSingleContent,
  OrderingContent,
  QuestionItemMedia,
} from '../types/question.types';

const sanitizeMediaRef = (media?: QuestionItemMedia): { assetId: string } | undefined =>
  media?.assetId ? { assetId: media.assetId } : undefined;

const sanitizeMediaItem = <T extends { media?: QuestionItemMedia }>(item: T): T => {
  const media = sanitizeMediaRef(item.media);
  const sanitizedItem = {
    ...item,
    media,
  } as T;

  if (
    media
    && 'text' in sanitizedItem
    && typeof sanitizedItem.text === 'string'
    && sanitizedItem.text.trim().length === 0
  ) {
    delete (sanitizedItem as T & { text?: string }).text;
  }

  return sanitizedItem;
};

export const sanitizeMcqContentForSubmission = (
  content: McqSingleContent | McqMultiContent
): McqSingleContent | McqMultiContent => ({
  options: (content?.options || []).map((opt) => sanitizeMediaItem(opt)),
});

export const sanitizeComplianceContentForSubmission = (
  content: ComplianceContent
): ComplianceContent => ({
  statements: (content?.statements || []).map(sanitizeMediaItem),
});

export const sanitizeOrderingContentForSubmission = (
  content: OrderingContent
): OrderingContent => ({
  items: (content?.items || []).map(sanitizeMediaItem),
});

export const sanitizeMatchingContentForSubmission = (
  content: MatchingContent
): MatchingContent => ({
  left: (content?.left || []).map(sanitizeMediaItem),
  right: (content?.right || []).map(sanitizeMediaItem),
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
