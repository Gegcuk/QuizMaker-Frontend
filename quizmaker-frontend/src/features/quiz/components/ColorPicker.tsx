// src/features/quiz/components/ColorPicker.tsx
// ---------------------------------------------------------------------------
// Color picker component for selecting group colors
// Provides preset colors and optional hex input
// ---------------------------------------------------------------------------

import React, { useState } from 'react';

interface ColorPickerProps {
  value?: string;
  onChange: (color: string | undefined) => void;
  className?: string;
}

// Preset colors that work well for group identification
const PRESET_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Amber', value: '#F59E0B' },
];

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [customColor, setCustomColor] = useState(value && !PRESET_COLORS.find(c => c.value === value) ? value : '');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handlePresetClick = (colorValue: string) => {
    setCustomColor('');
    setShowCustomInput(false);
    onChange(colorValue === value ? undefined : colorValue);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
      onChange(color);
    } else if (color === '') {
      onChange(undefined);
    }
  };

  const handleRemoveColor = () => {
    setCustomColor('');
    setShowCustomInput(false);
    onChange(undefined);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-theme-text-primary mb-2">
        Color <span className="text-theme-text-secondary">(optional)</span>
      </label>
      
      {/* Preset Colors Grid */}
      <div className="grid grid-cols-6 gap-2 mb-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => handlePresetClick(color.value)}
            className={`
              w-10 h-10 rounded-md border-2 transition-all duration-200
              ${value === color.value 
                ? 'border-theme-interactive-primary ring-2 ring-offset-2 ring-offset-theme-bg-primary ring-theme-interactive-primary scale-110' 
                : 'border-theme-border-primary hover:border-theme-border-secondary hover:scale-105'
              }
            `}
            style={{ backgroundColor: color.value }}
            title={color.name}
            aria-label={`Select ${color.name} color`}
          >
            {value === color.value && (
              <svg className="w-5 h-5 mx-auto text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* Custom Color Input */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="text-sm text-theme-interactive-primary hover:underline"
        >
          {showCustomInput ? 'Hide' : 'Custom color'}
        </button>
        
        {value && (
          <button
            type="button"
            onClick={handleRemoveColor}
            className="text-sm text-theme-text-secondary hover:text-theme-text-danger"
            title="Remove color"
          >
            Clear
          </button>
        )}
      </div>

      {showCustomInput && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="color"
            value={customColor || value || '#000000'}
            onChange={handleCustomColorChange}
            className="h-10 w-20 rounded border border-theme-border-primary cursor-pointer"
          />
          <input
            type="text"
            value={customColor || value || ''}
            onChange={handleCustomColorChange}
            placeholder="#000000"
            pattern="^#[0-9A-Fa-f]{6}$"
            maxLength={7}
            className="flex-1 px-3 py-2 border border-theme-border-primary rounded-md bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-transparent"
          />
        </div>
      )}

      {/* Selected Color Preview */}
      {value && (
        <div className="mt-3 flex items-center gap-2 p-2 rounded-md bg-theme-bg-secondary border border-theme-border-primary">
          <div
            className="w-6 h-6 rounded border border-theme-border-primary"
            style={{ backgroundColor: value }}
          />
          <span className="text-sm text-theme-text-secondary">{value}</span>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;

