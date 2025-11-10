// src/components/ui/SortDropdown.tsx
// ---------------------------------------------------------------------------
// Reusable sort dropdown component
// Can be used for sorting any type of list
// ---------------------------------------------------------------------------

import React, { useState, useRef, useEffect } from 'react';
import Button from './Button';

export interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  options,
  value,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getCurrentLabel = () => {
    const currentOption = options.find(option => option.value === value);
    return currentOption ? currentOption.label : options[0]?.label || 'Sort';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Sort Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        rounded
        className="whitespace-nowrap"
        rightIcon={
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        }
      >
        <span className="hidden sm:inline">Sort by: {getCurrentLabel()}</span>
        <span className="sm:hidden">Sort by</span>
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-theme-bg-primary rounded-lg shadow-lg border border-theme-border-primary z-50">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionClick(option.value)}
                className={`w-full text-left px-4 py-2 hover:bg-theme-bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-theme-interactive-primary ${
                  value === option.value ? 'bg-theme-bg-tertiary text-theme-interactive-primary' : 'text-theme-text-secondary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{option.label}</div>
                  {value === option.value && (
                    <svg className="w-4 h-4 text-theme-interactive-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortDropdown;

