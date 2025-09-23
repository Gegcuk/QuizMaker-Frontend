// ---------------------------------------------------------------------------
// ColorSchemeDropdown.tsx - Compact color scheme selector for navbar
// Provides a dropdown to quickly switch between color schemes
// ---------------------------------------------------------------------------

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface ColorSchemeDropdownProps {
  className?: string;
}

const ColorSchemeDropdown: React.FC<ColorSchemeDropdownProps> = ({
  className = ''
}) => {
  const { colorScheme, setColorScheme, availablePalettes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const currentPalette = availablePalettes.find(p => p.id === colorScheme);

  const getSchemeIcon = (paletteId: string) => {
    switch (paletteId) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'blue':
        return '🌊';
      case 'purple':
        return '💜';
      case 'green':
        return '🌿';
      default:
        return '🎨';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary rounded-md transition-colors"
        title="Change color scheme"
      >
        <span className="text-lg">{getSchemeIcon(colorScheme)}</span>
        <span className="hidden sm:inline">{currentPalette?.name || 'Theme'}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-theme-bg-primary border border-theme-border-primary rounded-md shadow-lg z-50">
          <div className="py-1">
            {availablePalettes.map((palette) => (
              <button
                key={palette.id}
                onClick={() => {
                  setColorScheme(palette.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-2 text-left text-sm transition-colors
                  ${colorScheme === palette.id 
                    ? 'bg-theme-interactive-primary text-theme-text-inverse' 
                    : 'text-theme-text-primary hover:bg-theme-bg-tertiary'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getSchemeIcon(palette.id)}</span>
                  <div>
                    <div className="font-medium">{palette.name}</div>
                    <div className="text-xs opacity-75">{palette.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorSchemeDropdown;
