// ---------------------------------------------------------------------------
// InstructionsModal.tsx - Reusable modal for displaying instructions
// ---------------------------------------------------------------------------

import React from 'react';

interface InstructionsModalProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`bg-theme-bg-secondary border border-theme-border-primary rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-theme-text-tertiary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-theme-text-primary">{title}</h3>
          <div className="mt-2 text-sm text-theme-text-secondary">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionsModal;
