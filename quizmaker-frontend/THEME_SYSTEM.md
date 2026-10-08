# Multi-Color Scheme Theme System

This document explains how the advanced theme system works in Quizzence and how to use it.

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
   - Shares resolution with the synchronous, CSP-hashed startup script

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

### Preference precedence

- Light and Dark mode select the built-in Light and Dark palettes.
- Auto mode selects the built-in palette matching the operating system and follows later system changes.
- Ocean Blue and Forest Green have a fixed light appearance. Royal Purple has a fixed dark appearance. These named palettes override the remembered mode while selected.
- Selecting Light or Dark in the palette picker also sets that explicit mode.
- While a named palette is active, the mode selector displays its palette name, so choosing any mode can leave it even if that mode was previously remembered. Choosing a mode, or using the quick toggle, leaves a named palette and selects a built-in palette. The toggle chooses the opposite of the currently rendered appearance.
- `colorScheme` and `currentPalette` describe the actual displayed palette; `resolvedTheme` describes its light or dark appearance. The root `dark` class and native browser control `color-scheme` always agree with that appearance.

For example, saved Dark mode plus Ocean Blue displays Ocean Blue with light browser controls. Choosing Dark mode then displays the built-in Dark palette. Auto plus a neutral palette follows system changes; Auto plus Royal Purple remains purple.

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

### Storage and pre-paint startup

The existing keys remain `quizmaker-theme` and `quizmaker-color-scheme`. Values are validated independently against supported modes and palette IDs; malformed values fall back to Auto and Light (or validated provider defaults). Storage access, reads, and writes may throw. Every operation is guarded, and a failed write leaves the current React preference usable in memory. No theme failure is logged with saved values or URL data.

`src/context/themeRuntime.ts` owns preference validation, appearance resolution, variable application, and safe persistence. Vite embeds that same self-contained resolver synchronously in the head, after the encoding and theme-color metadata and before body content. The security-header generator includes a hash of the final executable bytes; it does not add script `unsafe-inline`, evaluation, reporting collectors, or callback data. Prerendered content therefore receives the saved/system appearance before it can paint. React synchronizes subsequent changes in a layout effect.

Missing or throwing media detection falls back to light. The provider subscribes to system changes and cleans up its listener; named palettes remain pinned. The stylesheet is linked directly from the HTML head, so complete light CSS defaults keep every semantic variable available even if JavaScript cannot run.

### Explicit semantic pairs

`colors.controls` defines each filled control's default, hover, and opaque disabled `fill`/`foreground`; focus keeps that text pair and uses the separate focus ring. `colors.disabled` supplies an opaque disabled pair. Disabled chips and choice controls keep readable opaque colors. Unavailable buttons instead restore the appearance from main before #202: `colors.disabledButton` explicitly supplies those historical fill/foreground colors, the whole button uses 50% opacity, and filled buttons keep transparent borders. Outline and ghost buttons retain their original transparent fills and primary-colored text; only outline has a colored border. Header secondary actions retain their historical surface/text pair in `colors.disabledHeaderSecondary`. This applies to native disabled, loading, and validation-blocked actions. Native blocking and keyboard-reachable validation guidance remain unchanged; guidance itself stays opaque. Forced colors override fading with system colors. Status text/background pairs, matching card and badge foregrounds, and an opaque tooltip pair remain explicit. Enabled controls must not infer a foreground from `text.inverse`.

Use `bg-theme-control-primary-default-fill text-theme-control-primary-default-foreground`, together with its matching hover tokens, for a primary filled control. Use the shared `Button` for button actions. Selected `Chip` variants use these same authored control pairs, including hover. Their `aria-pressed` state exposes selection without relying on color. Existing interactive colors remain available for readable links, icons, and outlines; they are separate from button fills. Each matching pair has `foreground` and `badgeForeground` tokens.

Enabled normal text, opaque disabled chips/choices, and validation guidance must meet 4.5:1. Unavailable buttons retain historical colors and 50% opacity and are exempt from the text/boundary contrast thresholds used for enabled actions. Large text can use 3:1 only at 24 CSS px, or at least 18.667 CSS px with font weight 700 or greater. Required control boundaries and focus indicators meet 3:1. Inputs and choice controls use `border.control`, while decorative card borders keep their separate subtle tokens. Radio dots and checkbox marks use the explicit primary fill/foreground pair; forced colors restore native rendering. Forced colors use operating-system colors with visible borders, focus outlines, and non-color selection states. Reduced motion suppresses animations, transitions, and smooth scrolling; loading/status semantics remain available.

### Acceptance verification

- `ColorPalettes.test.ts`: every palette's surface, interactive default/hover, disabled, focus, status, matching card/badge, and tooltip contrast.
- `themeRuntime.test.ts` and `ThemeContext.test.tsx`: validated preferences, denied storage getters/readers/writers, in-memory updates, precedence, missing media APIs, system changes, and subscription cleanup. `tokenUtils.test.ts` covers the existing authentication fallback when a successful write probe is followed by a denied read.
- `OverlaysThemes.test.tsx` and matching component tests: retained accessible interactions and paired foreground consumers.
- `tests/smoke.test.mjs`: rendered default/hover/focus controls, exact historical unavailable button colors and 50% opacity (including loading, validation guidance, header actions and Submit Answer), every interactive Chip variant and selection state, and homepage contrast across all palettes, desktop/mobile/320 CSS px reflow, 200% text resizing, forced colors, reduced motion, bootstrap resolution with application modules blocked, storage failures, and startup CSS fallbacks. The 320 CSS px viewport represents the layout reflow of a 1280px desktop at 400% browser zoom; it does not simulate a browser's toolbar zoom control.
- `tests/seo/theme-startup.test.mjs`: delivered standalone bootstrap, early encoding, exact CSP hash, complete fallback variables, and callback-cleanup ordering. Existing SEO and production privacy gates verify prerender and callback behavior.

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
