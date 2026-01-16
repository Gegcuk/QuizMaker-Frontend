import React from 'react';
import type { QuestionForAttemptDto } from '@/types';
import HintDisplay from './HintDisplay';

interface QuestionPromptProps {
  question: QuestionForAttemptDto;
  showQuestionText?: boolean;
  showHint?: boolean;
  showAttachment?: boolean;
  questionTextClassName?: string;
  className?: string;
}

const QuestionPrompt: React.FC<QuestionPromptProps> = ({
  question,
  showQuestionText,
  showHint = true,
  showAttachment = true,
  questionTextClassName = 'text-xl font-semibold text-theme-text-primary',
  className = ''
}) => {
  const shouldShowText = showQuestionText ?? question.type !== 'FILL_GAP';
  const attachmentUrl = question.attachment?.cdnUrl || question.attachmentUrl;

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
          <div className="text-xs text-theme-text-tertiary">Attachment</div>
        </div>
      )}

      {showHint && question.hint && (
        <HintDisplay hint={question.hint} />
      )}
    </div>
  );
};

export default QuestionPrompt;
