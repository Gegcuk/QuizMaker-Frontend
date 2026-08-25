import React, { ReactNode, useEffect, useId, useRef, useState } from 'react';
import Button, { ButtonProps } from './Button';

export interface ButtonWithValidationTooltipProps
  extends Omit<ButtonProps, 'children' | 'disabled'> {
  children: ReactNode;
  disabled?: boolean;
  validationErrors?: string[];
}

/**
 * Keeps validation-blocked actions discoverable without allowing submission.
 * Loading and other non-validation disabled states remain native disabled states.
 */
const ButtonWithValidationTooltip: React.FC<ButtonWithValidationTooltipProps> = ({
  children,
  disabled = false,
  validationErrors = [],
  loading = false,
  className = '',
  onBlur,
  onClick,
  onFocus,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  'aria-describedby': describedBy,
  ...buttonProps
}) => {
  const validationBlocked = disabled && !loading && validationErrors.length > 0;
  const nativeDisabled = disabled && !validationBlocked;
  const guidanceId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGuidanceVisible, setIsGuidanceVisible] = useState(false);
  const [guidanceStyle, setGuidanceStyle] = useState<React.CSSProperties>({});
  const [arrowLeft, setArrowLeft] = useState('50%');

  useEffect(() => {
    if (!validationBlocked || !containerRef.current) return;

    const updatePosition = () => {
      const container = containerRef.current;
      if (!container) return;

      const buttonRect = container.getBoundingClientRect();
      const form = container.closest('form');
      const boundaryRect = form?.getBoundingClientRect() ?? document.documentElement.getBoundingClientRect();
      const boundaryPadding = 16;
      const boundaryLeft = boundaryRect.left + boundaryPadding;
      const boundaryRight = boundaryRect.right - boundaryPadding;
      const availableWidth = boundaryRight - boundaryLeft;

      if (availableWidth <= 0) return;

      const guidanceWidth = Math.min(320, availableWidth);
      const preferredLeft = buttonRect.right - guidanceWidth;
      const guidanceLeft = Math.min(
        Math.max(preferredLeft, boundaryLeft),
        boundaryRight - guidanceWidth,
      );
      const buttonCenter = buttonRect.left + buttonRect.width / 2;
      const arrowPosition = Math.min(
        Math.max(buttonCenter - guidanceLeft, 12),
        guidanceWidth - 12,
      );

      setGuidanceStyle({
        left: `${guidanceLeft - buttonRect.left}px`,
        width: `${guidanceWidth}px`,
      });
      setArrowLeft(`${arrowPosition}px`);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [validationBlocked]);

  const showGuidance = () => {
    if (validationBlocked) setIsGuidanceVisible(true);
  };

  const hideGuidance = () => setIsGuidanceVisible(false);

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    if (validationBlocked) {
      event.preventDefault();
      event.stopPropagation();
      showGuidance();
      return;
    }

    onClick?.(event);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (validationBlocked && event.key === 'Escape') {
      hideGuidance();
      onKeyDown?.(event);
      return;
    }

    if (validationBlocked && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      event.stopPropagation();
      showGuidance();
      return;
    }

    onKeyDown?.(event);
  };

  const mergedDescription = [describedBy, validationBlocked ? guidanceId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={showGuidance}
      onMouseLeave={hideGuidance}
    >
      {validationBlocked && (
        <div
          id={guidanceId}
          role="tooltip"
          className={
            isGuidanceVisible
              ? 'absolute bottom-full z-50 mb-2 whitespace-normal'
              : 'sr-only'
          }
          style={isGuidanceVisible ? guidanceStyle : undefined}
        >
          <div className="relative w-full rounded-lg border border-theme-border-primary bg-theme-bg-primary p-3 shadow-lg">
            <div className="mb-2 text-sm font-medium text-theme-text-primary">
              Please complete the following:
            </div>
            <ul className="list-inside list-disc space-y-1 text-xs text-theme-text-secondary">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
            <span
              aria-hidden="true"
              className="absolute -bottom-1.5 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-theme-border-primary bg-theme-bg-primary"
              style={{ left: arrowLeft }}
            />
          </div>
        </div>
      )}

      <Button
        {...buttonProps}
        className={`${className} ${validationBlocked ? 'cursor-not-allowed opacity-50' : ''}`.trim()}
        disabled={nativeDisabled}
        loading={loading}
        aria-disabled={validationBlocked || undefined}
        aria-describedby={mergedDescription}
        onBlur={(event) => {
          hideGuidance();
          onBlur?.(event);
        }}
        onClick={handleClick}
        onFocus={(event) => {
          showGuidance();
          onFocus?.(event);
        }}
        onKeyDown={handleKeyDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </Button>
    </div>
  );
};

export default ButtonWithValidationTooltip;
