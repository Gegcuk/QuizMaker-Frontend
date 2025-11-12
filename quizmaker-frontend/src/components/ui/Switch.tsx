import React, { forwardRef, useId } from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  disabled?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(({
  label,
  description,
  size = 'md',
  error,
  disabled = false,
  checked = false,
  onChange,
  className = '',
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  const sizeClasses = {
    sm: {
      switch: 'w-9 h-5',
      thumb: 'h-4 w-4 after:h-4 after:w-4',
      translate: 'peer-checked:after:translate-x-4'
    },
    md: {
      switch: 'w-11 h-6',
      thumb: 'h-5 w-5 after:h-5 after:w-5',
      translate: 'peer-checked:after:translate-x-5'
    },
    lg: {
      switch: 'w-14 h-7',
      thumb: 'h-6 w-6 after:h-6 after:w-6',
      translate: 'peer-checked:after:translate-x-7'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex-1">
        {label && (
          <label
            htmlFor={switchId}
            className={`block text-sm font-medium ${
              disabled ? 'text-theme-text-tertiary' : 'text-theme-text-secondary'
            } ${error ? 'text-theme-text-danger' : ''}`}
          >
            {label}
          </label>
        )}
        {description && (
          <p
            className={`text-sm ${
              disabled ? 'text-theme-text-tertiary' : 'text-theme-text-tertiary'
            }`}
          >
            {description}
          </p>
        )}
        {error && (
          <p className="mt-1 text-sm text-theme-text-danger">{error}</p>
        )}
      </div>
      
      <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
          ref={ref}
          id={switchId}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
          aria-invalid={!!error}
          aria-describedby={error ? `${switchId}-error` : undefined}
          {...props}
        />
        <div
          className={`
            ${currentSize.switch}
            bg-theme-bg-tertiary
            rounded-full
            peer
            peer-focus:outline-none
            peer-focus:ring-4
            peer-focus:ring-theme-interactive-primary/20
            peer-checked:bg-theme-interactive-primary
            peer-disabled:bg-theme-bg-secondary
            peer-disabled:cursor-not-allowed
            after:content-['']
            after:absolute
            after:top-[2px]
            after:left-[2px]
            after:bg-theme-bg-primary
            after:border-theme-border-primary
            after:border
            after:rounded-full
            ${currentSize.thumb}
            after:transition-all
            ${currentSize.translate}
            ${error ? 'peer-focus:ring-theme-interactive-danger/20' : ''}
            transition-colors
            duration-200
          `}
        />
      </label>
    </div>
  );
});

Switch.displayName = 'Switch';

export default Switch;

