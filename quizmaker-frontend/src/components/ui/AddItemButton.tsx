// ---------------------------------------------------------------------------
// AddItemButton.tsx - Reusable add item button component
// ---------------------------------------------------------------------------

import React from 'react';
import Button from './Button';

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
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        }
      >
        Add {itemType}
      </Button>
    </div>
  );
};

export default AddItemButton;
