// ---------------------------------------------------------------------------
// ColorSchemeSelector.tsx - Color scheme selection component
// Allows users to choose from different color palettes
// ---------------------------------------------------------------------------

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { ColorPalette } from '@/context/ColorPalettes';
import { getSchemeIcon } from '@/components';

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


  const ColorPreview: React.FC<{ palette: ColorPalette }> = ({ palette }) => {
    return (
      <div className="flex space-x-1">
        <div 
          className="w-3 h-3 rounded-full border border-theme-border-primary"
          style={{ backgroundColor: palette.colors.bg.primary }}
          title="Primary background"
        />
        <div 
          className="w-3 h-3 rounded-full border border-theme-border-primary"
          style={{ backgroundColor: palette.colors.bg.secondary }}
          title="Secondary background"
        />
        <div 
          className="w-3 h-3 rounded-full border border-theme-border-primary"
          style={{ backgroundColor: palette.colors.interactive.primary }}
          title="Primary interactive"
        />
        <div 
          className="w-3 h-3 rounded-full border border-theme-border-primary"
          style={{ backgroundColor: palette.colors.accent }}
          title="Accent color"
        />
      </div>
    );
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-theme-text-secondary mb-3">
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
                ? 'border-theme-interactive-primary bg-theme-bg-tertiary' 
                : 'border-theme-border-primary hover:border-theme-border-secondary'
              }
            `}
            onClick={() => setColorScheme(palette.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getSchemeIcon(palette.id, { size: 'sm' })}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-theme-text-primary">
                    {palette.name}
                  </h3>
                  <p className="text-xs text-theme-text-tertiary">
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
                  className="w-4 h-4 text-theme-interactive-primary border-theme-border-primary focus:ring-theme-focus-ring"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-theme-text-tertiary">
        Choose a color scheme that matches your preference. Changes apply immediately.
      </div>
    </div>
  );
};

export default ColorSchemeSelector;
