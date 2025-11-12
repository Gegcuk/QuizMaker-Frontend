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
      ? 'bg-theme-interactive-primary text-white border-theme-interactive-primary'
      : 'bg-theme-bg-secondary text-theme-text-secondary border-theme-border-primary hover:bg-theme-bg-tertiary',
    primary: selected
      ? 'bg-theme-interactive-primary text-white border-theme-interactive-primary'
      : 'bg-theme-bg-secondary text-theme-interactive-primary border-theme-interactive-primary hover:bg-theme-bg-tertiary',
    success: selected
      ? 'bg-theme-interactive-success text-white border-theme-interactive-success'
      : 'bg-theme-bg-secondary text-theme-interactive-success border-theme-interactive-success hover:bg-theme-bg-tertiary',
    warning: selected
      ? 'bg-theme-interactive-warning text-white border-theme-interactive-warning'
      : 'bg-theme-bg-secondary text-theme-interactive-warning border-theme-interactive-warning hover:bg-theme-bg-tertiary',
    danger: selected
      ? 'bg-theme-interactive-danger text-white border-theme-interactive-danger'
      : 'bg-theme-bg-secondary text-theme-interactive-danger border-theme-interactive-danger hover:bg-theme-bg-tertiary'
  };

  const baseClasses = 'inline-flex items-center font-medium rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-theme-interactive-primary';
  
  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
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

