// ---------------------------------------------------------------------------
// AddItemButton.tsx - Reusable add item button component
// ---------------------------------------------------------------------------

import React from 'react';

interface AddItemButtonProps {
  onClick: () => void;
  itemType: string;
  disabled?: boolean;
  className?: string;
}

const AddItemButton: React.FC<AddItemButtonProps> = ({
  onClick,
  itemType,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex justify-center ${className}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="inline-flex items-center px-4 py-2 border border-theme-border-primary rounded-md shadow-sm text-sm font-medium text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add {itemType}
      </button>
    </div>
  );
};

export default AddItemButton;
