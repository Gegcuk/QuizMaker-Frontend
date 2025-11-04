import React, { forwardRef, useId } from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightIconClickable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  rightIconClickable = false,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  className = '',
  id,
  onChange,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  
  const isNumberInput = props.type === 'number';

  const baseClasses = 'block w-full border-theme-border-primary rounded-md shadow-sm bg-theme-bg-primary text-theme-text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary disabled:bg-theme-bg-secondary disabled:text-theme-text-tertiary disabled:cursor-not-allowed [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]';
  
  const variantClasses = {
    default: 'border-theme-border-primary bg-theme-bg-primary',
    filled: 'border-transparent bg-theme-bg-secondary focus:bg-theme-bg-primary',
    outlined: 'border-2 border-theme-border-primary bg-theme-bg-primary'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const errorClasses = error ? 'border-theme-border-danger focus:ring-theme-interactive-danger focus:border-theme-border-danger' : '';
  const widthClass = fullWidth ? 'w-full' : '';
  const iconPadding = leftIcon ? 'pl-10' : '';
  const rightIconPadding = rightIcon ? 'pr-10' : '';
  const numberInputPadding = isNumberInput ? 'pr-8' : '';

  const inputClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    errorClasses,
    widthClass,
    iconPadding,
    rightIconPadding,
    numberInputPadding,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-theme-text-secondary mb-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-theme-text-tertiary">
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          onChange={onChange}
          {...props}
        />
        
        {rightIcon && (
          <div className={`absolute inset-y-0 right-0 pr-3 flex items-center ${rightIconClickable ? '' : 'pointer-events-none'}`}>
            <div className="text-theme-text-tertiary">
              {rightIcon}
            </div>
          </div>
        )}
        
        {/* Custom number input controls */}
        {isNumberInput && (
          <div className="absolute inset-y-0 right-0 flex flex-col border-l border-theme-border-primary rounded-md">
            <button
              type="button"
              className="flex-1 flex items-center justify-center px-2 text-theme-text-tertiary hover:text-theme-text-primary hover:bg-theme-bg-tertiary focus:outline-none focus:bg-theme-bg-tertiary transition-colors"
              onClick={() => {
                if (onChange) {
                  // Use props instead of DOM reads to avoid stale values
                  const currentValue = typeof props.value === 'number' ? props.value : parseInt(props.value as string) || 0;
                  const step = props.step ? Number(props.step) : 1;
                  const min = props.min != null ? Number(props.min) : undefined;
                  const max = props.max != null ? Number(props.max) : undefined;
                  
                  let newValue = currentValue + step;
                  if (max !== undefined && newValue > max) newValue = max;
                  if (min !== undefined && newValue < min) newValue = min;
                  
                  // Directly call React's onChange handler with the computed value
                  const syntheticEvent = {
                    target: { value: newValue.toString() },
                    currentTarget: { value: newValue.toString() }
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange(syntheticEvent);
                }
              }}
              tabIndex={-1}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center px-2 text-theme-text-tertiary hover:text-theme-text-primary hover:bg-theme-bg-tertiary focus:outline-none focus:bg-theme-bg-tertiary transition-colors"
              onClick={() => {
                if (onChange) {
                  // Use props instead of DOM reads to avoid stale values
                  const currentValue = typeof props.value === 'number' ? props.value : parseInt(props.value as string) || 0;
                  const step = props.step ? Number(props.step) : 1;
                  const min = props.min != null ? Number(props.min) : undefined;
                  const max = props.max != null ? Number(props.max) : undefined;
                  
                  let newValue = currentValue - step;
                  if (min !== undefined && newValue < min) newValue = min;
                  if (max !== undefined && newValue > max) newValue = max;
                  
                  // Directly call React's onChange handler with the computed value
                  const syntheticEvent = {
                    target: { value: newValue.toString() },
                    currentTarget: { value: newValue.toString() }
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange(syntheticEvent);
                }
              }}
              tabIndex={-1}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-theme-interactive-danger">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-theme-text-tertiary">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 
