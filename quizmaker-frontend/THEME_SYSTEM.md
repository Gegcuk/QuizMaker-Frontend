# Multi-Color Scheme Theme System

This document explains how the advanced theme system works in QuizMaker and how to use it.

## Overview

The theme system provides:
- **Multiple Color Schemes**: Light, Dark, Ocean Blue, Royal Purple, Forest Green
- **Custom Color Palettes**: Easy to add new color schemes with specific RGB values
- **CSS Custom Properties**: Dynamic theming using CSS variables
- **Auto mode**: Automatically follows the user's system preference
- **Persistent storage**: Theme preference is saved in localStorage
- **Real-time switching**: Instant theme changes without page reload
- **Component Integration**: All components automatically adapt to color schemes

## Architecture

### Core Components

1. **ThemeContext** (`src/context/ThemeContext.tsx`)
   - Provides theme state and utilities
   - Manages color scheme selection
   - Handles theme persistence in localStorage
   - Manages system theme detection
   - Applies CSS custom properties to document root

2. **ColorPalettes** (`src/context/ColorPalettes.ts`)
   - Defines all available color schemes
   - Provides palette structure and validation
   - Generates CSS custom properties
   - Easy to extend with new color schemes

3. **ThemeToggle** (`src/components/ui/ThemeToggle.tsx`)
   - Toggle button for quick theme switching
   - Shows current theme icon
   - Available in different sizes (sm, md, lg)

4. **ColorSchemeSelector** (`src/components/ui/ColorSchemeSelector.tsx`)
   - Visual selector for color schemes
   - Shows color previews for each palette
   - Includes descriptions and icons
   - Radio button interface for selection

5. **ThemeSelector** (`src/components/ui/ThemeSelector.tsx`)
   - Dropdown selector for light/dark/auto modes
   - Shows all three theme options
   - Includes helpful descriptions

### Tailwind Configuration

- **CSS Custom Properties**: Dynamic theming using CSS variables
- **Theme color classes**: `theme-bg-primary`, `theme-text-primary`, etc.
- **Custom color palette**: Extended with primary and dark color scales
- **Shadow utilities**: Theme-aware shadow classes

## Usage

### Basic Theme Hook

```tsx
import { useTheme } from '@/context/ThemeContext';

function MyComponent() {
  const { 
    theme, 
    resolvedTheme, 
    colorScheme, 
    currentPalette,
    setTheme, 
    setColorScheme,
    toggleTheme,
    availablePalettes 
  } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      <p>Color scheme: {colorScheme}</p>
      <p>Current palette: {currentPalette.name}</p>
      
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setColorScheme('blue')}>Set Blue Scheme</button>
    </div>
  );
}
```

### Theme Toggle Button

```tsx
import { ThemeToggle } from '@/components/ui';

function Header() {
  return (
    <header>
      <h1>My App</h1>
      <ThemeToggle size="sm" showLabel={false} />
    </header>
  );
}
```

### Color Scheme Selector for Settings

```tsx
import { ColorSchemeSelector } from '@/components/ui';

function SettingsPage() {
  return (
    <div>
      <h2>Appearance</h2>
      <ColorSchemeSelector 
        label="Color Scheme" 
        showPreviews={true} 
      />
    </div>
  );
}
```

### Styling with Theme Colors

Use the new theme color classes for automatic color scheme adaptation:

```tsx
function Card() {
  return (
    <div className="
      bg-theme-bg-primary 
      text-theme-text-primary
      border border-theme-border-primary
      shadow-theme-lg
    ">
      <h3 className="text-lg font-semibold">Card Title</h3>
      <p className="text-theme-text-secondary">Card content</p>
    </div>
  );
}
```

### Legacy Dark Mode Support

You can still use the `dark:` prefix for backward compatibility:

```tsx
function LegacyCard() {
  return (
    <div className="
      bg-white dark:bg-gray-800 
      text-gray-900 dark:text-gray-100
      border border-gray-200 dark:border-gray-700
      shadow-lg dark:shadow-gray-900/20
    ">
      <h3 className="text-lg font-semibold">Card Title</h3>
      <p className="text-gray-600 dark:text-gray-400">Card content</p>
    </div>
  );
}
```

## Available Color Schemes

### Built-in Schemes
1. **Light** - Clean white theme with blue accents
2. **Dark** - Modern dark theme with blue accents  
3. **Ocean Blue** - Calming blue theme (your RGB colors)
4. **Royal Purple** - Rich purple theme (your RGB colors)
5. **Forest Green** - Natural green theme with earthy tones

### Theme Types
- `'light'`: Always use light theme
- `'dark'`: Always use dark theme  
- `'auto'`: Follow system preference

### Color Scheme
The `colorScheme` determines which color palette to use:
- `'light'` - Light color scheme
- `'dark'` - Dark color scheme
- `'blue'` - Ocean Blue color scheme
- `'purple'` - Royal Purple color scheme
- `'green'` - Forest Green color scheme

### Resolved Theme
The `resolvedTheme` is always either `'light'` or `'dark'` - it's the actual theme being applied.

