import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = false,
  dot = false,
  removable = false,
  onRemove,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center font-medium';
  
  const variantClasses = {
    primary: 'bg-theme-bg-tertiary text-theme-text-primary',
    secondary: 'bg-theme-bg-tertiary text-theme-text-secondary',
    success: 'bg-theme-bg-tertiary text-theme-text-primary border border-theme-border-secondary',
    danger: 'bg-theme-bg-tertiary text-theme-text-primary border border-theme-border-secondary',
    warning: 'bg-theme-bg-tertiary text-theme-text-primary border border-theme-border-secondary',
    info: 'bg-theme-bg-tertiary text-theme-text-secondary border border-theme-border-secondary',
    outline: 'bg-transparent border border-theme-border-primary text-theme-text-secondary',
    neutral: 'bg-theme-bg-tertiary text-theme-text-secondary'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm'
  };

  const roundedClass = rounded ? 'rounded-full' : 'rounded-md';
  const dotClass = dot ? 'pl-1.5' : '';
  const removableClass = removable ? 'pr-1' : '';

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    roundedClass,
    dotClass,
    removableClass,
    className
  ].filter(Boolean).join(' ');

  const dotColors = {
    primary: 'bg-theme-text-primary',
    secondary: 'bg-theme-text-tertiary',
    success: 'bg-theme-text-primary',
    danger: 'bg-theme-text-primary',
    warning: 'bg-theme-text-primary',
    info: 'bg-theme-text-secondary',
    outline: 'bg-theme-text-tertiary',
    neutral: 'bg-theme-text-tertiary'
  };

  const handleRemove = (event: React.MouseEvent) => {
    event.stopPropagation();
    onRemove?.();
  };

  return (
    <span className={classes}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]}`} />
      )}
      {children}
      {removable && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-1.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-current hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
          aria-label="Remove badge"
        >
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

export default Badge; 