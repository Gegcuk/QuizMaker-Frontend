// ---------------------------------------------------------------------------
// ThemeSelector.tsx - Theme selection component for settings
// Provides a dropdown to select between light/dark/auto themes
// ---------------------------------------------------------------------------

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { getThemeIcon } from '@/components';

interface ThemeSelectorProps {
  className?: string;
  label?: string;
  showIcons?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  className = '',
  label = 'Theme',
  showIcons = true
}) => {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: getThemeIcon('light', { size: 'sm' })
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: getThemeIcon('dark', { size: 'sm' })
    },
    {
      value: 'auto' as const,
      label: 'Auto (System)',
      icon: getThemeIcon('auto', { size: 'sm' })
    }
  ];

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-theme-text-secondary mb-2">
          {label}
        </label>
      )}
      
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
        className="
          block w-full px-3 py-2 pr-10
          border border-theme-border-primary
          rounded-md shadow-theme
          bg-theme-bg-primary
          text-theme-text-primary
          focus:outline-none focus:ring-2 focus:ring-theme-focus-ring focus:border-theme-focus-ring
        "
      >
        {themeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {showIcons ? `${option.label}` : option.label}
          </option>
        ))}
      </select>
      
      <div className="mt-2 text-xs text-theme-text-tertiary">
        {theme === 'auto' && 'Uses your system preference'}
        {theme === 'light' && 'Always use light theme'}
        {theme === 'dark' && 'Always use dark theme'}
      </div>
    </div>
  );
};

export default ThemeSelector;
