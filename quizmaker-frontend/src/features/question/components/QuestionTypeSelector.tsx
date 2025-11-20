// ---------------------------------------------------------------------------
// QuestionTypeSelector.tsx - Question type selection component
// Based on QuestionType from API documentation
// ---------------------------------------------------------------------------

import React from 'react';
import { QuestionType } from '@/types';
import {
  CheckCircleIcon,
  Squares2X2Icon,
  CheckBadgeIcon,
  PencilSquareIcon,
  ClipboardDocumentCheckIcon,
  ArrowsUpDownIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

interface QuestionTypeSelectorProps {
  selectedType?: QuestionType | null;
  onTypeChange: (type: QuestionType) => void;
  className?: string;
}

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  className = ''
}) => {
  const questionTypes = [
    {
      type: 'MCQ_SINGLE' as QuestionType,
      label: 'Single Choice',
      description: 'Choose one correct answer from multiple options',
      icon: CheckCircleIcon,
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    },
    {
      type: 'MCQ_MULTI' as QuestionType,
      label: 'Multiple Choice',
      description: 'Choose multiple correct answers from options',
      icon: Squares2X2Icon,
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    },
    {
      type: 'TRUE_FALSE' as QuestionType,
      label: 'True/False',
      description: 'Simple true or false question',
      icon: CheckBadgeIcon,
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    },
    {
      type: 'FILL_GAP' as QuestionType,
      label: 'Fill in the Blank',
      description: 'Complete missing words in text',
      icon: PencilSquareIcon,
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    },
    {
      type: 'COMPLIANCE' as QuestionType,
      label: 'Compliance',
      description: 'Identify compliant/non-compliant statements',
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    },
    {
      type: 'ORDERING' as QuestionType,
      label: 'Ordering',
      description: 'Arrange items in correct order',
      icon: ArrowsUpDownIcon,
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    },
    {
      type: 'MATCHING' as QuestionType,
      label: 'Matching',
      description: 'Match items from two columns together',
      icon: LinkIcon,
      color: 'bg-theme-bg-tertiary border-theme-border-primary text-theme-text-secondary'
    }
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {questionTypes.map((questionType) => {
        const isSelected = selectedType === questionType.type;
        return (
          <button
            type="button"
            key={questionType.type}
            className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all min-w-0 ${
              isSelected
                ? 'bg-theme-bg-secondary border-theme-interactive-primary shadow-md'
                : 'bg-theme-bg-primary border-theme-border-primary hover:border-theme-border-secondary hover:shadow-sm'
            }`}
            onClick={() => onTypeChange(questionType.type)}
          >
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start min-w-0">
                {(() => { const Icon = questionType.icon; return <Icon className={`w-5 h-5 mr-2 flex-shrink-0 ${isSelected ? 'text-theme-interactive-primary' : 'text-theme-text-tertiary'}`} />; })()}
                <div className="flex-1 min-w-0">
                  <label className={`text-sm font-medium cursor-pointer block break-words ${isSelected ? 'text-theme-interactive-primary' : 'text-theme-text-primary'}`}>
                    {questionType.label}
                  </label>
                  <p className="mt-1 text-sm text-theme-text-tertiary hidden sm:block break-words">
                    {questionType.description}
                  </p>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default QuestionTypeSelector; 
