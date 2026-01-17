import React, { useEffect, useState } from 'react';
import type { QuestionForAttemptDto } from '@/types';
import { mediaService } from '@/features/media';
interface QuestionPromptProps {
  question: QuestionForAttemptDto;
  showQuestionText?: boolean;
  showAttachment?: boolean;
  questionTextClassName?: string;
  className?: string;
}

const QuestionPrompt: React.FC<QuestionPromptProps> = ({
  question,
  showQuestionText,
  showAttachment = true,
  questionTextClassName = 'text-xl font-semibold text-theme-text-primary',
  className = ''
}) => {
  const shouldShowText = showQuestionText ?? question.type !== 'FILL_GAP';
  const [resolvedAttachmentUrl, setResolvedAttachmentUrl] = useState<string | null>(null);
  const [isAttachmentMissing, setIsAttachmentMissing] = useState(false);
  const attachmentAssetId = question.attachment?.assetId;
  const attachmentCdnUrl = question.attachment?.cdnUrl;
  const legacyAttachmentUrl = question.attachmentUrl;

  useEffect(() => {
    let isActive = true;
    setResolvedAttachmentUrl(null);
    setIsAttachmentMissing(false);

    if (!attachmentAssetId || attachmentCdnUrl || legacyAttachmentUrl) {
      return undefined;
    }

    const fetchAttachment = async () => {
      try {
        const asset = await mediaService.getAsset(attachmentAssetId);
        if (!isActive) return;
        setResolvedAttachmentUrl(asset.cdnUrl);
      } catch {
        if (!isActive) return;
        setIsAttachmentMissing(true);
      }
    };

    fetchAttachment();

    return () => {
      isActive = false;
    };
  }, [attachmentAssetId, attachmentCdnUrl, legacyAttachmentUrl]);

  const attachmentUrl = attachmentCdnUrl || legacyAttachmentUrl || resolvedAttachmentUrl;

  return (
    <div className={`space-y-4 ${className}`}>
      {shouldShowText && (
        <div className={questionTextClassName}>
          {question.questionText}
        </div>
      )}

      {showAttachment && attachmentUrl && (
        <div className="space-y-2">
          <img
            src={attachmentUrl}
            alt="Question attachment"
            className="max-w-full h-auto rounded-md border border-theme-border-primary"
          />
        </div>
      )}

      {showAttachment && !attachmentUrl && isAttachmentMissing && (
        <div className="rounded-md border border-theme-border-primary bg-theme-bg-secondary px-3 py-2 text-sm text-theme-text-tertiary">
          Attachment unavailable.
        </div>
      )}
    </div>
  );
};

export default QuestionPrompt;
