import React from 'react';

export interface ChipProps {
  label: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm'
  };

  const variantClasses = {
    default: selected
      ? 'bg-theme-control-primary-default-fill text-theme-control-primary-default-foreground border-theme-control-primary-default-fill enabled:hover:bg-theme-control-primary-hover-fill enabled:hover:text-theme-control-primary-hover-foreground enabled:hover:border-theme-control-primary-hover-fill'
      : 'bg-theme-bg-secondary text-theme-text-secondary border-theme-border-control enabled:hover:bg-theme-bg-tertiary',
    primary: selected
      ? 'bg-theme-control-primary-default-fill text-theme-control-primary-default-foreground border-theme-control-primary-default-fill enabled:hover:bg-theme-control-primary-hover-fill enabled:hover:text-theme-control-primary-hover-foreground enabled:hover:border-theme-control-primary-hover-fill'
      : 'bg-theme-bg-secondary text-theme-interactive-primary border-theme-interactive-primary enabled:hover:bg-theme-bg-tertiary',
    success: selected
      ? 'bg-theme-control-success-default-fill text-theme-control-success-default-foreground border-theme-control-success-default-fill enabled:hover:bg-theme-control-success-hover-fill enabled:hover:text-theme-control-success-hover-foreground enabled:hover:border-theme-control-success-hover-fill'
      : 'bg-theme-bg-secondary text-theme-interactive-success border-theme-interactive-success enabled:hover:bg-theme-bg-tertiary',
    warning: selected
      ? 'bg-theme-control-warning-default-fill text-theme-control-warning-default-foreground border-theme-control-warning-default-fill enabled:hover:bg-theme-control-warning-hover-fill enabled:hover:text-theme-control-warning-hover-foreground enabled:hover:border-theme-control-warning-hover-fill'
      : 'bg-theme-bg-secondary text-theme-interactive-warning border-theme-interactive-warning enabled:hover:bg-theme-bg-tertiary',
    danger: selected
      ? 'bg-theme-control-danger-default-fill text-theme-control-danger-default-foreground border-theme-control-danger-default-fill enabled:hover:bg-theme-control-danger-hover-fill enabled:hover:text-theme-control-danger-hover-foreground enabled:hover:border-theme-control-danger-hover-fill'
      : 'bg-theme-bg-secondary text-theme-interactive-danger border-theme-interactive-danger enabled:hover:bg-theme-bg-tertiary'
  };

  const baseClasses = 'theme-control inline-flex items-center font-medium rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-theme-bg-primary focus-visible:ring-theme-focus-ring';
  
  const disabledClasses = disabled
    ? `theme-control-disabled theme-control-disabled-${variant === 'default' ? 'primary' : variant} cursor-not-allowed`
    : 'cursor-pointer';

  const chipClasses = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        className={chipClasses}
      >
        {label}
      </button>
    );
  }

  return (
    <span className={chipClasses}>
      {label}
    </span>
  );
};

export default Chip;

