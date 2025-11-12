import React from 'react';

export interface RadioProps {
  id?: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Radio: React.FC<RadioProps> = ({
  id,
  name,
  value,
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
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const descriptionId = id && description ? `${id}-description` : undefined;

  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          id={id}
          name={name}
          type="radio"
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          disabled={disabled}
          className={`
            ${sizeClasses[size]}
            text-theme-interactive-primary
            focus:ring-theme-interactive-primary
            focus:ring-2
            focus:ring-offset-0
            border-theme-border-primary
            bg-theme-bg-primary
            transition-colors
            duration-150
            cursor-pointer
            disabled:cursor-not-allowed
            disabled:opacity-50
            ${error ? 'border-theme-interactive-danger' : ''}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={descriptionId}
        />
      </div>
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <label
              htmlFor={id}
              className={`
                font-medium
                ${labelSizeClasses[size]}
                ${disabled ? 'text-theme-text-tertiary cursor-not-allowed' : 'text-theme-text-secondary cursor-pointer'}
                ${error ? 'text-theme-interactive-danger' : ''}
              `}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              id={descriptionId}
              className={`
                ${labelSizeClasses[size]}
                ${disabled ? 'text-theme-text-tertiary' : 'text-theme-text-tertiary'}
              `}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Radio;

