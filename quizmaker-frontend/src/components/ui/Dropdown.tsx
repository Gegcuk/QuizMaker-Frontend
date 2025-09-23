import React, { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  multiple = false,
  searchable = false,
  size = 'md',
  fullWidth = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const baseClasses = 'relative border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary disabled:bg-theme-bg-secondary disabled:text-theme-text-tertiary disabled:cursor-not-allowed';
  const errorClasses = error ? 'border-theme-border-danger focus:ring-theme-interactive-danger focus:border-theme-border-danger' : '';
  const widthClass = fullWidth ? 'w-full' : '';

  const dropdownClasses = [
    baseClasses,
    sizeClasses[size],
    errorClasses,
    widthClass,
    className
  ].filter(Boolean).join(' ');

  // Filter options based on search term
  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Get selected option(s) display text
  const getDisplayText = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      if (value.length === 1) {
        const option = options.find(opt => opt.value === value[0]);
        return option?.label || placeholder;
      }
      return `${value.length} items selected`;
    } else if (!multiple && typeof value === 'string') {
      const option = options.find(opt => opt.value === value);
      return option?.label || placeholder;
    }
    return placeholder;
  };

  // Handle option selection
  const handleOptionClick = (optionValue: string) => {
    if (optionValue === value) return;

    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-theme-text-secondary mb-1">
          {label}
        </label>
      )}
      
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          className={`${dropdownClasses} flex items-center justify-between w-full text-left`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className="truncate">{getDisplayText()}</span>
          <svg
            className={`h-5 w-5 text-theme-text-tertiary transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-theme-bg-primary border border-theme-border-primary rounded-md shadow-theme-lg max-h-60 overflow-auto">
            {searchable && (
              <div className="p-2 border-b border-theme-border-primary">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1 text-sm border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
                  autoFocus
                />
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-theme-text-tertiary">
                No options found
              </div>
            ) : (
              <div className="py-1">
                {filteredOptions.map((option) => {
                  const isSelected = multiple
                    ? Array.isArray(value) && value.includes(option.value)
                    : value === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`w-full px-4 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-bg-secondary focus:bg-theme-bg-secondary focus:outline-none ${
                        isSelected ? 'bg-theme-bg-tertiary text-theme-interactive-primary' : 'text-theme-text-primary'
                      } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => !option.disabled && handleOptionClick(option.value)}
                      disabled={option.disabled}
                    >
                      <div className="flex items-center">
                        {option.icon && (
                          <span className="mr-2">{option.icon}</span>
                        )}
                        <span className="truncate">{option.label}</span>
                        {isSelected && (
                          <svg
                            className="ml-auto h-4 w-4 text-theme-interactive-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-theme-interactive-danger">
          {error}
        </p>
      )}
    </div>
  );
};

export default Dropdown; 