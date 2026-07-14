type AnyRecord = Record<string, any>;

const isRecord = (value: unknown): value is AnyRecord =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const sanitizeMediaRef = (media: unknown): { assetId: string } | undefined => {
  if (!isRecord(media)) {
    return undefined;
  }

  const assetId = media.assetId;
  if (typeof assetId !== 'string' || assetId.trim().length === 0) {
    return undefined;
  }

  return { assetId };
};

const sanitizeQuestionContent = (content: unknown): unknown => {
  if (!isRecord(content)) {
    return content;
  }

  const mediaItemFields = ['options', 'statements', 'items', 'left', 'right'] as const;
  const nextContent: AnyRecord = { ...content };

  mediaItemFields.forEach((field) => {
    if (!Array.isArray(content[field])) {
      return;
    }

    nextContent[field] = content[field].map((item: unknown) => {
      if (!isRecord(item)) {
        return item;
      }

      const media = sanitizeMediaRef(item.media);
      const nextItem: AnyRecord = { ...item };

      if (media) {
        nextItem.media = media;
      } else {
        delete nextItem.media;
      }

      return nextItem;
    });
  });

  return nextContent;
};

const sanitizeQuestionExport = (question: AnyRecord): AnyRecord => {
  const hasAttachmentUrl = Object.prototype.hasOwnProperty.call(question, 'attachmentUrl');
  const inferredAttachmentUrl =
    isRecord(question.attachment) && typeof question.attachment.cdnUrl === 'string'
      ? question.attachment.cdnUrl
      : undefined;
  const attachmentUrl = hasAttachmentUrl ? question.attachmentUrl : inferredAttachmentUrl;

  const hasAttachmentAssetId = Object.prototype.hasOwnProperty.call(question, 'attachmentAssetId');
  const inferredAttachmentAssetId =
    isRecord(question.attachment) && typeof question.attachment.assetId === 'string'
      ? question.attachment.assetId
      : undefined;
  const attachmentAssetId = hasAttachmentAssetId ? question.attachmentAssetId : inferredAttachmentAssetId;

  const { attachment, ...rest } = question;
  const nextQuestion: AnyRecord = {
    ...rest,
    content: sanitizeQuestionContent(rest.content),
  };

  if (attachmentUrl !== undefined) {
    nextQuestion.attachmentUrl = attachmentUrl;
  }

  if (attachmentAssetId !== undefined) {
    nextQuestion.attachmentAssetId = attachmentAssetId;
  }

  return nextQuestion;
};

const sanitizeQuizExport = (quiz: AnyRecord): AnyRecord => {
  if (!Array.isArray(quiz.questions)) {
    return quiz;
  }

  return {
    ...quiz,
    questions: quiz.questions.map((question: AnyRecord) => sanitizeQuestionExport(question)),
  };
};

export const sanitizeQuizExportPayload = (payload: unknown): unknown => {
  if (Array.isArray(payload)) {
    return payload.map((quiz) => (isRecord(quiz) ? sanitizeQuizExport(quiz) : quiz));
  }

  if (isRecord(payload)) {
    return sanitizeQuizExport(payload);
  }

  return payload;
};

export const sanitizeQuizExportBlob = async (blob: Blob): Promise<Blob> => {
  const text = await blob.text();

  try {
    const parsed = JSON.parse(text);
    const sanitized = sanitizeQuizExportPayload(parsed);
    return new Blob([JSON.stringify(sanitized, null, 2)], { type: 'application/json' });
  } catch {
    return blob;
  }
};
