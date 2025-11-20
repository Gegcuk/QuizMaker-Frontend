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
 * 
 * Positioning logic:
 * - Starts at the top right corner of the button
 * - Extends to the left until hitting form/screen boundary
 * - If boundary is close, expands to the right as needed
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
  const [arrowRightOffset, setArrowRightOffset] = useState<string>('0px');
  const [buttonWidth, setButtonWidth] = useState<number>(0);

  useEffect(() => {
    if (shouldShowTooltip && containerRef.current) {
      const updatePosition = () => {
        const container = containerRef.current;
        if (!container) return;
        
        const buttonRect = container.getBoundingClientRect();
        const formElement = container.closest('form') as HTMLElement | null;
        const boundaryRect = formElement?.getBoundingClientRect() ?? document.body.getBoundingClientRect();

        const maxTooltipWidth = 500;
        const minTooltipWidth = 300;
        const padding = 16;
        
        // Get button position in viewport
        const buttonLeft = buttonRect.left;
        const buttonRight = buttonRect.right;
        const buttonWidth = buttonRect.width;
        setButtonWidth(buttonWidth);

        // Form/boundary horizontal limits (slightly inset by padding)
        const boundaryLeft = boundaryRect.left + padding;
        const boundaryRight = boundaryRect.right - padding;

        if (boundaryRight <= boundaryLeft) {
          return;
        }

        const maxPossibleWidth = Math.min(maxTooltipWidth, boundaryRight - boundaryLeft);
        
        // Step 1: Start with tooltip's right edge aligned with button's right edge
        // Tooltip extends to the left from there
        let tooltipRight = buttonRight;
        let tooltipLeft = tooltipRight - maxPossibleWidth;

        // Step 2: Clamp to the form/boundary's left edge
        if (tooltipLeft < boundaryLeft) {
          tooltipLeft = boundaryLeft;
        }

        let tooltipWidth = tooltipRight - tooltipLeft;

        // Step 3: If there's not enough space to the left, extend into the right side
        if (tooltipWidth < minTooltipWidth) {
          const requiredWidth = Math.min(minTooltipWidth, maxPossibleWidth);
          const spaceOnRight = boundaryRight - buttonRight;
          const additionalWidthNeeded = requiredWidth - tooltipWidth;

          if (spaceOnRight > 0 && additionalWidthNeeded > 0) {
            const expansion = Math.min(spaceOnRight, additionalWidthNeeded);
            tooltipRight = buttonRight + expansion;
            tooltipWidth = tooltipRight - tooltipLeft;
          }
        }

        // Final clamp to boundary on the right
        if (tooltipRight > boundaryRight) {
          const shiftLeft = tooltipRight - boundaryRight;
          tooltipRight -= shiftLeft;
          tooltipLeft -= shiftLeft;
          tooltipWidth = tooltipRight - tooltipLeft;
        }

        // Calculate position relative to button's left edge
        const relativeLeft = tooltipLeft - buttonLeft;

        setTooltipStyle({
          left: `${relativeLeft}px`,
          right: 'auto',
          transform: 'none',
          width: `${tooltipWidth}px`
        });

        // Position the arrow so it points to the button's right edge
        const buttonRightFromTooltipLeft = buttonWidth - relativeLeft;
        const arrowFromRight = Math.max(0, tooltipWidth - buttonRightFromTooltipLeft);
        setArrowRightOffset(`${arrowFromRight}px`);
      };

      updatePosition();
      
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
            ...tooltipStyle
          }}
        >
          <div 
            className="bg-theme-bg-primary border border-theme-border-primary rounded-lg shadow-lg p-3"
            style={{ minWidth: '300px', maxWidth: '100%' }}
          >
            <div className="text-sm font-medium text-theme-text-primary mb-2">
              Please complete the following:
            </div>
            <ul className="text-xs text-theme-text-secondary space-y-1 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
            {/* Arrow pointing down - aligned with button's right edge */}
            <div 
              className="absolute bottom-0 transform translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-theme-border-primary"
              style={{
                right: arrowRightOffset,
                transform: 'translateY(100%)'
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
