// src/features/quiz/components/IconPicker.tsx
// ---------------------------------------------------------------------------
// Icon picker component for selecting group icons (emojis)
// Provides common emoji icons organized by category
// ---------------------------------------------------------------------------

import React, { useState } from 'react';

interface IconPickerProps {
  value?: string;
  onChange: (icon: string | undefined) => void;
  className?: string;
}

// Common emoji icons organized by category
const ICON_CATEGORIES = [
  {
    name: 'Books & Learning',
    icons: ['📚', '📖', '📝', '📋', '📄', '📑', '🎓', '✏️', '📏', '📐']
  },
  {
    name: 'Topics & Subjects',
    icons: ['💻', '🔬', '🧪', '⚗️', '🔭', '🌍', '🧮', '📊', '📈', '📉']
  },
  {
    name: 'Organizational',
    icons: ['📁', '📂', '🗂️', '📌', '📍', '🏷️', '🔖', '📎', '📝', '🔗']
  },
  {
    name: 'Favorites',
    icons: ['⭐', '🌟', '💫', '✨', '🎯', '🎨', '🎭', '🎪', '🎬', '🎵']
  },
  {
    name: 'Time & Progress',
    icons: ['⏰', '⏱️', '⏲️', '🕐', '📅', '📆', '🗓️', '✅', '✔️', '🔘']
  },
  {
    name: 'Communication',
    icons: ['💬', '💭', '📢', '📣', '📤', '📥', '📮', '✉️', '📧', '📨']
  },
  {
    name: 'Numbers',
    icons: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
  },
  {
    name: 'Symbols',
    icons: ['⚡', '🔥', '💡', '🧩', '🎲', '🎴', '🃏', '🀄', '🎰', '🎪']
  }
];

const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const handleIconClick = (icon: string) => {
    onChange(icon === value ? undefined : icon);
  };

  const handleRemoveIcon = () => {
    onChange(undefined);
  };

  const allIcons = ICON_CATEGORIES.flatMap(cat => cat.icons);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-theme-text-primary mb-2">
        Icon <span className="text-theme-text-secondary">(optional)</span>
      </label>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1 mb-3 p-1 bg-theme-bg-secondary rounded-md border border-theme-border-primary">
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className={`
            px-2 py-1 text-xs rounded transition-colors
            ${showAll 
              ? 'bg-theme-interactive-primary text-theme-text-inverse' 
              : 'text-theme-text-secondary hover:bg-theme-bg-tertiary'
            }
          `}
        >
          All
        </button>
        {ICON_CATEGORIES.map((category, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              setSelectedCategory(index);
              setShowAll(false);
            }}
            className={`
              px-2 py-1 text-xs rounded transition-colors truncate max-w-[100px]
              ${!showAll && selectedCategory === index 
                ? 'bg-theme-interactive-primary text-theme-text-inverse' 
                : 'text-theme-text-secondary hover:bg-theme-bg-tertiary'
              }
            `}
            title={category.name}
          >
            {category.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-8 gap-2 p-3 bg-theme-bg-secondary rounded-md border border-theme-border-primary max-h-48 overflow-y-auto">
        {(showAll ? allIcons : ICON_CATEGORIES[selectedCategory].icons).map((icon, index) => {
          const categoryName = showAll ? '' : ICON_CATEGORIES[selectedCategory].name;
          const ariaLabel = showAll 
            ? `Select ${icon} icon` 
            : `Select ${categoryName} icon ${icon}`;
          
          return (
            <button
              key={`${icon}-${index}`}
              type="button"
              onClick={() => handleIconClick(icon)}
              className={`
                w-10 h-10 text-2xl rounded-md border-2 transition-all duration-200 flex items-center justify-center
                ${value === icon 
                  ? 'border-theme-interactive-primary ring-2 ring-offset-2 ring-offset-theme-bg-secondary ring-theme-interactive-primary bg-theme-bg-primary scale-110' 
                  : 'border-transparent hover:border-theme-border-primary hover:bg-theme-bg-primary hover:scale-105'
                }
              `}
              title={icon}
              aria-label={ariaLabel}
            >
              {icon}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IconPicker;

