// ---------------------------------------------------------------------------
// QuestionPreview.tsx - Live question preview component
// Shows how the question will appear to users
// ---------------------------------------------------------------------------

import React from 'react';
import { Badge, Checkbox, Textarea, Input } from '@/components';
import { CreateQuestionRequest, QuestionType, McqOption, ComplianceStatement, OrderingItem, GapAnswer, MediaRefDto } from '@/types';
import { getQuestionTypeIcon } from '@/utils/questionUtils';

interface QuestionPreviewProps {
  question: CreateQuestionRequest & { attachment?: MediaRefDto | null };
  className?: string;
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({
  question,
  className = ''
}) => {
  const attachmentUrl = question.attachment?.cdnUrl || question.attachmentUrl;

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'MCQ_SINGLE':
        return 'Single Choice';
      case 'MCQ_MULTI':
        return 'Multiple Choice';
      case 'TRUE_FALSE':
        return 'True/False';
      case 'OPEN':
        return 'Open Ended';
      case 'FILL_GAP':
        return 'Fill in the Blank';
      case 'COMPLIANCE':
        return 'Compliance';
      case 'ORDERING':
        return 'Ordering';
      case 'HOTSPOT':
        return 'Hotspot';
      case 'MATCHING':
        return 'Matching';
      default:
        return 'Unknown Type';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-theme-bg-tertiary text-theme-text-secondary';
      case 'MEDIUM':
        return 'bg-theme-bg-tertiary text-theme-text-secondary';
      case 'HARD':
        return 'bg-theme-bg-tertiary text-theme-text-secondary';
      default:
        return 'bg-theme-bg-tertiary text-theme-text-primary';
    }
  };

  const renderMcqOptionLabel = (option: McqOption) => {
    const hasText = !!(option.text && option.text.trim().length > 0);
    return (
      <div className="flex items-center gap-3">
        {option.media?.cdnUrl && (
          <img
            src={option.media.cdnUrl}
            alt={`Option ${option.id.toUpperCase()} media`}
            className="h-10 w-auto rounded-md border border-theme-border-primary"
          />
        )}
        <span>
          {hasText ? option.text : option.media?.cdnUrl ? 'Image option' : `Option ${option.id.toUpperCase()}`}
        </span>
      </div>
    );
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'MCQ_SINGLE':
        return (
          <div className="space-y-3">
            {question.content && 'options' in question.content && (question.content.options as McqOption[]).map((option) => (
              <div key={option.id} className="flex items-center justify-between">
                <Checkbox
                  id={`option-${option.id}`}
                  checked={false}
                  onChange={() => {}}
                  disabled
                  label={renderMcqOptionLabel(option)}
                />
                {option.correct && (
                  <Badge variant="success" size="sm">Correct</Badge>
                )}
              </div>
            ))}
          </div>
        );

      case 'MCQ_MULTI':
        return (
          <div className="space-y-3">
            {question.content && 'options' in question.content && (question.content.options as McqOption[]).map((option) => (
              <div key={option.id} className="flex items-center justify-between">
                <Checkbox
                  id={`option-${option.id}`}
                  checked={false}
                  onChange={() => {}}
                  disabled
                  label={renderMcqOptionLabel(option)}
                />
                {option.correct && (
                  <Badge variant="success" size="sm">Correct</Badge>
                )}
              </div>
            ))}
          </div>
        );

      case 'TRUE_FALSE':
        return (
          <div className="space-y-3">
            <Checkbox
              id="true-option"
              checked={false}
              onChange={() => {}}
              disabled
              label="True"
            />
            <Checkbox
              id="false-option"
              checked={false}
              onChange={() => {}}
              disabled
              label="False"
            />
            {question.content && 'answer' in question.content && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-bg-tertiary text-theme-text-secondary">
                  Correct Answer: {question.content.answer ? 'True' : 'False'}
                </span>
              </div>
            )}
          </div>
        );

      case 'OPEN':
        return (
          <div className="space-y-3">
            <Textarea
              placeholder="Enter your answer here..."
              disabled
              rows={4}
              value=""
              onChange={() => {}}
            />
            {question.content && 'answer' in question.content && (
              <div className="mt-2">
                <span className="text-sm font-medium text-theme-text-secondary">Model Answer:</span>
                <p className="text-sm text-theme-text-secondary mt-1">{question.content.answer}</p>
              </div>
            )}
          </div>
        );

      case 'FILL_GAP':
        return (
          <div className="space-y-3">
            {question.content && 'text' in question.content && (
              <div className="text-sm text-theme-text-secondary">
                <p>{question.content.text}</p>
              </div>
            )}
            {question.content && 'gaps' in question.content && (question.content.gaps as GapAnswer[]).map((gap) => (
              <div key={gap.id} className="flex items-center space-x-2">
                <span className="text-sm text-theme-text-secondary">Gap {gap.id}:</span>
                <Input
                  type="text"
                  placeholder="Fill in the blank"
                  disabled
                  value=""
                  onChange={() => {}}
                  className="w-32"
                />
                <span className="text-xs text-theme-text-tertiary">Answer: {gap.answer}</span>
              </div>
            ))}
          </div>
        );

      case 'COMPLIANCE':
        return (
          <div className="space-y-3">
            {question.content && 'statements' in question.content && (question.content.statements as ComplianceStatement[]).map((statement) => (
              <div key={statement.id} className="flex items-center justify-between">
                <Checkbox
                  id={`statement-${statement.id}`}
                  checked={false}
                  onChange={() => {}}
                  disabled
                  label={statement.text}
                />
                <Badge variant={statement.compliant ? 'success' : 'danger'} size="sm">
                  {statement.compliant ? 'Compliant' : 'Non-compliant'}
                </Badge>
              </div>
            ))}
          </div>
        );

      case 'ORDERING':
        return (
          <div className="space-y-3">
            {question.content && 'items' in question.content && (question.content.items as OrderingItem[]).map((item, index) => (
              <div key={item.id} className="flex items-center space-x-3">
                <span className="text-sm font-medium text-theme-text-tertiary w-8">{index + 1}.</span>
                <div className="flex-1 text-sm text-theme-text-secondary">{item.text}</div>
              </div>
            ))}
            <p className="text-xs text-theme-text-tertiary mt-2">Drag to reorder items</p>
          </div>
        );

      case 'HOTSPOT':
        return (
          <div className="space-y-3">
            {question.content && 'imageUrl' in question.content && (
              <div className="border border-theme-border-primary rounded-lg p-4 bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary">
                <div className="text-center text-theme-text-tertiary">
                  <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm">Image: {question.content.imageUrl}</p>
                </div>
              </div>
            )}
            {question.content && 'regions' in question.content && question.content.regions.length > 0 && (
              <div className="text-xs text-theme-text-tertiary">
                {question.content.regions.length} hotspot region(s) defined
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-sm text-theme-text-tertiary">
            Preview not available for this question type
          </div>
        );
    }
  };

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-lg">{getQuestionTypeIcon(question.type)}</span>
            <div>
              <h3 className="text-lg font-medium text-theme-text-primary">Question Preview</h3>
              <p className="text-sm text-theme-text-tertiary">{getQuestionTypeLabel(question.type)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant={
                question.difficulty === 'EASY'
                  ? 'success'
                  : question.difficulty === 'MEDIUM'
                  ? 'warning'
                  : 'danger'
              }
              size="sm"
            >
              {question.difficulty}
            </Badge>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="px-6 py-6">
        {/* Question Text */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-theme-text-secondary mb-2">Question:</h4>
          <div 
            className="prose max-w-none text-theme-text-primary"
            dangerouslySetInnerHTML={{ __html: question.questionText || 'No question text provided' }}
          />
        </div>

        {attachmentUrl && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-theme-text-secondary mb-2">Attachment:</h4>
            <img
              src={attachmentUrl}
              alt="Question attachment"
              className="max-w-full h-auto rounded-md border border-theme-border-primary"
            />
          </div>
        )}

        {/* Question Type Specific Content */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-theme-text-secondary mb-2">Answer Options:</h4>
          {renderQuestionContent()}
        </div>

        {/* Explanation */}
        {question.explanation && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-theme-text-secondary mb-2">Explanation:</h4>
            <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-md p-3 bg-theme-bg-primary text-theme-text-primary">
              <p className="text-sm text-theme-text-primary">{question.explanation}</p>
            </div>
          </div>
        )}

        {/* Hint */}
        {question.hint && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-theme-text-secondary mb-2">Hint:</h4>
            <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-md p-3 bg-theme-bg-primary text-theme-text-primary">
              <p className="text-sm text-theme-text-primary">{question.hint}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t border-theme-border-primary pt-4 bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
          <div className="grid grid-cols-2 gap-4 text-sm text-theme-text-tertiary">
            <div>
              <span className="font-medium">Type:</span> {getQuestionTypeLabel(question.type)}
            </div>
            <div>
              <span className="font-medium">Difficulty:</span> {question.difficulty}
            </div>
            {question.tagIds && question.tagIds.length > 0 && (
              <div className="col-span-2">
                <span className="font-medium">Tags:</span> {question.tagIds.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPreview; 
