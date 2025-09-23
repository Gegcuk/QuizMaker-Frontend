// ---------------------------------------------------------------------------
// QuestionEditorHeader.tsx - Reusable header component for question editors
// ---------------------------------------------------------------------------

import React from 'react';

interface QuestionEditorHeaderProps {
  title: string;
  description: string;
  itemCount: number;
  itemType: string;
  emptyCount?: number;
  className?: string;
}

const QuestionEditorHeader: React.FC<QuestionEditorHeaderProps> = ({
  title,
  description,
  itemCount,
  itemType,
  emptyCount = 0,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <h4 className="text-lg font-medium text-theme-text-primary">{title}</h4>
        <p className="text-sm text-theme-text-tertiary">{description}</p>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-theme-text-tertiary">
          {itemCount} {itemType}{itemCount !== 1 ? 's' : ''}
        </span>
        {emptyCount > 0 && (
          <span className="text-xs text-theme-text-danger">
            {emptyCount} empty {itemType}{emptyCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
};

export default QuestionEditorHeader;
