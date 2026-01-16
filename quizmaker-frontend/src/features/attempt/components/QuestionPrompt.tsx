import React from 'react';
import type { QuestionForAttemptDto } from '@/types';
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
        </div>
      )}
    </div>
  );
};

export default QuestionPrompt;
