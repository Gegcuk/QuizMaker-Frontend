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
  type = 'button',
  ...props
}) => {
  const baseClasses = 'theme-control inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-theme-bg-primary disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-theme-control-primary-default-fill text-theme-control-primary-default-foreground border-2 border-transparent enabled:hover:bg-theme-control-primary-hover-fill enabled:hover:text-theme-control-primary-hover-foreground',
    secondary: 'bg-theme-control-secondary-default-fill text-theme-control-secondary-default-foreground border-2 border-transparent enabled:hover:bg-theme-control-secondary-hover-fill enabled:hover:text-theme-control-secondary-hover-foreground',
    success: 'bg-theme-control-success-default-fill text-theme-control-success-default-foreground border-2 border-transparent enabled:hover:bg-theme-control-success-hover-fill enabled:hover:text-theme-control-success-hover-foreground',
    danger: 'bg-theme-control-danger-default-fill text-theme-control-danger-default-foreground border-2 border-transparent enabled:hover:bg-theme-control-danger-hover-fill enabled:hover:text-theme-control-danger-hover-foreground',
    warning: 'bg-theme-control-warning-default-fill text-theme-control-warning-default-foreground border-2 border-transparent enabled:hover:bg-theme-control-warning-hover-fill enabled:hover:text-theme-control-warning-hover-foreground',
    info: 'bg-theme-control-info-default-fill text-theme-control-info-default-foreground border-2 border-transparent enabled:hover:bg-theme-control-info-hover-fill enabled:hover:text-theme-control-info-hover-foreground',
    outline: 'border-2 border-theme-interactive-primary text-theme-interactive-primary enabled:hover:bg-theme-bg-tertiary',
    ghost: 'border-2 border-transparent text-theme-interactive-primary enabled:hover:bg-theme-bg-tertiary',
  };

  const disabledClasses = disabled || loading || props['aria-disabled'] === true || props['aria-disabled'] === 'true'
    ? 'theme-control-disabled' : '';

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
    disabledClasses,
    roundedClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
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
