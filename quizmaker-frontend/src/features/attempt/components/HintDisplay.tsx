// src/components/attempt/HintDisplay.tsx
// ---------------------------------------------------------------------------
// Component to display hints that are covered until user explicitly requests them
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { Button } from '@/components';

interface HintDisplayProps {
  hint: string;
  className?: string;
}

const HintDisplay: React.FC<HintDisplayProps> = ({ hint, className = '' }) => {
  const [isHintVisible, setIsHintVisible] = useState(false);

  const toggleHint = () => {
    setIsHintVisible(!isHintVisible);
  };

  return (
    <div className={`mb-4 ${className}`}>
      <Button
        type="button"
        onClick={toggleHint}
        variant="secondary"
        size="sm"
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        {isHintVisible ? 'Hide Hint' : 'Show Hint'}
      </Button>
      
      {isHintVisible && (
        <div className="mt-3 p-3 bg-theme-bg-tertiary border border-theme-border-primary rounded-md bg-theme-bg-primary text-theme-text-primary">
          <div className="text-sm text-theme-text-primary">
            <strong>Hint:</strong> {hint}
          </div>
        </div>
      )}
    </div>
  );
};

export default HintDisplay; 
