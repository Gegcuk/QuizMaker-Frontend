import React from 'react';

export interface CheckboxProps {
  id?: string;
  name?: string;
  checked: boolean;
  onChange: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  error,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked, e);
  };

  const checkboxClasses = [
    sizeClasses[size],
    'rounded',
    'border-theme-border-primary',
    'text-theme-interactive-primary',
    'focus:ring-theme-interactive-primary',
    'focus:ring-2',
    'focus:ring-offset-0',
    'bg-theme-bg-primary',
    'transition-colors',
    'duration-150',
    disabled ? (checked ? 'opacity-100 cursor-not-allowed' : 'opacity-50 cursor-not-allowed') : 'cursor-pointer',
    error ? 'border-theme-border-danger focus:ring-theme-interactive-danger' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={checkboxClasses}
          aria-describedby={description && id ? `${id}-description` : undefined}
          aria-invalid={error ? 'true' : 'false'}
        />
      </div>
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <label
              htmlFor={id}
              className={`font-medium ${labelSizeClasses[size]} ${
                disabled ? 'text-theme-text-tertiary cursor-not-allowed' : 'text-theme-text-secondary cursor-pointer'
              }`}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              id={id ? `${id}-description` : undefined}
              className={`text-xs ${
                disabled ? 'text-theme-text-tertiary' : 'text-theme-text-secondary'
              } mt-0.5`}
            >
              {description}
            </p>
          )}
        </div>
      )}
      {error && (
        <p className="mt-1 text-sm text-theme-interactive-danger">
          {error}
        </p>
      )}
    </div>
  );
};

export default Checkbox;