For example:
- If `theme` is `'auto'` and system is dark → `resolvedTheme` is `'dark'`
- If `theme` is `'light'` → `resolvedTheme` is `'light'`

## Implementation Details

### CSS Custom Properties
The theme system applies CSS custom properties to the document root:

```html
<!-- Light mode -->
<html class="theme-light">
  <body class="min-h-screen bg-theme-bg-secondary text-theme-text-primary">

<!-- Dark mode -->  
<html class="theme-dark">
  <body class="min-h-screen bg-theme-bg-secondary text-theme-text-primary">

<!-- Blue mode -->  
<html class="theme-blue">
  <body class="min-h-screen bg-theme-bg-secondary text-theme-text-primary">
```

### CSS Variables
Each color scheme defines CSS custom properties:
```css
:root.theme-blue {
  --color-bg-primary: #d2e0fb;
  --color-bg-secondary: #fef9d9;
  --color-text-primary: #1e293b;
  --color-interactive-primary: #3b82f6;
  /* ... more variables */
}
```

### Storage
- Theme preference: `localStorage.getItem('quizmaker-theme')`
- Color scheme preference: `localStorage.getItem('quizmaker-color-scheme')`

### System Theme Detection
Uses `window.matchMedia('(prefers-color-scheme: dark)')` to detect system preference.

## Component Updates

### Already Updated Components
- ✅ **Navbar**: Full theme system support with color scheme integration
- ✅ **Button**: All variants use theme colors automatically
- ✅ **Layout**: Main content area uses theme colors
- ✅ **HomePage**: Example theme implementation
- ✅ **ColorSchemeSelector**: Visual color scheme picker
- ✅ **ThemeDemoPage**: Comprehensive theme showcase

### Components Needing Updates
To add theme support to any component, follow this pattern:

```tsx
// Old approach (dark mode only)
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">

// New approach (all color schemes)
<div className="bg-theme-bg-primary text-theme-text-primary border border-theme-border-primary">
```

### Common Theme Patterns

#### Background Colors
```css
/* Old approach */
bg-white dark:bg-gray-800
bg-gray-50 dark:bg-gray-900

/* New approach */
bg-theme-bg-primary
bg-theme-bg-secondary
bg-theme-bg-tertiary
```

#### Text Colors
```css
/* Old approach */
text-gray-900 dark:text-gray-100
text-gray-600 dark:text-gray-400

/* New approach */
text-theme-text-primary
text-theme-text-secondary
text-theme-text-tertiary
```

#### Interactive Elements
```css
/* Old approach */
bg-blue-600 hover:bg-blue-700

/* New approach */
bg-theme-interactive-primary hover:bg-theme-interactive-primary-hover
```

#### Borders and Shadows
```css
/* Old approach */
border-gray-200 dark:border-gray-700
shadow-lg dark:shadow-gray-900/20

/* New approach */
border-theme-border-primary
shadow-theme-lg
```

## Adding New Color Schemes

To add a new color scheme, simply create a new palette in `ColorPalettes.ts`:

```typescript
export const customPalette: ColorPalette = {
  id: 'custom',
  name: 'Custom Theme',
  description: 'Your custom color scheme',
  colors: {
    bg: {
      primary: '#your-primary-bg',
      secondary: '#your-secondary-bg',
      tertiary: '#your-tertiary-bg',
    },
    text: {
      primary: '#your-primary-text',
      secondary: '#your-secondary-text',
      tertiary: '#your-tertiary-text',
      inverse: '#your-inverse-text',
    },
    // ... define all colors
  },
};

// Add to colorPalettes array
export const colorPalettes: ColorPalette[] = [
  lightPalette,
  darkPalette,
  bluePalette,
  purplePalette,
  greenPalette,
  customPalette, // ← Add your new palette here
];
```

## Best Practices

1. **Use theme color classes** for automatic color scheme adaptation
2. **Test all color schemes** during development
3. **Consider contrast ratios** for accessibility across all schemes
4. **Use the ColorSchemeSelector** in development to test real-time switching
5. **Keep color palettes consistent** with your brand guidelines
6. **Provide meaningful names and descriptions** for color schemes

## Integration with User Settings

The theme system integrates with the existing user settings:

```tsx
// In UserSettings component
import { useTheme } from '@/context/ThemeContext';

function UserSettings() {
  const { theme, setTheme } = useTheme();
  
  // Sync with user preferences
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    // Also save to user profile if needed
    updateUserSettings({ theme: newTheme });
  };
  
  return (
    <ThemeSelector 
      value={theme}
      onChange={handleThemeChange}
    />
  );
}
```

## Browser Support

- **Modern browsers**: Full support
- **Older browsers**: Graceful degradation (falls back to light theme)
- **System theme detection**: Requires `matchMedia` support

## Performance

- **No CSS-in-JS**: Uses Tailwind classes for optimal performance
- **Minimal JavaScript**: Only theme state management
- **CSS-only transitions**: Smooth theme switching
- **Local storage**: Instant theme restoration on page load
