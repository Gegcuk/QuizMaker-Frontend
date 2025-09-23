// ---------------------------------------------------------------------------
// ColorSchemeSelector.tsx - Color scheme selection component
// Allows users to choose from different color palettes
// ---------------------------------------------------------------------------

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { ColorPalette } from '@/context/ColorPalettes';

interface ColorSchemeSelectorProps {
  className?: string;
  label?: string;
  showPreviews?: boolean;
}

const ColorSchemeSelector: React.FC<ColorSchemeSelectorProps> = ({
  className = '',
  label = 'Color Scheme',
  showPreviews = true
}) => {
  const { colorScheme, setColorScheme, availablePalettes } = useTheme();

  const getSchemeIcon = (palette: ColorPalette) => {
    switch (palette.id) {
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          </svg>
        );
      case 'purple':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
          </svg>
        );
      case 'green':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

  const ColorPreview: React.FC<{ palette: ColorPalette }> = ({ palette }) => {
    return (
      <div className="flex space-x-1">
        <div 
          className="w-3 h-3 rounded-full border border-gray-300"
          style={{ backgroundColor: palette.colors.bg.primary }}
          title="Primary background"
        />
        <div 
          className="w-3 h-3 rounded-full border border-gray-300"
          style={{ backgroundColor: palette.colors.bg.secondary }}
          title="Secondary background"
        />
        <div 
          className="w-3 h-3 rounded-full border border-gray-300"
          style={{ backgroundColor: palette.colors.interactive.primary }}
          title="Primary interactive"
        />
        <div 
          className="w-3 h-3 rounded-full border border-gray-300"
          style={{ backgroundColor: palette.colors.accent }}
          title="Accent color"
        />
      </div>
    );
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {label}
        </label>
      )}
      
      <div className="grid grid-cols-1 gap-3">
        {availablePalettes.map((palette) => (
          <div
            key={palette.id}
            className={`
              relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${colorScheme === palette.id 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
            onClick={() => setColorScheme(palette.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getSchemeIcon(palette)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {palette.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {palette.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {showPreviews && <ColorPreview palette={palette} />}
                <input
                  type="radio"
                  name="color-scheme"
                  value={palette.id}
                  checked={colorScheme === palette.id}
                  onChange={() => setColorScheme(palette.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Choose a color scheme that matches your preference. Changes apply immediately.
      </div>
    </div>
  );
};

export default ColorSchemeSelector;
