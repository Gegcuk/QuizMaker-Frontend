import React, { ReactNode, useRef, useState, useEffect } from 'react';
import Button from './Button';

export interface ButtonWithValidationTooltipProps {
  /** The button children/content */
  children: ReactNode;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Array of validation error messages to display in the tooltip */
  validationErrors?: string[];
  /** Button props to pass through */
  [key: string]: any;
}

/**
 * A button component that displays a validation tooltip when disabled.
 * Shows a list of missing requirements/validation errors on hover.
 */
const ButtonWithValidationTooltip: React.FC<ButtonWithValidationTooltipProps> = ({
  children,
  disabled = false,
  validationErrors = [],
  ...buttonProps
}) => {
  const shouldShowTooltip = disabled && validationErrors.length > 0;
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (shouldShowTooltip && containerRef.current) {
      const updatePosition = () => {
        if (!containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const maxTooltipWidth = 500;
        const padding = 24;
        const viewportWidth = window.innerWidth;
        
        // Calculate button position in viewport
        const buttonLeft = containerRect.left;
        const buttonRight = containerRect.right;
        const buttonCenter = containerRect.left + containerRect.width / 2;
        const buttonWidth = containerRect.width;
        
        // Try to center the tooltip above the button
        const tooltipHalfWidth = maxTooltipWidth / 2;
        let idealTooltipLeft = buttonCenter - tooltipHalfWidth;
        let idealTooltipRight = idealTooltipLeft + maxTooltipWidth;
        
        // Check if it would overflow
        const wouldOverflowLeft = idealTooltipLeft < padding;
        const wouldOverflowRight = idealTooltipRight > viewportWidth - padding;
        
        let tooltipLeft: number;
        let actualMaxWidth: number;
        
        if (!wouldOverflowLeft && !wouldOverflowRight) {
          // Fits perfectly centered
          tooltipLeft = idealTooltipLeft;
          actualMaxWidth = maxTooltipWidth;
        } else if (wouldOverflowRight && !wouldOverflowLeft) {
          // Overflow on right - align tooltip's right edge to viewport edge
          tooltipLeft = viewportWidth - maxTooltipWidth - padding;
          // Ensure it doesn't go too far left
          tooltipLeft = Math.max(padding, tooltipLeft);
          actualMaxWidth = viewportWidth - tooltipLeft - padding;
        } else if (wouldOverflowLeft && !wouldOverflowRight) {
          // Overflow on left - align tooltip's left edge to padding
          tooltipLeft = padding;
          actualMaxWidth = Math.min(maxTooltipWidth, viewportWidth - tooltipLeft - padding);
        } else {
          // Overflow on both sides - maximize visible area
          tooltipLeft = padding;
          actualMaxWidth = viewportWidth - 2 * padding;
        }
        
        // Calculate relative position from button's left edge
        const relativeLeft = tooltipLeft - buttonLeft;
        
        setTooltipStyle({
          left: `${relativeLeft}px`,
          right: 'auto',
          transform: 'none',
          maxWidth: `${actualMaxWidth}px`
        });
      };

      // Initial calculation
      updatePosition();
      
      // Also update on resize
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [shouldShowTooltip]);

  return (
    <div ref={containerRef} className="relative group inline-block">
      {/* Tooltip for disabled button */}
      {shouldShowTooltip && (
        <div 
          ref={tooltipRef}
          className="absolute bottom-full mb-2 hidden group-hover:block z-50 pointer-events-none whitespace-normal" 
          style={{ 
            ...tooltipStyle,
            // Extra safety: ensure it never goes beyond viewport
            maxWidth: tooltipStyle.maxWidth ? `min(${tooltipStyle.maxWidth}, calc(100vw - 2rem))` : 'min(500px, calc(100vw - 2rem))'
          }}
        >
          <div 
            className="bg-theme-bg-primary border border-theme-border-primary rounded-lg shadow-lg p-3"
            style={{ minWidth: '300px', width: 'max-content', maxWidth: '100%' }}
          >
            <div className="text-sm font-medium text-theme-text-primary mb-2">
              Please complete the following:
            </div>
            <ul className="text-xs text-theme-text-secondary space-y-1 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
            {/* Arrow pointing down - centered relative to button */}
            <div 
              className="absolute bottom-0 transform translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-theme-border-primary"
              style={{
                // Calculate arrow position to point to button center
                // Button center is at: buttonLeft + buttonWidth/2
                // Tooltip left is at: buttonLeft + relativeLeft
                // So arrow should be at: (buttonWidth/2 - relativeLeft) from tooltip left
                left: tooltipStyle.left && typeof tooltipStyle.left === 'string'
                  ? `calc(50% - ${tooltipStyle.left})`
                  : '50%',
                transform: 'translateX(-50%) translateY(100%)'
              }}
            ></div>
          </div>
        </div>
      )}
      <Button
        {...buttonProps}
        disabled={disabled}
      >
        {children}
      </Button>
    </div>
  );
};

export default ButtonWithValidationTooltip;
