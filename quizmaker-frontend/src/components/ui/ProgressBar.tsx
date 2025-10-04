import React from 'react';

export interface ProgressBarProps {
  value: number;
  max?: number;
  min?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  striped?: boolean;
  className?: string;
  label?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  min = 0,
  variant = 'default',
  size = 'md',
  showLabel = false,
  showPercentage = false,
  animated = false,
  striped = false,
  className = '',
  label
}) => {
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6'
  };

  const variantClasses = {
    default: 'bg-theme-interactive-primary',
    success: 'bg-theme-bg-overlay',
    warning: 'bg-theme-bg-overlay',
    danger: 'bg-theme-bg-overlay',
    info: 'bg-theme-bg-overlay'
  };

  const baseClasses = 'w-full bg-theme-bg-tertiary rounded-full overflow-hidden';
  const progressClasses = [
    'transition-all duration-300 ease-out',
    variantClasses[variant],
    sizeClasses[size],
    animated && 'animate-pulse',
    striped && 'bg-gradient-to-r from-transparent via-theme-focus-ring-offset to-transparent bg-[length:20px_100%] animate-pulse'
  ].filter(Boolean).join(' ');

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-theme-text-secondary">
            {label || 'Progress'}
          </span>
          {showPercentage && (
            <span className="text-sm text-theme-text-tertiary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={baseClasses}>
        <div
          className={progressClasses}
          style={{
            width: `${percentage}%`,
            backgroundSize: striped ? '20px 100%' : undefined
          }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-label={label || 'Progress'}
        />
      </div>
      
      {showLabel && !label && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-theme-text-tertiary">
            {value} / {max}
          </span>
          {showPercentage && (
            <span className="text-xs text-theme-text-tertiary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressBar; 