import React, { forwardRef, useId, useEffect, useRef } from 'react';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  fullWidth?: boolean;
  showCharCount?: boolean;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  showCharCount = false,
  autoResize = false,
  minRows,
  maxRows,
  className = '',
  id,
  onChange,
  value,
  maxLength,
  ...props
}, ref) => {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

  const baseClasses = 'block w-full border-theme-border-primary rounded-md shadow-sm bg-theme-bg-primary text-theme-text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary disabled:bg-theme-bg-secondary disabled:text-theme-text-tertiary disabled:cursor-not-allowed resize-y';
  
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

  const widthClass = fullWidth ? 'w-full' : '';
  
  const errorClasses = error
    ? 'border-theme-border-danger focus:ring-theme-interactive-danger focus:border-theme-border-danger'
    : '';

  const textareaClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${errorClasses} ${className}`.trim();

  // Auto-resize functionality
  useEffect(() => {
    if (!autoResize || !textareaRef.current) return;

    const textarea = textareaRef.current;
    
    const adjustHeight = () => {
      textarea.style.height = 'auto';
      
      let newHeight = textarea.scrollHeight;
      
      if (minRows) {
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
        const minHeight = lineHeight * minRows;
        newHeight = Math.max(newHeight, minHeight);
      }
      
      if (maxRows) {
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
        const maxHeight = lineHeight * maxRows;
        newHeight = Math.min(newHeight, maxHeight);
      }
      
      textarea.style.height = `${newHeight}px`;
    };

    adjustHeight();
  }, [value, autoResize, minRows, maxRows]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    
    if (onChange) {
      onChange(e);
    }
  };

  const currentLength = typeof value === 'string' ? value.length : (props.defaultValue?.toString().length || 0);

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-theme-text-secondary mb-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          id={textareaId}
          className={textareaClasses}
          onChange={handleChange}
          value={value}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />
      </div>

      {/* Character count, helper text, or error */}
      <div className="mt-1 flex items-center justify-between">
        <div className="flex-1">
          {error && (
            <p id={`${textareaId}-error`} className="text-sm text-theme-text-danger">
              {error}
            </p>
          )}
          {!error && helperText && (
            <p id={`${textareaId}-helper`} className="text-sm text-theme-text-tertiary">
              {helperText}
            </p>
          )}
        </div>
        
        {showCharCount && (
          <p className="text-xs text-theme-text-tertiary ml-2">
            {currentLength}{maxLength ? `/${maxLength}` : ''} {maxLength && currentLength > maxLength ? '(exceeded)' : ''}
          </p>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;

