import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

export interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactElement<{ 'aria-describedby'?: string }>;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: number;
  className?: string;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 200,
  maxWidth = 200,
  className = '',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const tooltipId = useId();
  const timeoutRef = useRef<number | undefined>(undefined);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const arrowClasses = {
    top: '-bottom-1 left-1/2 -translate-x-1/2',
    bottom: '-top-1 left-1/2 -translate-x-1/2',
    left: '-right-1 top-1/2 -translate-y-1/2',
    right: '-left-1 top-1/2 -translate-y-1/2',
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleFocus = () => {
    if (disabled) return;
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  // Update tooltip position when visible
  useLayoutEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.top - tooltipRect.height - 8;
          break;
        case 'bottom':
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.bottom + 8;
          break;
        case 'left':
          x = triggerRect.left - tooltipRect.width - 8;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
        case 'right':
          x = triggerRect.right + 8;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
      }

      // Ensure tooltip stays within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (x + tooltipRect.width > viewportWidth) {
        x = viewportWidth - tooltipRect.width - 8;
      }
      if (x < 8) {
        x = 8;
      }
      if (y + tooltipRect.height > viewportHeight) {
        y = viewportHeight - tooltipRect.height - 8;
      }
      if (y < 8) {
        y = 8;
      }

      setCoords({ x, y });
    }
  }, [isVisible, position]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <span
      ref={triggerRef}
      className={`inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {React.cloneElement(children, {
        'aria-describedby': disabled
          ? children.props['aria-describedby']
          : [children.props['aria-describedby'], tooltipId].filter(Boolean).join(' '),
      })}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          className="fixed z-50 px-3 py-2 text-sm text-theme-text-primary bg-theme-bg-overlay rounded-md shadow-lg pointer-events-none"
          style={{
            left: coords.x,
            top: coords.y,
            maxWidth: maxWidth
          }}
          role="tooltip"
        >
          <div className="relative">
            {content}
            {/* Arrow */}
            <div className={`absolute h-2 w-2 rotate-45 bg-theme-bg-overlay ${arrowClasses[position]}`} />
          </div>
        </div>
      )}
    </span>
  );
};

export default Tooltip;
