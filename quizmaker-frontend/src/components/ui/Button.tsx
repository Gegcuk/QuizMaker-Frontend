import React from 'react';
import Spinner from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  rounded = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-theme-bg-primary disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-theme-interactive-primary text-theme-text-inverse hover:bg-theme-interactive-primary-hover focus-visible:ring-theme-interactive-primary',
    secondary: 'bg-theme-interactive-secondary text-theme-text-inverse hover:bg-theme-interactive-secondary-hover focus-visible:ring-theme-interactive-secondary',
    success: 'bg-theme-interactive-success text-theme-text-inverse hover:bg-theme-interactive-success/90 focus-visible:ring-theme-interactive-success',
    danger: 'bg-theme-interactive-danger text-theme-text-inverse hover:bg-theme-interactive-danger/90 focus-visible:ring-theme-interactive-danger',
    warning: 'bg-theme-interactive-warning text-theme-text-inverse hover:bg-theme-interactive-warning/90 focus-visible:ring-theme-interactive-warning',
    info: 'bg-theme-interactive-info text-theme-text-inverse hover:bg-theme-interactive-info/90 focus-visible:ring-theme-interactive-info',
    outline: 'border-2 border-theme-interactive-primary text-theme-interactive-primary hover:bg-theme-bg-tertiary focus-visible:ring-theme-interactive-primary',
    ghost: 'text-theme-interactive-primary hover:bg-theme-bg-tertiary focus-visible:ring-theme-interactive-primary'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const roundedClass = rounded ? 'rounded-full' : 'rounded-lg';

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    roundedClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Spinner size="sm" className="mr-2" />
      )}
      {!loading && leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
};

export default Button; 