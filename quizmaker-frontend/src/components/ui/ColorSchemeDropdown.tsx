// ---------------------------------------------------------------------------
// ColorSchemeDropdown.tsx - Expandable theme selector for navbar
// Shows current theme icon by default, expands to show all themes when clicked
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
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSchemeIcon = (paletteId: string) => {
    switch (paletteId) {
      case 'light':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'dark':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      case 'blue':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      case 'purple':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case 'green':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
          </svg>
        );
    }
  };

  const currentPalette = availablePalettes.find(p => p.id === colorScheme);

  const handleThemeSelect = (paletteId: string) => {
    setColorScheme(paletteId);
    setIsExpanded(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Default collapsed state - shows only current theme */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-2 rounded-lg text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary transition-all duration-200"
        aria-label={`Current theme: ${currentPalette?.name || 'Theme'}. Click to see all themes.`}
        title={`Current: ${currentPalette?.name || 'Theme'}. Click to change theme.`}
      >
        {getSchemeIcon(colorScheme)}
      </button>

      {/* Expanded state - shows all themes */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-1 flex items-center bg-theme-bg-primary border border-theme-border-primary rounded-lg p-1 shadow-lg z-50">
          {availablePalettes.map((palette) => (
            <button
              key={palette.id}
              onClick={() => handleThemeSelect(palette.id)}
              className={`p-1.5 rounded-md transition-all duration-200 ${
                colorScheme === palette.id
                  ? 'bg-theme-interactive-primary text-theme-text-inverse shadow-sm'
                  : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary'
              }`}
              aria-label={`Switch to ${palette.name} theme`}
              title={palette.name}
            >
              {getSchemeIcon(palette.id)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorSchemeDropdown;
