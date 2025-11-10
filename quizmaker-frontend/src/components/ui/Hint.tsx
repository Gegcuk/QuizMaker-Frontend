// src/components/ui/Hint.tsx
// ---------------------------------------------------------------------------
// Reusable hint component with tooltip/popover functionality
// Shows a question mark icon that displays hint text on hover or click
// ---------------------------------------------------------------------------

import React, { useState, useRef, useEffect } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export interface HintProps {
  /** The hint text to display */
  content: string | React.ReactNode;
  /** Position of the tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Size of the icon */
  size?: 'sm' | 'md' | 'lg';
  /** Trigger method */
  trigger?: 'hover' | 'click';
  /** Custom className for the hint icon */
  className?: string;
  /** Custom className for the tooltip */
  tooltipClassName?: string;
}

const Hint: React.FC<HintProps> = ({
  content,
  position = 'top',
  size = 'sm',
  trigger = 'hover',
  className = '',
  tooltipClassName = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const hintRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside (for click trigger)
  useEffect(() => {
    if (trigger !== 'click' || !isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (hintRef.current && !hintRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [trigger, isVisible]);

  // Icon size classes
  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Tooltip position classes
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  // Arrow position classes
  const arrowPositionClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-theme-bg-primary',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-theme-bg-primary',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-theme-bg-primary',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-theme-bg-primary'
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  return (
    <div
      ref={hintRef}
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Hint Icon */}
      <button
        type="button"
        className={`text-theme-text-tertiary hover:text-theme-interactive-primary transition-colors focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 rounded-full ${
          trigger === 'click' ? 'cursor-pointer' : 'cursor-help'
        }`}
        aria-label="Show hint"
      >
        <QuestionMarkCircleIcon className={iconSizeClasses[size]} />
      </button>

      {/* Tooltip */}
      {isVisible && (
        <div
          className={`absolute z-50 ${positionClasses[position]} ${tooltipClassName}`}
          role="tooltip"
        >
          {/* Tooltip Content */}
          <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg shadow-lg p-3 max-w-sm w-64">
            <div className="text-sm text-theme-text-secondary whitespace-normal">
              {content}
            </div>
          </div>

          {/* Tooltip Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowPositionClasses[position]}`}
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))' }}
          />
        </div>
      )}
    </div>
  );
};

export default Hint;

