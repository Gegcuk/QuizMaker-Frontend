import React, { forwardRef, useId, useRef } from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightIconClickable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  fullWidth?: boolean;
  hideNumberSpinners?: boolean;
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
  hideNumberSpinners = false,
  className = '',
  id,
  onChange,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;
  
  const isNumberInput = props.type === 'number' && !hideNumberSpinners;

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
          ref={(el) => {
            if (typeof ref === 'function') {
              ref(el);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
            }
            internalRef.current = el;
          }}
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
          <div className="absolute inset-y-0 right-0 flex flex-col border-l border-theme-border-primary rounded-r-md overflow-hidden">
            <button
              type="button"
              className="flex-1 flex items-center justify-center px-2 text-theme-text-tertiary hover:text-theme-text-primary hover:bg-theme-bg-tertiary active:bg-theme-bg-tertiary focus:outline-none transition-colors"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent focus and sticky hover state
                
                if (!onChange || !internalRef.current) return;
                
                const increment = () => {
                  if (!internalRef.current || !onChange) return;
                  
                  // Read current value from the DOM element
                  const currentValue = parseInt(internalRef.current.value) || 0;
                  const step = props.step ? Number(props.step) : 1;
                  const min = props.min != null ? Number(props.min) : undefined;
                  const max = props.max != null ? Number(props.max) : undefined;
                  
                  let newValue = currentValue + step;
                  if (max !== undefined && newValue > max) newValue = max;
                  if (min !== undefined && newValue < min) newValue = min;
                  
                  const syntheticEvent = {
                    target: { 
                      value: newValue.toString(),
                      name: props.name || '',
                      type: 'number'
                    },
                    currentTarget: { 
                      value: newValue.toString(),
                      name: props.name || '',
                      type: 'number'
                    }
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange(syntheticEvent);
                };
                
                // Initial increment
                increment();
                
                // Set up repeat on hold (after 500ms delay, then every 100ms)
                const timeout = setTimeout(() => {
                  const interval = setInterval(increment, 100);
                  
                  const stopRepeat = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', stopRepeat);
                  };
                  
                  document.addEventListener('mouseup', stopRepeat, { once: true });
                }, 500);
                
                const cleanup = () => {
                  clearTimeout(timeout);
                };
                
                document.addEventListener('mouseup', cleanup, { once: true });
              }}
              tabIndex={-1}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center px-2 text-theme-text-tertiary hover:text-theme-text-primary hover:bg-theme-bg-tertiary active:bg-theme-bg-tertiary focus:outline-none transition-colors"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent focus and sticky hover state
                
                if (!onChange || !internalRef.current) return;
                
                const decrement = () => {
                  if (!internalRef.current || !onChange) return;
                  
                  // Read current value from the DOM element
                  const currentValue = parseInt(internalRef.current.value) || 0;
                  const step = props.step ? Number(props.step) : 1;
                  const min = props.min != null ? Number(props.min) : undefined;
                  const max = props.max != null ? Number(props.max) : undefined;
                  
                  let newValue = currentValue - step;
                  if (min !== undefined && newValue < min) newValue = min;
                  if (max !== undefined && newValue > max) newValue = max;
                  
                  const syntheticEvent = {
                    target: { 
                      value: newValue.toString(),
                      name: props.name || '',
                      type: 'number'
                    },
                    currentTarget: { 
                      value: newValue.toString(),
                      name: props.name || '',
                      type: 'number'
                    }
                  } as React.ChangeEvent<HTMLInputElement>;
                  onChange(syntheticEvent);
                };
                
                // Initial decrement
                decrement();
                
                // Set up repeat on hold (after 500ms delay, then every 100ms)
                const timeout = setTimeout(() => {
                  const interval = setInterval(decrement, 100);
                  
                  const stopRepeat = () => {
                    clearInterval(interval);
                    document.removeEventListener('mouseup', stopRepeat);
                  };
                  
                  document.addEventListener('mouseup', stopRepeat, { once: true });
                }, 500);
                
                const cleanup = () => {
                  clearTimeout(timeout);
                };
                
                document.addEventListener('mouseup', cleanup, { once: true });
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
