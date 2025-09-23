// ---------------------------------------------------------------------------
// ItemManagementContainer.tsx - Reusable container for managing items
// ---------------------------------------------------------------------------

import React from 'react';

interface ItemManagementContainerProps {
  title: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

const ItemManagementContainer: React.FC<ItemManagementContainerProps> = ({
  title,
  helperText,
  children,
  className = ''
}) => {
  return (
    <div className={`bg-theme-bg-secondary rounded-lg p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-medium text-theme-text-secondary">{title}</h5>
          {helperText && (
            <p className="text-xs text-theme-text-tertiary">{helperText}</p>
          )}
        </div>
        <div className="space-y-3">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ItemManagementContainer;
