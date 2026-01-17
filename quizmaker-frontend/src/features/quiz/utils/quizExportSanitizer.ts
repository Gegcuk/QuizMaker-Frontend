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

  if (!Array.isArray(content.options)) {
    return content;
  }

  const options = content.options.map((option: AnyRecord) => {
    const media = sanitizeMediaRef(option.media);
    const nextOption: AnyRecord = { ...option };

    if (media) {
      nextOption.media = media;
    } else {
      delete nextOption.media;
    }

    return nextOption;
  });

  return { ...content, options };
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
