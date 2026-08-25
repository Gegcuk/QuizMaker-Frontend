// ---------------------------------------------------------------------------
// ColorSchemeSelector.tsx - Color scheme selection component
// Allows users to choose from different color palettes
// ---------------------------------------------------------------------------

import React, { useId } from 'react';
import { useTheme } from '@/context/ThemeContext';
import type { ColorPalette } from '@/context/ColorPalettes';
import { getSchemeIcon } from '@/components';
import Radio from './Radio';

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
  const selectorId = useId();
  const descriptionId = `${selectorId}-description`;


  const ColorPreview: React.FC<{ palette: ColorPalette }> = ({ palette }) => {
    return (
      <div aria-hidden="true" className="flex space-x-1">
        <div 
          className="w-3 h-3 rounded-full border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
          style={{ backgroundColor: palette.colors.bg.primary }}
          title="Primary background"
        />
        <div 
          className="w-3 h-3 rounded-full border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
          style={{ backgroundColor: palette.colors.bg.secondary }}
          title="Secondary background"
        />
        <div 
          className="w-3 h-3 rounded-full border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
          style={{ backgroundColor: palette.colors.interactive.primary }}
          title="Primary interactive"
        />
        <div 
          className="w-3 h-3 rounded-full border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
          style={{ backgroundColor: palette.colors.accent }}
          title="Accent color"
        />
      </div>
    );
  };

  return (
    <fieldset aria-describedby={descriptionId} className={className}>
      <legend className={label ? 'block text-sm font-medium text-theme-text-secondary mb-3' : 'sr-only'}>
        {label || 'Color Scheme'}
      </legend>

      <div className="grid grid-cols-1 gap-3">
        {availablePalettes.map((palette) => (
          <label
            key={palette.id}
            htmlFor={`${selectorId}-${palette.id}`}
            className={`
              relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${colorScheme === palette.id 
                ? 'border-theme-interactive-primary bg-theme-bg-tertiary' 
                : 'border-theme-border-primary hover:border-theme-border-secondary'
              }
            `}
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
                <Radio
                  id={`${selectorId}-${palette.id}`}
                  name="color-scheme"
                  value={palette.id}
                  checked={colorScheme === palette.id}
                  onChange={setColorScheme}
                />
              </div>
            </div>
          </label>
        ))}
      </div>
      
      <div id={descriptionId} className="mt-3 text-xs text-theme-text-tertiary">
        Choose a color scheme that matches your preference. Changes apply immediately.
      </div>
    </fieldset>
  );
};

export default ColorSchemeSelector;
