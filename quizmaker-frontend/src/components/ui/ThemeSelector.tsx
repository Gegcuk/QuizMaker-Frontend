// ---------------------------------------------------------------------------
// ThemeSelector.tsx - Theme selection component for settings
// Provides a dropdown to select between light/dark/auto themes
// ---------------------------------------------------------------------------

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { getThemeIcon } from '@/components';
import Dropdown from './Dropdown';

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
  const { theme, setTheme, colorScheme, currentPalette, resolvedTheme } = useTheme();

  const namedPalette = colorScheme !== 'light' && colorScheme !== 'dark';

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
      <Dropdown
        label={label}
        ariaLabel={label || 'Theme'}
        value={namedPalette ? '' : theme}
        placeholder={namedPalette ? `${currentPalette.name} palette` : undefined}
        options={themeOptions.map((option) => ({
          value: option.value,
          label: option.label,
          icon: showIcons ? option.icon : undefined,
        }))}
        onChange={(nextTheme) => {
          const selectedTheme = Array.isArray(nextTheme) ? nextTheme[0] : nextTheme;
          setTheme(selectedTheme as 'light' | 'dark' | 'auto');
        }}
        helperText={
          namedPalette
            ? `${currentPalette.name} uses a ${resolvedTheme} appearance. Choosing a mode switches to Light or Dark.`
            : theme === 'auto'
            ? 'Uses your system preference'
            : theme === 'light'
              ? 'Always use light theme'
              : 'Always use dark theme'
        }
        fullWidth
      />
    </div>
  );
};

export default ThemeSelector;
