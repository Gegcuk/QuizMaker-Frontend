// ---------------------------------------------------------------------------
// ThemeToggle.tsx - Theme switcher component
// Provides a toggle button to switch between light/dark themes
// ---------------------------------------------------------------------------

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { getThemeIcon } from '@/components';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
  size = 'md'
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };


  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
      case 'auto': return 'Auto (System)';
      default: return 'Theme';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleTheme}
        className={`
          ${sizeClasses[size]}
          inline-flex items-center justify-center
          rounded-lg border border-theme-border-primary
          bg-theme-bg-primary
          text-theme-text-secondary
          hover:bg-theme-bg-secondary
          hover:text-theme-text-primary
          focus:outline-none focus:ring-2 focus:ring-theme-focus-ring focus:ring-offset-2 focus:ring-offset-theme-focus-ring-offset
          transition-all duration-200
        `}
        title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
        aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
      >
        {getThemeIcon(theme, { size })}
      </button>
      
      {showLabel && (
        <span className="text-sm text-theme-text-secondary">
          {getThemeLabel()}
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;
