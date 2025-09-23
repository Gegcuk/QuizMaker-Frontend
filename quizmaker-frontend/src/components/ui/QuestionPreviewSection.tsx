// ---------------------------------------------------------------------------
// QuestionPreviewSection.tsx - Reusable preview section component
// ---------------------------------------------------------------------------

import React from 'react';

interface QuestionPreviewSectionProps {
  showPreview: boolean;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const QuestionPreviewSection: React.FC<QuestionPreviewSectionProps> = ({
  showPreview,
  title = "Preview",
  children,
  className = ''
}) => {
  if (!showPreview) return null;

  return (
    <div className={`bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-4 ${className}`}>
      <h5 className="text-sm font-medium text-theme-text-secondary mb-2">{title}</h5>
      <div className="text-sm text-theme-text-secondary">
        {children}
      </div>
    </div>
  );
};

export default QuestionPreviewSection;
